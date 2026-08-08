import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('killer_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [pendingIncomingKill, setPendingIncomingKill] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Register user on socket connection
  useEffect(() => {
    if (socket && user?.userId && user?.gameId) {
      socket.emit('register_user', { userId: user.userId, gameId: user.gameId });

      // Socket event listeners
      socket.on('incoming_kill_confirmation', (data) => {
        setPendingIncomingKill(data);
        showNotification(`🚨 ${data.killerPseudo} affirme vous avoir éliminé ! Confirmez-vous ?`, 'warning');
      });

      socket.on('target_updated', ({ newTarget, newMission }) => {
        showNotification('🎯 Contrat accompli ! Vous avez reçu une nouvelle cible !', 'success');
        refreshPlayerState();
      });

      socket.on('you_are_dead', () => {
        showNotification('☠️ Vous avez été éliminé de la partie !', 'error');
        refreshPlayerState();
      });

      socket.on('game_started', () => {
        showNotification('🚀 La partie commence ! Découvrez votre cible secret.', 'info');
        refreshPlayerState();
      });

      socket.on('dashboard_refresh', () => {
        refreshPlayerState();
      });

      socket.on('game_over', () => {
        showNotification('🏆 La partie est terminée !', 'success');
        refreshPlayerState();
      });

      socket.on('error_message', (msg) => {
        showNotification(`❌ ${msg}`, 'error');
      });
    }

    return () => {
      if (socket) {
        socket.off('incoming_kill_confirmation');
        socket.off('target_updated');
        socket.off('you_are_dead');
        socket.off('game_started');
        socket.off('dashboard_refresh');
        socket.off('game_over');
        socket.off('error_message');
      }
    };
  }, [socket, user]);

  const saveUserSession = (userData) => {
    setUser(userData);
    localStorage.setItem('killer_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setGameState(null);
    localStorage.removeItem('killer_user');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const refreshPlayerState = async () => {
    if (!user?.userId) return;
    try {
      const res = await fetch(`/api/games/player/${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        setGameState(data);
        if (data.pendingIncomingKill) {
          setPendingIncomingKill(data.pendingIncomingKill);
        } else {
          setPendingIncomingKill(null);
        }
      }
    } catch (e) {
      console.error('Erreur chargement état joueur:', e);
    }
  };

  return (
    <GameContext.Provider
      value={{
        user,
        socket,
        gameState,
        pendingIncomingKill,
        setPendingIncomingKill,
        notification,
        showNotification,
        saveUserSession,
        logout,
        refreshPlayerState,
        loading,
        setLoading
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame doit être utilisé dans GameProvider');
  return context;
}
