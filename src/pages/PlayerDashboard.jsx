import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import KillRequestModal from '../components/KillRequestModal';
import { Target, Skull, Eye, EyeOff, AlertTriangle, Volume2, Shield } from 'lucide-react';

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const { user, socket, gameState, refreshPlayerState, showNotification } = useGame();

  const [revealTarget, setRevealTarget] = useState(false);
  const [showKillModal, setShowKillModal] = useState(false);
  const [confirmingSelfKill, setConfirmingSelfKill] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    refreshPlayerState();
    const interval = setInterval(refreshPlayerState, 4000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (gameState?.status === 'finished') {
      navigate('/game-over');
    }
  }, [gameState, navigate]);

  const handleSelfEliminate = () => {
    socket.emit('target_self_eliminate', { targetId: user.userId });
    setConfirmingSelfKill(false);
    showNotification('Vous avez validé votre élimination.', 'info');
    refreshPlayerState();
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

  const isOrganizer = user.role === 'organizer';

  // Spectator / Ghost view for eliminated regular players
  if (gameState.status === 'dead') {
    return (
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="p-8 rounded-3xl glass-card text-center space-y-4 border border-rose-900/50">
          <div className="w-20 h-20 rounded-full bg-rose-950/80 border-2 border-rose-800 text-rose-500 flex items-center justify-center mx-auto shadow-xl shadow-rose-950 animate-pulse">
            <Skull className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-black text-white">Vous avez été Éliminé !</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Votre aventure s'arrête ici. Profitez de la soirée et attendez l'annonce finale du grand vainqueur ! 👻
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Vos Kills accomplis :</span>
            <span className="font-mono text-xl font-bold text-rose-400">{gameState.killsCount || 0} kill(s)</span>
          </div>

          {/* Button strictly for Organizer */}
          {isOrganizer && (
            <button
              onClick={() => navigate('/live')}
              className="w-full py-3 rounded-2xl btn-primary text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Ouvrir le Tableau de Bord MJ</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* MJ Quick Access Header Button */}
      {isOrganizer && (
        <button
          onClick={() => navigate('/live')}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 font-bold text-xs flex items-center justify-between transition-colors shadow-lg"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500" />
            <span>Vue Maître du Jeu (Confidentiel)</span>
          </span>
          <span className="text-[10px] uppercase font-extrabold bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40">
            MJ
          </span>
        </button>
      )}

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

      {/* Single Word Mission Card */}
      <div className="p-6 rounded-3xl glass-card space-y-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Mot Secret à Faire Dire</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-center space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-widest block font-semibold">Faites prononcer le mot :</span>
          <p className="font-heading text-3xl font-black text-amber-400 tracking-widest uppercase">
            "{gameState.missionDesc || 'MOT SECRET'}"
          </p>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Faites dire ce mot unique à votre cible pendant une conversation sans qu'elle ne se doute de rien !
        </p>
      </div>

      {/* Kill Validation Options */}
      <div className="space-y-3 pt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
          Options de Validation de Kill
        </span>

        {/* Option 1: Killer enters Code */}
        <button
          onClick={() => setShowKillModal(true)}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide uppercase shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Skull className="w-5 h-5" />
          <span>J'ai fait dire le mot (Entrer le Code)</span>
        </button>

        {/* Option 2: Target Self-Elimination */}
        {confirmingSelfKill ? (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-600 text-center space-y-3 animate-fade-in">
            <p className="text-xs font-bold text-white">
              Confirmez-vous que vous avez été piégé(e) et éliminé(e) ?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmingSelfKill(false)}
                className="flex-1 py-2 rounded-xl btn-secondary text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleSelfEliminate}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Oui, je suis éliminé(e) ☠️
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingSelfKill(true)}
            className="w-full py-3 px-4 rounded-2xl glass-card hover:bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>J'ai été piégé(e) / Je valide mon élimination</span>
          </button>
        )}
      </div>

      {/* Kill Request Modal (Option 1) */}
      <KillRequestModal
        isOpen={showKillModal}
        onClose={() => setShowKillModal(false)}
        targetPseudo={gameState.targetPseudo}
      />
    </div>
  );
}
