import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeDisplay({ gameCode }) {
  const joinUrl = `${window.location.origin}/join?code=${gameCode}`;

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
      <div className="p-3 bg-white rounded-xl shadow-xl">
        <QRCodeSVG value={joinUrl} size={180} level="H" includeMargin={false} />
      </div>
      <p className="text-xs text-slate-400 font-medium">
        Scannez pour rejoindre avec <span className="text-rose-400 font-bold font-mono">{gameCode}</span>
      </p>
    </div>
  );
}
