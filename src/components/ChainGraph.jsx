import React from 'react';
import { ArrowRight, UserCheck, Skull, ShieldAlert } from 'lucide-react';

export default function ChainGraph({ contracts = [], onEliminate }) {
  if (!contracts || contracts.length === 0) {
    return (
      <div className="p-6 rounded-2xl glass-card text-center text-slate-400 text-sm">
        Aucune chaîne de contrat active. La partie n'a pas encore démarré.
      </div>
    );
  }

  return (
    <div className="p-5 rounded-3xl glass-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-rose-400" />
          Chaîne Active des Contrats ({contracts.length})
        </h3>
        <span className="text-xs text-slate-400">Vue temps réel MJ</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {contracts.map((c, i) => (
          <div
            key={c.id || i}
            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              c.status === 'pending_confirmation'
                ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-900/20'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Killer -> Target Flow */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="font-bold text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                {c.killer_pseudo}
              </span>

              <ArrowRight className="w-4 h-4 text-rose-400 shrink-0" />

              <span className="font-bold text-rose-400 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800">
                {c.target_pseudo}
              </span>
            </div>

            {/* Mission preview & status */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <span className="text-slate-400 italic truncate max-w-xs" title={c.mission_desc}>
                "{c.mission_desc}"
              </span>

              {c.status === 'pending_confirmation' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shrink-0 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 animate-spin" /> En validation
                </span>
              )}

              {onEliminate && (
                <button
                  onClick={() => onEliminate(c.target_id, c.target_pseudo)}
                  className="px-2.5 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-700/60 text-rose-300 border border-rose-700/50 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
                  title="Éliminer ce joueur manuellement"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Modérer</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
