import db from '../db.js';
import { GameEngine } from './gameEngine.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client Socket.io connecté: ${socket.id}`);

    socket.on('register_user', ({ userId, gameId }) => {
      if (!userId || !gameId) return;

      socket.join(`game_${gameId}`);
      socket.join(`user_${userId}`);

      try {
        db.prepare('UPDATE users SET socket_id = ? WHERE id = ?').run(socket.id, userId);
      } catch (err) {}

      try {
        const dashboard = GameEngine.getLiveDashboard(gameId);
        io.to(`game_${gameId}`).emit('lobby_update', dashboard);
      } catch (e) {}
    });

    socket.on('start_game', ({ gameId }) => {
      try {
        const result = GameEngine.startGame(gameId);
        io.to(`game_${gameId}`).emit('game_started', result);
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    // Helper to broadcast kill result (used by both methods)
    const broadcastKillResult = (result) => {
      if (result.gameOver) {
        io.to(`game_${result.gameId}`).emit('game_over', {
          winner: result.winner,
          dashboard: GameEngine.getLiveDashboard(result.gameId)
        });
      } else {
        // Notify dead target
        io.to(`user_${result.targetId}`).emit('you_are_dead');

        // Notify killer with new target and mission
        io.to(`user_${result.killerId}`).emit('target_updated', {
          newTarget: result.newTarget,
          newMission: result.newMission
        });

        // Broadcast live dashboard refresh for everyone
        io.to(`game_${result.gameId}`).emit('dashboard_refresh');
      }
    };

    // METHOD 1: Killer enters Target 4-Digit Secret Code -> Instant Kill
    socket.on('request_kill_code', ({ killerId, targetSecretCode }) => {
      try {
        const res = GameEngine.requestKillByCode(killerId, targetSecretCode);

        if (!res.success) {
          socket.emit('kill_request_failed', res.message);
          return;
        }

        socket.emit('kill_success', '🎯 Contrat exécuté avec succès !');
        broadcastKillResult(res);
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    // METHOD 2: Target Self-Eliminates directly -> Instant Kill
    socket.on('target_self_eliminate', ({ targetId }) => {
      try {
        const res = GameEngine.targetSelfEliminate(targetId);
        broadcastKillResult(res);
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    // Moderator eliminate player
    socket.on('moderator_eliminate', ({ gameId, targetId }) => {
      try {
        const res = GameEngine.moderatorEliminate(gameId, targetId);
        broadcastKillResult(res);
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    socket.on('disconnect', () => {});
  });
}
