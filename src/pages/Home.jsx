import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Target, PlusCircle, LogIn, Play, ShieldAlert } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useGame();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-between p-4 max-w-md mx-auto text-center py-6 space-y-8">
      <div className="w-full space-y-8 my-auto">
        {/* Main Hero Header */}
        <div className="space-y-4">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-2xl shadow-rose-600/40 animate-pulse-glow mx-auto flex items-center justify-center">
              <div className="w-full h-full bg-[#090d16] rounded-[22px] flex items-center justify-center">
                <Target className="w-12 h-12 text-rose-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-4xl font-extrabold text-white tracking-tight">
              KILLER <span className="text-rose-500">GAME</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
              Le jeu des Assassins en temps réel. Distribuez les cibles, accomplissez vos missions et éliminez vos amis !
            </p>
          </div>
        </div>

        {/* Active Session Card if player already in game */}
        {user && (
          <div className="w-full p-4 rounded-2xl glass-card-glow text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Partie en cours
              </span>
              <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-rose-950 border border-rose-800">
                {user.gameCode}
              </span>
            </div>

            <p className="text-sm font-bold text-white">
              Pseudo : <span className="text-slate-300 font-normal">{user.pseudo}</span>
            </p>

            <button
              onClick={() => navigate('/play')}
              className="w-full py-3 rounded-xl btn-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-transform"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reprendre la partie</span>
            </button>
          </div>
        )}

        {/* Main Choice Buttons */}
        <div className="w-full space-y-3.5">
          <button
            onClick={() => navigate('/create')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-base shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 transition-all active:scale-98"
          >
            <PlusCircle className="w-6 h-6" />
            <span>Créer une partie (Organisateur)</span>
          </button>

          <button
            onClick={() => navigate('/join')}
            className="w-full p-4 rounded-2xl glass-card hover:bg-slate-800/80 border border-slate-700/80 text-white font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-98"
          >
            <LogIn className="w-6 h-6 text-rose-400" />
            <span>Rejoindre avec un code</span>
          </button>
        </div>
      </div>

      {/* Footer Custom Message */}
      <footer className="pt-2 text-xs text-slate-400 font-medium tracking-wide">
        Fait avec 🫶 pour Lucas
      </footer>
    </div>
  );
}
