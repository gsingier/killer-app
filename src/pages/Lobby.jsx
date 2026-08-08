import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { Users, Copy, Play, QrCode, KeyRound, ShieldAlert, Check } from 'lucide-react';

export default function Lobby() {
  const navigate = useNavigate();
  const { user, socket, showNotification } = useGame();

  const [players, setPlayers] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Fetch initial lobby players
    fetchLobbyPlayers();

    if (socket) {
      socket.on('lobby_update', (dashboard) => {
        if (dashboard.players) {
          setPlayers(dashboard.players);
        }
      });

      socket.on('game_started', () => {
        showNotification('🚀 La partie commence !', 'success');
        navigate('/play');
      });
    }

    return () => {
      if (socket) {
        socket.off('lobby_update');
        socket.off('game_started');
      }
    };
  }, [user, socket, navigate]);

  const fetchLobbyPlayers = async () => {
    if (!user?.gameId) return;
    try {
      const res = await fetch(`/api/games/${user.gameId}/live`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
        if (data.game?.status === 'active') {
          navigate('/play');
        }
      }
    } catch (err) {
      console.error('Erreur chargement lobby:', err);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(user.gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showNotification('Code copié dans le presse-papier !', 'info');
  };

  const handleStartGame = () => {
    if (players.length < 3) {
      showNotification('Au moins 3 joueurs sont nécessaires pour lancer la partie.', 'error');
      return;
    }
    setStarting(true);
    socket.emit('start_game', { gameId: user.gameId });
  };

  if (!user) return null;

  const isOrganizer = user.role === 'organizer';

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Game Header & Code */}
      <div className="p-6 rounded-3xl glass-card-glow text-center space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Salon d'attente</span>
        <h2 className="font-heading text-2xl font-black text-white">{user.gameName}</h2>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest block">Code de Partie</span>
            <span className="font-mono text-3xl font-black text-rose-400 tracking-wider">{user.gameCode}</span>
          </div>
          <button
            onClick={copyCode}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            title="Copier le code"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <button
          onClick={() => setShowQR(!showQR)}
          className="text-xs text-rose-400 font-bold hover:underline flex items-center justify-center gap-1.5 mx-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>{showQR ? 'Masquer le QR Code' : 'Afficher le QR Code pour joindre'}</span>
        </button>

        {showQR && <QRCodeDisplay gameCode={user.gameCode} />}
      </div>

      {/* Secret Code Reminder */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Votre Code Secret :</span>
            <p className="font-mono text-lg font-bold text-white tracking-widest">{user.secretCode}</p>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 max-w-[120px] text-right leading-tight">
          À donner uniquement à votre tueur si vous êtes éliminé !
        </span>
      </div>

      {/* Players Connected List */}
      <div className="p-5 rounded-3xl glass-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-400" />
            Joueurs Connectés ({players.length})
          </h3>
          {players.length < 3 && (
            <span className="text-xs text-amber-400 font-medium">Mini 3 requis</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
          {players.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-rose-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                  {p.pseudo.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white">{p.pseudo}</span>
              </div>

              {p.role === 'organizer' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                  Maître du Jeu
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      {isOrganizer ? (
        <button
          onClick={handleStartGame}
          disabled={players.length < 3 || starting}
          className="w-full py-4 rounded-2xl btn-primary text-white font-black text-base shadow-xl shadow-rose-600/40 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{starting ? 'Lancement...' : 'Lancer la Partie 🚀'}</span>
        </button>
      ) : (
        <div className="p-4 rounded-2xl glass-card text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>En attente que le Maître du Jeu lance la partie...</span>
        </div>
      )}
    </div>
  );
}
