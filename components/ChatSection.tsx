import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatSectionProps {
  history: ChatMessage[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  history, input, setInput, onSend, isLoading
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  return (
    <section className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 bg-stone-800 text-amber-50 border-b border-stone-700 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-base">
          <span>💬</span> AI 신앙 동역자
        </h3>
        <span className="text-sm opacity-70">성경적 답변 가이드</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-4" ref={scrollRef}>
        {history.length === 0 && (
          <div className="text-center text-stone-400 py-10 px-6">
            <p className="mb-2 text-3xl">👋</p>
            <p className="text-base">"구역원들이 어려운 질문을 했나요?"</p>
            <p className="text-sm mt-2">무엇이든 물어보시면 성경적 근거로 답변해드립니다.</p>
          </div>
        )}
        
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-stone-700 text-white rounded-br-none' 
                : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap text-base leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white text-stone-500 border border-stone-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-stone-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSend()}
            placeholder="질문을 입력하세요..."
            className="flex-1 px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-500 outline-none bg-stone-50"
          />
          <button
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </section>
  );
};