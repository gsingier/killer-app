import db from '../db.js';
import { cryptoRandomString, generateSecretCode, generateGameCode, shuffle } from '../utils.js';

export class GameEngine {
  // Create game with selected mission categories and custom missions
  static createGame(name, selectedCategories = [], customMissions = []) {
    let code = generateGameCode();
    while (db.prepare('SELECT id FROM games WHERE code = ?').get(code)) {
      code = generateGameCode();
    }

    const gameId = cryptoRandomString();

    db.prepare(`
      INSERT INTO games (id, code, name, status) VALUES (?, ?, ?, 'draft')
    `).run(gameId, code, name);

    const gameMissions = [];

    if (selectedCategories.length > 0) {
      const placeholders = selectedCategories.map(() => '?').join(',');
      const defaults = db.prepare(`
        SELECT category, description FROM missions 
        WHERE game_id IS NULL AND category IN (${placeholders})
      `).all(...selectedCategories);

      for (const m of defaults) {
        gameMissions.push({
          id: cryptoRandomString(),
          category: m.category,
          description: m.description,
          is_custom: 0
        });
      }
    } else {
      const defaults = db.prepare('SELECT category, description FROM missions WHERE game_id IS NULL').all();
      for (const m of defaults) {
        gameMissions.push({
          id: cryptoRandomString(),
          category: m.category,
          description: m.description,
          is_custom: 0
        });
      }
    }

    for (const text of customMissions) {
      if (text && text.trim()) {
        gameMissions.push({
          id: cryptoRandomString(),
          category: 'Mot sur-mesure',
          description: text.trim(),
          is_custom: 1
        });
      }
    }

    const insertMission = db.prepare(`
      INSERT INTO missions (id, game_id, category, description, is_custom)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertAllMissions = db.transaction((missions) => {
      for (const m of missions) {
        insertMission.run(m.id, gameId, m.category, m.description, m.is_custom);
      }
    });

    insertAllMissions(gameMissions);

    return { gameId, code, name };
  }

  // Join game
  static joinGame(code, pseudo, role = 'player') {
    const game = db.prepare('SELECT * FROM games WHERE code = ?').get(code.toUpperCase().trim());
    if (!game) {
      throw new Error('Code de partie introuvable.');
    }

    if (game.status !== 'draft') {
      throw new Error('Cette partie a déjà commencé ou est terminée.');
    }

    const existing = db.prepare('SELECT id FROM users WHERE game_id = ? AND LOWER(pseudo) = LOWER(?)').get(game.id, pseudo.trim());
    if (existing) {
      throw new Error('Ce pseudo est déjà pris dans cette partie.');
    }

    const userId = cryptoRandomString();
    const secretCode = generateSecretCode();

    db.prepare(`
      INSERT INTO users (id, game_id, pseudo, secret_code, role, is_alive)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(userId, game.id, pseudo.trim(), secretCode, role);

    return {
      userId,
      gameId: game.id,
      gameCode: game.code,
      gameName: game.name,
      pseudo: pseudo.trim(),
      secretCode,
      role
    };
  }

  // Start game & initialize circular chain with UNIQUE words per player
  static startGame(gameId) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) throw new Error('Partie non trouvée.');
    if (game.status !== 'draft') throw new Error('La partie a déjà été lancée.');

    const players = db.prepare(`
      SELECT id, pseudo, secret_code FROM users WHERE game_id = ? AND is_alive = 1
    `).all(gameId);

    if (players.length < 3) {
      throw new Error('Au moins 3 joueurs sont requis pour démarrer la partie.');
    }

    const gameMissions = db.prepare(`
      SELECT id, description FROM missions WHERE game_id = ?
    `).all(gameId);

    if (gameMissions.length < players.length) {
      // If pool is smaller than players, copy remaining default missions
      const extraDefaults = db.prepare('SELECT category, description FROM missions WHERE game_id IS NULL').all();
      const insertMission = db.prepare('INSERT INTO missions (id, game_id, category, description, is_custom) VALUES (?, ?, ?, ?, 0)');
      for (const m of extraDefaults) {
        const newId = cryptoRandomString();
        insertMission.run(newId, gameId, m.category, m.description);
        gameMissions.push({ id: newId, description: m.description });
      }
    }

