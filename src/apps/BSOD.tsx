import React, { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';

interface BSODProps {
  onRestart: () => void;
}

export const BSOD: React.FC<BSODProps> = ({ onRestart }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onRestart, 1200);
          return 100;
        }
        return p + Math.floor(Math.random() * 18) + 5;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [onRestart]);

  return (
    <div
      onClick={onRestart}
      className="fixed inset-0 bg-[#0078d7] text-white flex flex-col justify-center px-12 md:px-32 font-sans select-none z-[9999] cursor-pointer"
    >
      <div className="max-w-3xl space-y-6">
        <div className="text-8xl font-light mb-6">: (</div>
        <h1 className="text-2xl md:text-3xl font-light leading-snug">
          Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.
        </h1>
        <div className="text-xl md:text-2xl font-light py-2">
          {percent}% complete
        </div>

        <div className="flex items-center space-x-6 pt-6">
          <div className="bg-white p-2 rounded shadow-md text-black">
            <QrCode size={90} strokeWidth={1.5} />
          </div>
          <div className="text-xs space-y-1 font-light opacity-90">
            <p>For more information about this issue and possible fixes, visit https://windows.com/stopcode</p>
            <p className="pt-2 font-mono text-[11px]">Stop code: CRITICAL_PROCESS_DIED</p>
            <p className="font-mono text-[11px]">What failed: win32kfull.sys</p>
            <p className="pt-3 opacity-60 italic text-[11px]">(Click anywhere to restart immediately)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
