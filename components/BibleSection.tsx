import React from 'react';
import { BibleData } from '../types';

interface BibleSectionProps {
  bibleInput: string;
  setBibleInput: (val: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  bibleData: BibleData | null;
}

export const BibleSection: React.FC<BibleSectionProps> = ({ 
  bibleInput, setBibleInput, onSearch, isLoading, bibleData 
}) => {
  return (
    <section className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden mb-6">
      <div className="p-6 bg-stone-50 border-b border-stone-100">
        <label className="block text-stone-600 font-bold mb-2 text-base">📖 오늘의 말씀 찾기</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={bibleInput}
            onChange={(e) => setBibleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="예: 요한복음 3장 16절"
            className="flex-1 px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 outline-none text-base"
          />
          <button 
            onClick={onSearch}
            disabled={isLoading}
            className="px-6 py-3 bg-stone-800 hover:bg-stone-900 text-amber-50 rounded-lg font-bold transition-colors disabled:opacity-50 text-base"
          >
            {isLoading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>

      {bibleData && (
        <div className="p-6 bg-[#fffaf0] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200/20 via-amber-400/20 to-amber-200/20"></div>
            <h2 className="text-xl font-bold text-stone-800 mb-4 text-center border-b-2 border-amber-100 pb-4">
                {bibleData.reference}
            </h2>
            <div className="prose prose-stone max-w-none">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-800 font-serif">
                    {bibleData.text}
                </p>
            </div>
        </div>
      )}
    </section>
  );
};