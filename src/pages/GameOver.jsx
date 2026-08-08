import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Skull, RefreshCw, Home } from 'lucide-react';

export default function GameOver() {
  const navigate = useNavigate();
  const { user, logout } = useGame();
  const [winner, setWinner] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [killfeed, setKillfeed] = useState([]);

  useEffect(() => {
    // Launch victory confetti explosion!
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });

    if (user?.gameId) {
      fetch(`/api/games/${user.gameId}/live`)
        .then(res => res.json())
        .then(data => {
          if (data.winner) setWinner(data.winner);
          if (data.players) setLeaderboard(data.players);
          if (data.killfeed) setKillfeed(data.killfeed);
        });
    }
  }, [user]);

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 text-center">
      {/* Winner Hero Banner */}
      <div className="p-8 rounded-3xl glass-card-glow border-2 border-amber-500/50 space-y-4 relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 animate-bounce">
          <Crown className="w-10 h-10 fill-current" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">Ultime Survivant !</span>
          <h2 className="font-heading text-3xl font-black text-white uppercase tracking-wide">
            {winner ? winner.pseudo : 'Victoire !'}
          </h2>
        </div>

        <p className="text-xs text-slate-300">
          a survécu à toutes les tentatives d'assassinat et remporte la partie du Killer ! 🏆
        </p>
      </div>

      {/* Leaderboard */}
      <div className="p-5 rounded-3xl glass-card space-y-3 text-left">
        <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Classement des Tueurs
        </h3>

        <div className="space-y-2">
          {leaderboard.map((p, rank) => (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                rank === 0
                  ? 'bg-amber-950/40 border-amber-500/50 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center ${
                  rank === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  #{rank + 1}
                </span>
                <span className="font-bold text-sm">{p.pseudo}</span>
              </div>

              <div className="flex items-center gap-1 text-xs font-mono font-bold text-rose-400">
                <Skull className="w-3.5 h-3.5" />
                <span>{p.kills_count} kill(s)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => {
            logout();
            navigate('/create');
          }}
          className="w-full py-3.5 rounded-2xl btn-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Relancer une nouvelle partie</span>
        </button>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full py-3 rounded-2xl btn-secondary text-slate-300 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>
      </div>
    </div>
  );
}
