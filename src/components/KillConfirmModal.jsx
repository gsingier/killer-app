import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, CheckCircle, Skull } from 'lucide-react';

export default function KillConfirmModal() {
  const { user, socket, pendingIncomingKill, setPendingIncomingKill } = useGame();
  const [loading, setLoading] = useState(false);

  if (!pendingIncomingKill) return null;

  const handleConfirm = () => {
    setLoading(true);
    socket.emit('confirm_kill', {
      targetId: user.userId,
      contractId: pendingIncomingKill.contractId
    });
    setPendingIncomingKill(null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="glass-card-glow max-w-sm w-full p-6 rounded-3xl text-center space-y-5 border-2 border-rose-500/50 shadow-2xl shadow-rose-900/50">
        <div className="w-16 h-16 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center mx-auto text-rose-400 animate-bounce">
          <Skull className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="font-heading text-2xl font-black text-white">Alerte Élimination !</h3>
          <p className="text-sm text-slate-300">
            <span className="font-bold text-rose-400">{pendingIncomingKill.killerPseudo}</span> affirme vous avoir piégé et éliminé !
          </p>
        </div>

        <p className="text-xs text-slate-400">
          En confirmant, vous validez votre élimination. Le tueur récupérera votre cible et votre mission.
        </p>

        <div className="pt-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-600/40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Confirmer mon élimination</span>
          </button>
        </div>
      </div>
    </div>
  );
}
