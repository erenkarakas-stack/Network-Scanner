import React from 'react';

export const ScanRadar: React.FC<{ scanning: boolean }> = ({ scanning }) => {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer Circle */}
      <div className="absolute inset-0 border-2 border-cyber-700 rounded-full opacity-50"></div>
      <div className="absolute inset-4 border border-cyber-700 rounded-full opacity-30"></div>
      
      {/* Crosshair */}
      <div className="absolute w-full h-[1px] bg-cyber-700/50"></div>
      <div className="absolute h-full w-[1px] bg-cyber-700/50"></div>

      {/* Scanning Effect */}
      {scanning && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyber-500/0 to-cyber-500/40 absolute top-0 left-0 origin-bottom-right animate-spin origin-[100%_100%] duration-[2s]"></div>
        </div>
      )}
      
      {/* Center Dot */}
      <div className={`w-2 h-2 rounded-full z-10 ${scanning ? 'bg-cyber-500 shadow-[0_0_10px_#00ff9d]' : 'bg-red-500'}`}></div>
    </div>
  );
};