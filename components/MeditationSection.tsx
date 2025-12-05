import React from 'react';
import { TabType, MeditationContent } from '../types';

interface MeditationSectionProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  content: MeditationContent;
  isLoading: boolean;
  hasBibleText: boolean;
  onGenerate: (tab: TabType) => void;
}

export const MeditationSection: React.FC<MeditationSectionProps> = ({
  activeTab, setActiveTab, content, isLoading, hasBibleText, onGenerate
}) => {
  if (!hasBibleText) return null;

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    if (!content[tab]) {
      onGenerate(tab);
    }
  };

  const tabs = [
    { id: TabType.OBSERVATION, label: '말씀관찰', icon: '🔍', desc: '하나님 찾기 & 팩트체크' },
    { id: TabType.INTERPRETATION, label: '성경주석 해석', icon: '💡', desc: '영적 의미와 신학적 배경' },
    { id: TabType.APPLICATION, label: '말씀적용', icon: '✨', desc: '구역 모임 실천 질문' },
  ];

  return (
    <section className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden mb-6">
      <div className="flex border-b border-stone-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === tab.id 
                ? 'bg-white text-amber-700' 
                : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="font-bold text-sm">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
            )}
          </button>
        ))}
      </div>

      <div className="p-6 min-h-[200px]">
        <div className="mb-4 text-center">
             <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {tabs.find(t => t.id === activeTab)?.desc}
             </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-stone-400">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
            <p className="animate-pulse">묵상 내용을 깊이 생각하고 있습니다...</p>
          </div>
        ) : content[activeTab] ? (
          <div className="prose prose-stone max-w-none animate-fade-in">
            <div className="whitespace-pre-wrap text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100">
              {content[activeTab]}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-stone-500 mb-4">아직 생성된 묵상 내용이 없습니다.</p>
            <button 
              onClick={() => onGenerate(activeTab)}
              className="px-6 py-2 bg-amber-100 text-amber-800 rounded-full hover:bg-amber-200 font-semibold transition-colors"
            >
              묵상 내용 생성하기
            </button>
          </div>
        )}
      </div>
    </section>
  );
};