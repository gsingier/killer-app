import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Skull, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function KillRequestModal({ isOpen, onClose, targetPseudo }) {
  const { user, socket, showNotification } = useGame();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code || code.length !== 4) {
      setErrorMsg('Veuillez saisir un code secret à 4 chiffres.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    socket.emit('request_kill', {
      killerId: user.userId,
      targetSecretCode: code
    });

    // Listen for socket confirmation or error
    const handleFailed = (msg) => {
      setErrorMsg(msg);
      setLoading(false);
      socket.off('kill_request_failed', handleFailed);
      socket.off('kill_request_sent', handleSent);
    };

    const handleSent = (res) => {
      setLoading(false);
      showNotification(res.message, 'success');
      onClose();
      socket.off('kill_request_failed', handleFailed);
      socket.off('kill_request_sent', handleSent);
    };

    socket.on('kill_request_failed', handleFailed);
    socket.on('kill_request_sent', handleSent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card-glow max-w-md w-full p-6 rounded-3xl space-y-5 animate-scale-up">
        <div className="flex items-center gap-3 text-rose-500">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/40">
            <Skull className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-black text-white">Validation du Kill</h3>
            <p className="text-xs text-slate-300">Cible : <span className="font-bold text-rose-400">{targetPseudo}</span></p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Pour éliminer votre cible, saisissez le <strong>Code Secret à 4 chiffres</strong> qu'elle vous a révélé suite à votre action réussi.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Code Secret (4 chiffres)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 4829"
              autoFocus
              className="w-full text-center text-3xl font-mono font-bold tracking-widest py-3 px-4 rounded-xl glass-input border border-rose-500/30 text-rose-300 placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl btn-secondary text-slate-300 text-sm font-semibold"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading || code.length !== 4}
              className="flex-1 py-3 rounded-xl btn-primary text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Vérification...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
