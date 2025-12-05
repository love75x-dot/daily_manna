import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { BibleSection } from './components/BibleSection';
import { MeditationSection } from './components/MeditationSection';
import { ChatSection } from './components/ChatSection';
import { KakaoShareModal } from './components/KakaoShareModal';
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

  const [isSharedView, setIsSharedView] = useState(false);
  const [showKakaoShare, setShowKakaoShare] = useState(false);

  // Load API Key from local storage on mount and check for shared content
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('shared');
    
    if (sharedData) {
      // Shared view mode
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
        setState(prev => ({
          ...prev,
          bibleData: { reference: decoded.reference, text: decoded.text },
          meditation: {
            observation: decoded.observation,
            interpretation: decoded.interpretation,
            application: decoded.application,
          },
        }));
        setIsSharedView(true);
      } catch (error) {
        console.error('Failed to parse shared data:', error);
      }
    } else {
      // Normal mode - load API key
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) {
        setState(prev => ({ ...prev, apiKey: storedKey }));
      } else {
        setState(prev => ({ ...prev, showSettings: true }));
      }
    }
  }, []);

  const geminiService = new GeminiService(state.apiKey);

  const normalizeBibleReference = (reference: string): string => {
    const bibleNameMap: { [key: string]: string } = {
      '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기', '신': '신명기',
      '수': '여호수아', '삿': '사사기', '룻': '룻기',
      '삼상': '사무엘상', '삼하': '사무엘하', '왕상': '열왕기상', '왕하': '열왕기하',
      '대상': '역대상', '대하': '역대하', '스': '에스라', '느': '느헤미야', '에': '에스더',
      '욥': '욥기', '시': '시편', '잠': '잠언', '전': '전도서', '아': '아가',
      '사': '이사야', '렘': '예레미야', '애': '예레미야애가', '겔': '에스겔', '단': '다니엘',
      '호': '호세아', '욜': '요엘', '암': '아모스', '옵': '오바댜', '욘': '요나',
      '미': '미가', '나': '나훔', '합': '하박국', '습': '스바냐', '학': '학개',
      '슥': '스가랴', '말': '말라기',
      '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음',
      '행': '사도행전', '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서',
      '갈': '갈라디아서', '엡': '에베소서', '빌': '빌립보서', '골': '골로새서',
      '살전': '데살로니가전서', '살후': '데살로니가후서', '딤전': '디모데전서', '딤후': '디모데후서',
      '딛': '디도서', '몬': '빌레몬서', '히': '히브리서',
      '약': '야고보서', '벧전': '베드로전서', '벧후': '베드로후서',
      '요일': '요한일서', '요이': '요한이서', '요삼': '요한삼서', '유': '유다서',
      '계': '요한계시록'
    };

    let normalized = reference;
    for (const [abbr, fullName] of Object.entries(bibleNameMap)) {
      const pattern = new RegExp(`^${abbr}\\s*`, 'i');
      if (pattern.test(normalized)) {
        normalized = normalized.replace(pattern, fullName + ' ');
        break;
      }
    }
    return normalized.trim();
  };

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
      const normalizedReference = normalizeBibleReference(state.bibleInput);
      setState(prev => ({
        ...prev,
        isLoadingBible: false,
        bibleData: { reference: normalizedReference, text },
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

      {isSharedView && (
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">👀</span>
            <div>
              <p className="font-bold text-amber-900">공유된 묵상 내용입니다</p>
              <p className="text-sm text-amber-700">누군가가 공유한 말씀 묵상을 보고 계십니다.</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-6">
        {!isSharedView && (
          <BibleSection 
            bibleInput={state.bibleInput}
            setBibleInput={(val) => setState(prev => ({ ...prev, bibleInput: val }))}
            onSearch={handleBibleSearch}
            isLoading={state.isLoadingBible}
            bibleData={state.bibleData}
          />
        )}

        {isSharedView && state.bibleData && (
          <section className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden mb-6">
            <div className="p-6 bg-[#fffaf0] relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200/20 via-amber-400/20 to-amber-200/20"></div>
              <h2 className="text-2xl font-bold text-stone-800 mb-4 text-center border-b-2 border-amber-100 pb-4">
                {state.bibleData.reference}
              </h2>
              <div className="prose prose-stone max-w-none">
                <p className="whitespace-pre-wrap text-lg leading-relaxed text-stone-800 font-serif">
                  {state.bibleData.text}
                </p>
              </div>
            </div>
          </section>
        )}

        <MeditationSection 
          activeTab={state.activeTab}
          setActiveTab={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
          content={state.meditation}
          isLoading={state.isLoadingMeditation}
          hasBibleText={!!state.bibleData}
          onGenerate={(tab) => handleGenerateMeditation(tab)}
          bibleReference={state.bibleData?.reference}
          bibleText={state.bibleData?.text}
        />

        {!isSharedView && (
          <ChatSection 
            history={state.chatHistory}
            input={state.chatInput}
            setInput={(val) => setState(prev => ({ ...prev, chatInput: val }))}
            onSend={handleChatSend}
            isLoading={state.isLoadingChat}
          />
        )}
      </main>

      {/* 카카오톡 공유 버튼 */}
      {!isSharedView && state.bibleData && (state.meditation.observation || state.meditation.interpretation || state.meditation.application) && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <button 
            onClick={() => setShowKakaoShare(true)}
            className="flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] px-6 py-3 rounded-full shadow-lg font-bold transition-transform hover:scale-105"
          >
            <span className="text-xl">💬</span> 카카오톡 공유
          </button>
        </div>
      )}

      <SettingsModal 
        isOpen={state.showSettings}
        onClose={() => setState(prev => ({ ...prev, showSettings: false }))}
        apiKey={state.apiKey}
        onSaveKey={handleSaveKey}
      />

      {state.bibleData && (
        <KakaoShareModal
          isOpen={showKakaoShare}
          onClose={() => setShowKakaoShare(false)}
          bibleData={state.bibleData}
          meditation={state.meditation}
          apiKey={state.apiKey}
        />
      )}
    </div>
  );
}