import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import KillRequestModal from '../components/KillRequestModal';
import KillConfirmModal from '../components/KillConfirmModal';
import KillFeed from '../components/KillFeed';
import { Target, Skull, Shield, Eye, EyeOff, Sparkles, AlertTriangle, Trophy } from 'lucide-react';

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const { user, gameState, refreshPlayerState } = useGame();

  const [revealTarget, setRevealTarget] = useState(false);
  const [showKillModal, setShowKillModal] = useState(false);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    refreshPlayerState();
    fetchLiveFeed();

    const interval = setInterval(() => {
      refreshPlayerState();
      fetchLiveFeed();
    }, 4000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (gameState?.status === 'finished') {
      navigate('/game-over');
    }
  }, [gameState, navigate]);

  const fetchLiveFeed = async () => {
    if (!user?.gameId) return;
    try {
      const res = await fetch(`/api/games/${user.gameId}/live`);
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
      }
    } catch (e) {}
  };

  if (!user || !gameState) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Chargement de votre contrat secret...</p>
        </div>
      </div>
    );
  }

  // Spectator mode if user is dead
  if (gameState.status === 'dead') {
    return (
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="p-6 rounded-3xl glass-card text-center space-y-3 border border-rose-900/50">
          <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-950">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-2xl font-black text-white">Vous avez été Éliminé !</h2>
          <p className="text-xs text-slate-400">
            Vous êtes désormais un spectre. Observez le reste de la partie et découvrez qui sera l'ultime survivant !
          </p>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-around text-xs">
            <span className="text-slate-400">Vos Victimes :</span>
            <span className="font-bold text-rose-400 text-base">{gameState.killsCount || 0} kill(s)</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/live')}
          className="w-full py-3 rounded-2xl btn-secondary text-rose-300 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4 text-rose-400" />
          <span>Voir le Dashboard Live Maître du Jeu</span>
        </button>

        <KillFeed killfeed={liveData?.killfeed || []} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Target Secret Card */}
      <div className="p-6 rounded-3xl glass-card-glow text-center space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1">
            <Target className="w-3.5 h-3.5" /> Votre Cible Actuelle
          </span>

          <button
            onClick={() => setRevealTarget(!revealTarget)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            {revealTarget ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-rose-400" />}
            <span>{revealTarget ? 'Masquer' : 'Révéler'}</span>
          </button>
        </div>

        <div className="py-6 px-4 rounded-2xl bg-slate-950/90 border border-rose-500/30 flex flex-col items-center justify-center min-h-[120px] transition-all">
          {revealTarget ? (
            <div className="space-y-1 animate-scale-up">
              <span className="text-xs text-slate-400 font-medium">Éliminer :</span>
              <h3 className="font-heading text-3xl font-black text-rose-400 tracking-wide uppercase">
                {gameState.targetPseudo || 'Chargement...'}
              </h3>
            </div>
          ) : (
            <button
              onClick={() => setRevealTarget(true)}
              className="space-y-2 text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-300 group-hover:text-rose-400 transition-colors">
                Tap pour révéler le nom de la cible
              </p>
            </button>
          )}
        </div>
      </div>

      {/* Mission Card */}
      <div className="p-6 rounded-3xl glass-card space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Intitulé de la Mission</span>
        </div>

        <p className="text-base font-bold text-white leading-relaxed p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          "{gameState.missionDesc || 'Mission secrète'}"
        </p>

        <p className="text-[11px] text-slate-400 leading-tight">
          Faites accomplir cette action à votre cible sans vous faire repérer. Demandez-lui son <strong>Code Secret à 4 chiffres</strong> une fois réussi.
        </p>
      </div>

      {/* Action Button: J'AI ÉLIMINÉ MA CIBLE */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => setShowKillModal(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg tracking-wide uppercase shadow-xl shadow-rose-600/40 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Skull className="w-6 h-6" />
          <span>J'ai éliminé ma cible</span>
        </button>

        <button
          onClick={() => navigate('/live')}
          className="w-full py-2.5 rounded-xl btn-secondary text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-2"
        >
          <span>Voir le Live & Killfeed</span>
        </button>
      </div>

      {/* Kill Request Modal (Step A) */}
      <KillRequestModal
        isOpen={showKillModal}
        onClose={() => setShowKillModal(false)}
        targetPseudo={gameState.targetPseudo}
      />

      {/* Incoming Kill Confirmation Modal (Step B) */}
      <KillConfirmModal />
    </div>
  );
}
