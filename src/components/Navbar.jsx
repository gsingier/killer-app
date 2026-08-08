import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Target, KeyRound, LogOut, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useGame();
  const navigate = useNavigate();
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [revealCode, setRevealCode] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Voulez-vous vraiment quitter cette partie ?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & Game Code */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-lg text-white tracking-wide flex items-center gap-2">
                KILLER <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">GAME</span>
              </h1>
              {user?.gameCode && (
                <p className="text-xs text-slate-400 font-mono tracking-wider">
                  CODE: <span className="text-rose-400 font-bold">{user.gameCode}</span>
                </p>
              )}
            </div>
          </div>

          {/* User Quick Info & Actions */}
          {user && (
            <div className="flex items-center gap-2">
              {/* Secret Code Quick Modal Button */}
              {user.secretCode && (
                <button
                  onClick={() => setShowSecretModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-all active:scale-95"
                  title="Mon Code Secret"
                >
                  <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Mon Code :</span>
                  <span className="font-mono text-white font-bold">{user.secretCode}</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 border border-slate-700/50 transition-colors"
                title="Quitter la partie"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Secret Code Popup Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card-glow max-w-sm w-full p-6 rounded-2xl text-center space-y-4 relative">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="font-heading text-xl font-bold text-white">Votre Code Secret</h3>
            
            <p className="text-xs text-slate-300">
              Gardez ce code strictement secret ! Communiquez-le uniquement au joueur qui réussira à vous éliminer.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-black text-rose-400 tracking-widest">
                {revealCode ? user.secretCode : '••••'}
              </span>
              <button
                onClick={() => setRevealCode(!revealCode)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                {revealCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={() => setShowSecretModal(false)}
              className="w-full py-2.5 rounded-xl btn-secondary font-semibold text-sm text-slate-200"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