    const shuffledPlayers = shuffle(players);
    const shuffledMissions = shuffle(gameMissions);

    const n = shuffledPlayers.length;
    const insertContract = db.prepare(`
      INSERT INTO contracts (id, game_id, killer_id, target_id, mission_id, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);

    // Strictly unique word assignment: each player gets a unique mission index [0..n-1]
    const createContracts = db.transaction(() => {
      for (let i = 0; i < n; i++) {
        const killer = shuffledPlayers[i];
        const target = shuffledPlayers[(i + 1) % n];
        const mission = shuffledMissions[i]; // Unique word per contract!

        insertContract.run(
          cryptoRandomString(),
          gameId,
          killer.id,
          target.id,
          mission.id
        );
      }

      db.prepare("UPDATE games SET status = 'active' WHERE id = ?").run(gameId);
    });

    createContracts();

    return { success: true, playersCount: n };
  }

  // Core execution of a kill transaction (ensures reassigned word is NOT held by any other active player)
  static executeKill(contractId) {
    const contract = db.prepare(`
      SELECT c.*, m.description as mission_desc, k.pseudo as killer_pseudo, t.pseudo as target_pseudo
      FROM contracts c
      JOIN missions m ON c.mission_id = m.id
      JOIN users k ON c.killer_id = k.id
      JOIN users t ON c.target_id = t.id
      WHERE c.id = ?
    `).get(contractId);

    if (!contract) throw new Error('Contrat introuvable.');

    const { game_id: gameId, killer_id: killerId, target_id: targetId, mission_desc: missionDesc } = contract;

    return db.transaction(() => {
      // 1. Mark contract completed
      db.prepare("UPDATE contracts SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(contractId);

      // 2. Mark target dead & increment killer kills count
      db.prepare("UPDATE users SET is_alive = 0 WHERE id = ?").run(targetId);
      db.prepare("UPDATE users SET kills_count = kills_count + 1 WHERE id = ?").run(killerId);

      // 3. Log in kill_logs
      db.prepare(`
        INSERT INTO kill_logs (id, game_id, killer_id, target_id, mission_description)
        VALUES (?, ?, ?, ?, ?)
      `).run(cryptoRandomString(), gameId, killerId, targetId, missionDesc);

      // 4. Find target's active contract to inherit the next target
      const targetContract = db.prepare(`
        SELECT * FROM contracts WHERE killer_id = ? AND status = 'active'
      `).get(targetId);

      if (targetContract) {
        db.prepare("UPDATE contracts SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(targetContract.id);
      }

      // 5. Check remaining alive players
      const alivePlayers = db.prepare("SELECT id, pseudo, kills_count FROM users WHERE game_id = ? AND is_alive = 1").all(gameId);

      if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        db.prepare("UPDATE games SET status = 'finished', winner_id = ? WHERE id = ?").run(winner.id, gameId);

        return {
          gameOver: true,
          winner,
          gameId,
          killerId,
          targetId
        };
      }

      // 6. Reassign target to killer
      const nextTargetId = targetContract ? targetContract.target_id : killerId;

      // STRICT UNUSED WORD FILTER: Pick a word NOT currently assigned to any active player in the game!
      let availableMissions = db.prepare(`
        SELECT id, description FROM missions 
        WHERE game_id = ? 
        AND id NOT IN (
          SELECT mission_id FROM contracts WHERE game_id = ? AND status = 'active'
        )
      `).all(gameId, gameId);

      // Fallback if all custom words are exhausted
      if (availableMissions.length === 0) {
        availableMissions = db.prepare(`
          SELECT id, description FROM missions WHERE game_id = ?
        `).all(gameId);
      }

      const randomMission = shuffle(availableMissions)[0];

      const newContractId = cryptoRandomString();
      db.prepare(`
        INSERT INTO contracts (id, game_id, killer_id, target_id, mission_id, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(newContractId, gameId, killerId, nextTargetId, randomMission.id);

      const nextTarget = db.prepare("SELECT id, pseudo FROM users WHERE id = ?").get(nextTargetId);

      return {
        gameOver: false,
        gameId,
        killerId,
        targetId,
        newTarget: nextTarget,
        newMission: randomMission.description
      };
    })();
  }

  // METHOD 1: Killer validates directly by entering target's 4-digit secret code
  static requestKillByCode(killerId, targetSecretCode) {
    const activeContract = db.prepare(`
      SELECT c.*, t.pseudo as target_pseudo, t.secret_code as target_code
      FROM contracts c
      JOIN users t ON c.target_id = t.id
      WHERE c.killer_id = ? AND c.status = 'active'
    `).get(killerId);

    if (!activeContract) {
      throw new Error("Vous n'avez aucun contrat actif actuellement.");
    }

    if (activeContract.target_code !== targetSecretCode.trim()) {
      return { success: false, message: 'Code secret de la cible incorrect !' };
    }

    const killResult = GameEngine.executeKill(activeContract.id);
    return {
      success: true,
      ...killResult
    };
  }

  // METHOD 2: Target self-eliminates directly on their own device
  static targetSelfEliminate(targetId) {
    const activeContract = db.prepare(`
      SELECT * FROM contracts WHERE target_id = ? AND status = 'active'
    `).get(targetId);

    if (!activeContract) {
      throw new Error("Aucun contrat actif trouvé ciblant ce joueur.");
    }

    const killResult = GameEngine.executeKill(activeContract.id);
    return {
      success: true,
      ...killResult
    };
  }

  // Moderator manual elimination
  static moderatorEliminate(gameId, targetId) {
    const activeContract = db.prepare(`
      SELECT * FROM contracts WHERE game_id = ? AND target_id = ? AND status = 'active'
    `).get(gameId, targetId);

    if (!activeContract) {
      throw new Error("Aucun contrat actif trouvé pour ce joueur.");
    }

    return GameEngine.executeKill(activeContract.id);
  }

  // Get player dashboard state
  static getPlayerDashboard(userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('Utilisateur non trouvé.');

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(user.game_id);

    if (game.status === 'draft') {
      const players = db.prepare('SELECT pseudo, role FROM users WHERE game_id = ?').all(user.game_id);
      return { user, game, status: 'draft', lobbyPlayers: players };
    }

    if (game.status === 'finished') {
      const winner = db.prepare('SELECT pseudo, kills_count FROM users WHERE id = ?').get(game.winner_id);
      return { user, game, status: 'finished', winner };
    }

    if (!user.is_alive) {
      return { user, game, status: 'dead', killsCount: user.kills_count };
    }

    const contract = db.prepare(`
      SELECT c.*, t.pseudo as target_pseudo, m.description as mission_desc
      FROM contracts c
      JOIN users t ON c.target_id = t.id
      JOIN missions m ON c.mission_id = m.id
      WHERE c.killer_id = ? AND c.status = 'active'
    `).get(userId);

    return {
      user,
      game,
      status: 'playing',
      targetPseudo: contract ? contract.target_pseudo : null,
      missionDesc: contract ? contract.mission_desc : null
    };
  }

  // Get live dashboard
  static getLiveDashboard(gameId) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) throw new Error('Partie introuvable.');

    const players = db.prepare(`
      SELECT id, pseudo, is_alive, kills_count, role FROM users WHERE game_id = ? ORDER BY is_alive DESC, kills_count DESC
    `).all(gameId);

    const killfeed = db.prepare(`
      SELECT k.*, killer.pseudo as killer_pseudo, target.pseudo as target_pseudo
      FROM kill_logs k
      JOIN users killer ON k.killer_id = killer.id
      JOIN users target ON k.target_id = target.id
      WHERE k.game_id = ?
      ORDER BY k.killed_at DESC
    `).all(gameId);

    const contracts = db.prepare(`
      SELECT c.id, c.status, killer.pseudo as killer_pseudo, killer.id as killer_id, target.pseudo as target_pseudo, target.id as target_id, m.description as mission_desc
      FROM contracts c
      JOIN users killer ON c.killer_id = killer.id
      JOIN users target ON c.target_id = target.id
      JOIN missions m ON c.mission_id = m.id
      WHERE c.game_id = ? AND c.status = 'active'
    `).all(gameId);

    let winner = null;
    if (game.winner_id) {
      winner = db.prepare('SELECT pseudo, kills_count FROM users WHERE id = ?').get(game.winner_id);
    }

    return { game, players, killfeed, contracts, winner };
  }
}
