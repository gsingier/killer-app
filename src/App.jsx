import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import JoinGame from './pages/JoinGame';
import Lobby from './pages/Lobby';
import PlayerDashboard from './pages/PlayerDashboard';
import LiveDashboard from './pages/LiveDashboard';
import GameOver from './pages/GameOver';

function NotificationBanner() {
  const { notification } = useGame();
  if (!notification) return null;

  const bgColors = {
    info: 'bg-slate-900 border-rose-500 text-slate-100',
    success: 'bg-emerald-950 border-emerald-500 text-emerald-100',
    warning: 'bg-amber-950 border-amber-500 text-amber-100',
    error: 'bg-rose-950 border-rose-500 text-rose-100'
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-bounce-short">
      <div className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-semibold text-center ${bgColors[notification.type] || bgColors.info}`}>
        {notification.message}
      </div>
    </div>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar />
      <NotificationBanner />
      <main className="flex-1 pb-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateGame />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/play" element={<PlayerDashboard />} />
          <Route path="/live" element={<LiveDashboard />} />
          <Route path="/game-over" element={<GameOver />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MainLayout />
    </GameProvider>
  );
}
