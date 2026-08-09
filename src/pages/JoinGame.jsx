import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { LogIn, ArrowLeft, KeyRound, User } from 'lucide-react';

export default function JoinGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { saveUserSession, showNotification } = useGame();

  const [code, setCode] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam.toUpperCase().trim());
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !pseudo.trim()) {
      showNotification('Veuillez remplir le code de partie et votre pseudo.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          pseudo: pseudo.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la connexion.');

      saveUserSession({
        userId: data.userId,
        gameId: data.gameId,
        gameCode: data.gameCode,
        gameName: data.gameName,
        pseudo: data.pseudo,
        secretCode: data.secretCode,
        role: data.role
      });

      showNotification('Bienvenue dans la partie !', 'success');
      navigate('/lobby');
    } catch (err) {
      showNotification(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 min-h-[80vh] flex flex-col justify-center">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl glass-card text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-heading text-2xl font-black text-white">Rejoindre une Partie</h2>
          <p className="text-xs text-slate-400">Entrez le code à 6 chiffres communiqué par le MJ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 glass-card p-6 rounded-3xl">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-rose-400" /> Code de Partie (6 chiffres)
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Ex: 849201"
            required
            className="w-full py-3.5 px-4 text-center text-3xl font-mono font-bold tracking-widest rounded-xl glass-input text-rose-400 placeholder:text-slate-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-rose-400" /> Votre Pseudo
          </label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Ex: Agent James"
            required
            className="w-full py-3 px-4 text-base rounded-xl glass-input text-white placeholder:text-slate-500 font-medium"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-xs text-slate-300 space-y-1">
          <p className="font-bold text-rose-300">🔒 Code Secret Automatique</p>
          <p className="text-[11px] text-slate-400">
            Dès votre connexion, un code secret à 4 chiffres unique vous sera attribué pour valider vos éliminations.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl btn-primary text-white font-bold text-base shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Connexion en cours...' : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Entrer dans le Salon 🎯</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
