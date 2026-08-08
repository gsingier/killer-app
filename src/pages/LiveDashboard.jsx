import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import ChainGraph from '../components/ChainGraph';
import KillFeed from '../components/KillFeed';
import { Shield, Users, Skull, Trophy, RefreshCw, ArrowLeft } from 'lucide-react';

export default function LiveDashboard() {
  const navigate = useNavigate();
  const { user, socket, showNotification } = useGame();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.gameId) {
      navigate('/');
      return;
    }

    fetchLiveData();

    if (socket) {
      socket.on('dashboard_refresh', fetchLiveData);
      socket.on('game_over', fetchLiveData);
    }

    const interval = setInterval(fetchLiveData, 3000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('dashboard_refresh', fetchLiveData);
        socket.off('game_over', fetchLiveData);
      }
    };
  }, [user, socket]);

  const fetchLiveData = async () => {
    if (!user?.gameId) return;
    try {
      const res = await fetch(`/api/games/${user.gameId}/live`);
      if (res.ok) {
        const live = await res.json();
        setData(live);
        if (live.game?.status === 'finished') {
          navigate('/game-over');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleModeratorEliminate = (targetId, targetPseudo) => {
    if (window.confirm(`Êtes-vous sûr de vouloir éliminer manuellement ${targetPseudo} ?`)) {
      socket.emit('moderator_eliminate', {
        gameId: user.gameId,
        targetId
      });
      showNotification(`Élimination de ${targetPseudo} effectuée par le MJ.`, 'info');
      fetchLiveData();
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Chargement du Tableau Live...</p>
        </div>
      </div>
    );
  }

  const aliveCount = data.players ? data.players.filter(p => p.is_alive).length : 0;
  const isOrganizer = user.role === 'organizer';

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/play')}
            className="p-2 rounded-xl glass-card text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-heading text-2xl font-black text-white">Live Dashboard MJ</h2>
            <p className="text-xs text-slate-400">Suivi des éliminations & graphe des cibles en direct</p>
          </div>
        </div>

        <button
          onClick={fetchLiveData}
          className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-rose-400 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3.5 rounded-2xl glass-card space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Survivants</span>
          <span className="font-mono text-2xl font-black text-rose-400 flex items-center justify-center gap-1">
            <Users className="w-5 h-5 text-rose-500" />
            {aliveCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl glass-card space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Éliminés</span>
          <span className="font-mono text-2xl font-black text-slate-400 flex items-center justify-center gap-1">
            <Skull className="w-5 h-5 text-slate-500" />
            {(data.players ? data.players.length : 0) - aliveCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl glass-card space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Kills</span>
          <span className="font-mono text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
            <Trophy className="w-5 h-5 text-amber-500" />
            {data.killfeed ? data.killfeed.length : 0}
          </span>
        </div>
      </div>

      {/* Target Chain Graph */}
      <ChainGraph
        contracts={data.contracts || []}
        onEliminate={isOrganizer ? handleModeratorEliminate : null}
      />

      {/* Killfeed */}
      <KillFeed killfeed={data.killfeed || []} />
    </div>
  );
}
