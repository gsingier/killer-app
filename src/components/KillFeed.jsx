import React from 'react';
import { Skull, Zap } from 'lucide-react';

export default function KillFeed({ killfeed = [] }) {
  if (!killfeed || killfeed.length === 0) {
    return (
      <div className="p-6 rounded-2xl glass-card text-center text-slate-500 text-sm italic">
        Aucune élimination pour le moment. Le sang n'a pas encore coulé... 🗡️
      </div>
    );
  }

  return (
    <div className="p-5 rounded-3xl glass-card space-y-4">
      <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" />
        Killfeed En Direct ({killfeed.length})
      </h3>

      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {killfeed.map((k) => (
          <div
            key={k.id}
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <Skull className="w-4 h-4" />
            </div>

            <div className="flex-1 space-y-1">
              <p className="text-slate-200">
                <strong className="text-white font-bold">{k.killer_pseudo}</strong> a éliminé{' '}
                <strong className="text-rose-400 font-bold">{k.target_pseudo}</strong> !
              </p>
              <p className="text-slate-400 italic">
                Mission : "{k.mission_description}"
              </p>
            </div>

            <span className="text-[10px] text-slate-500 font-mono shrink-0">
              {new Date(k.killed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
