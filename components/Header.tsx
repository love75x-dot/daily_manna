import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  hasKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, hasKey }) => {
  return (
    <header className="sticky top-0 z-50 bg-stone-100/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✝️</span>
          <h1 className="text-xl font-bold text-stone-800 tracking-tight">매일의 만나(@daily_manna)</h1>
        </div>
        <button 
          onClick={onOpenSettings}
          className={`p-2 rounded-full transition-colors text-2xl ${
            hasKey ? 'bg-stone-200 hover:bg-stone-300' : 'bg-amber-100 animate-pulse'
          }`}
          aria-label="API 키 설정"
        >
          🔑
        </button>
      </div>
    </header>
  );
};