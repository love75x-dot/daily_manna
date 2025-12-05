import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { BibleSection } from './components/BibleSection';
import { MeditationSection } from './components/MeditationSection';
import { ChatSection } from './components/ChatSection';
import { AppState, BibleData, ChatMessage, MeditationContent, TabType } from './types';
import { GeminiService } from './services/geminiService';

export default function App() {
  const [state, setState] = useState<AppState>({
    apiKey: '',
    showSettings: false,
    bibleInput: '',
    bibleData: null,
    meditation: {
      observation: null,
      interpretation: null,
      application: null,
    },
    activeTab: TabType.OBSERVATION,
    chatInput: '',
    chatHistory: [],
    isLoadingBible: false,
    isLoadingMeditation: false,
    isLoadingChat: false,
  });

  // Load API Key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setState(prev => ({ ...prev, apiKey: storedKey }));
    } else {
      setState(prev => ({ ...prev, showSettings: true }));
    }
  }, []);

  const geminiService = new GeminiService(state.apiKey);

  const handleSaveKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setState(prev => ({ ...prev, apiKey: key }));
  };

  const handleBibleSearch = async () => {
    if (!state.apiKey) {
      alert("설정에서 API 키를 먼저 입력해주세요.");
      setState(prev => ({ ...prev, showSettings: true }));
      return;
    }
    if (!state.bibleInput.trim()) return;

    setState(prev => ({ 
      ...prev, 
      isLoadingBible: true, 
      bibleData: null,
      meditation: { observation: null, interpretation: null, application: null },
      activeTab: TabType.OBSERVATION 
    }));

    try {
      const text = await geminiService.getBibleText(state.bibleInput);
      setState(prev => ({
        ...prev,
        isLoadingBible: false,
        bibleData: { reference: state.bibleInput, text },
      }));
      // Auto-generate observation when Bible text loads
      handleGenerateMeditation(TabType.OBSERVATION, text);
    } catch (error) {
      console.error(error);
      alert("성경 본문을 가져오는 중 오류가 발생했습니다.");
      setState(prev => ({ ...prev, isLoadingBible: false }));
    }
  };

  const handleGenerateMeditation = async (type: TabType, textOverride?: string) => {
    const textToUse = textOverride || state.bibleData?.text;
    if (!state.apiKey || !textToUse) return;

    // Check if already exists to avoid re-fetching
    if (state.meditation[type] && !textOverride) return;

    setState(prev => ({ ...prev, isLoadingMeditation: true }));

    try {
      const result = await geminiService.getMeditation(type, textToUse);
      setState(prev => ({
        ...prev,
        isLoadingMeditation: false,
        meditation: { ...prev.meditation, [type]: result }
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isLoadingMeditation: false }));
    }
  };

  const handleChatSend = async () => {
    if (!state.apiKey) {
      alert("API 키가 필요합니다.");
      return;
    }
    if (!state.chatInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: state.chatInput };
    
    // Optimistic update
    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMsg],
      chatInput: '',
      isLoadingChat: true
    }));

    try {
      // Format history for Gemini API
      const apiHistory = state.chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      // Add context from current Bible text if available
      let prompt = state.chatInput;
      if (state.bibleData) {
        prompt = `[현재 묵상중인 본문: ${state.bibleData.reference}]\n질문: ${state.chatInput}`;
      }

      const responseText = await geminiService.getChatResponse(apiHistory, prompt);
      
      const modelMsg: ChatMessage = { role: 'model', text: responseText };
      
      setState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, modelMsg],
        isLoadingChat: false
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isLoadingChat: false }));
    }
  };

  const handleShare = async () => {
    if (!state.bibleData) return;

    const shareText = `
🙏 [오늘의 구역 나눔]
📖 본문: ${state.bibleData.reference}

${state.bibleData.text.substring(0, 100)}...

✨ 묵상 포인트
${state.meditation.application || state.meditation.observation || "함께 묵상해봅시다."}

💬 오늘도 은혜로운 하루 보내세요!
`.trim();

    try {
      await navigator.clipboard.writeText(shareText);
      alert("카카오톡 공유 텍스트가 복사되었습니다! ✨");
    } catch (err) {
      alert("복사에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header 
        onOpenSettings={() => setState(prev => ({ ...prev, showSettings: true }))} 
        hasKey={!!state.apiKey}
      />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <BibleSection 
          bibleInput={state.bibleInput}
          setBibleInput={(val) => setState(prev => ({ ...prev, bibleInput: val }))}
          onSearch={handleBibleSearch}
          isLoading={state.isLoadingBible}
          bibleData={state.bibleData}
        />

        <MeditationSection 
          activeTab={state.activeTab}
          setActiveTab={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
          content={state.meditation}
          isLoading={state.isLoadingMeditation}
          hasBibleText={!!state.bibleData}
          onGenerate={(tab) => handleGenerateMeditation(tab)}
        />

        <ChatSection 
          history={state.chatHistory}
          input={state.chatInput}
          setInput={(val) => setState(prev => ({ ...prev, chatInput: val }))}
          onSend={handleChatSend}
          isLoading={state.isLoadingChat}
        />
      </main>

      {/* Floating Share Button */}
      {state.bibleData && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] px-6 py-3 rounded-full shadow-lg font-bold transition-transform hover:scale-105"
          >
            <span className="text-xl">💬</span> 카카오톡 공유 복사
          </button>
        </div>
      )}

      <SettingsModal 
        isOpen={state.showSettings}
        onClose={() => setState(prev => ({ ...prev, showSettings: false }))}
        apiKey={state.apiKey}
        onSaveKey={handleSaveKey}
      />
    </div>
  );
}