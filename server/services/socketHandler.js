import db from '../db.js';
import { GameEngine } from './gameEngine.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Nouveau client Socket.io connecté: ${socket.id}`);

    // Register user to game and user room
    socket.on('register_user', ({ userId, gameId }) => {
      if (!userId || !gameId) return;

      socket.join(`game_${gameId}`);
      socket.join(`user_${userId}`);

      // Save socket_id in DB
      try {
        db.prepare('UPDATE users SET socket_id = ? WHERE id = ?').run(socket.id, userId);
      } catch (err) {
        console.error('Erreur mise à jour socket_id:', err);
      }

      console.log(`👤 Joueur ${userId} a rejoint le salon game_${gameId}`);

      // Notify lobby of updated player list
      try {
        const dashboard = GameEngine.getLiveDashboard(gameId);
        io.to(`game_${gameId}`).emit('lobby_update', dashboard);
      } catch (e) {}
    });

    // MJ starts game
    socket.on('start_game', ({ gameId }) => {
      try {
        const result = GameEngine.startGame(gameId);
        io.to(`game_${gameId}`).emit('game_started', result);
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    // Step A: Killer requests kill using secret code
    socket.on('request_kill', ({ killerId, targetSecretCode }) => {
      try {
        const res = GameEngine.requestKill(killerId, targetSecretCode);

        if (!res.success) {
          socket.emit('kill_request_failed', res.message);
          return;
        }

        // Notify killer
        socket.emit('kill_request_sent', res);

        // Notify target directly on their device via private socket room
        io.to(`user_${res.targetId}`).emit('incoming_kill_confirmation', {
          contractId: res.contractId,
          killerPseudo: res.killerPseudo
        });

        // Notify live dashboard of pending status
        const user = db.prepare('SELECT game_id FROM users WHERE id = ?').get(killerId);
        if (user) {
          io.to(`game_${user.game_id}`).emit('dashboard_refresh');
        }
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    // Step B: Target confirms elimination
    socket.on('confirm_kill', ({ targetId, contractId }) => {
      try {
        const result = GameEngine.confirmKill(targetId, contractId);

        if (result.gameOver) {
          // Broadcast game over to all players
          io.to(`game_${result.gameId}`).emit('game_over', {
            winner: result.winner,
            dashboard: GameEngine.getLiveDashboard(result.gameId)
          });
        } else {
          // Notify target they are dead
          io.to(`user_${targetId}`).emit('you_are_dead');

          // Notify killer with new target and mission
          io.to(`user_${result.killerId}`).emit('target_updated', {
            newTarget: result.newTarget,
            newMission: result.newMission
          });

          // Refresh full dashboard for everyone (live killfeed & graph)
          io.to(`game_${result.gameId}`).emit('dashboard_refresh');
        }
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    // Moderator eliminate player
    socket.on('moderator_eliminate', ({ gameId, targetId }) => {
      try {
        const result = GameEngine.moderatorEliminate(gameId, targetId);

        if (result.gameOver) {
          io.to(`game_${gameId}`).emit('game_over', {
            winner: result.winner,
            dashboard: GameEngine.getLiveDashboard(gameId)
          });
        } else {
          io.to(`user_${targetId}`).emit('you_are_dead');
          if (result.killerId) {
            const killerDashboard = GameEngine.getPlayerDashboard(result.killerId);
            io.to(`user_${result.killerId}`).emit('target_updated', {
              newTarget: killerDashboard.targetPseudo,
              newMission: killerDashboard.missionDesc
            });
          }
          io.to(`game_${gameId}`).emit('dashboard_refresh');
        }
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client déconnecté: ${socket.id}`);
    });
  });
}
