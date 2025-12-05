import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, onSaveKey }) => {
  const [inputKey, setInputKey] = useState(apiKey);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
          <span>🔑</span>
        </h2>
        
        <div className="mb-6">
          <label className="block text-lg font-semibold text-stone-700 mb-3">
            Google Gemini API Key
          </label>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="AI Studio에서 발급받은 키 입력"
            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-stone-800"
          />
          <p className="text-sm text-stone-600 mt-3 leading-relaxed">
            * 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.<br/>
            * <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-amber-600 underline">여기서 키 발급받기</a>
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            닫기
          </button>
          <button 
            onClick={() => {
              onSaveKey(inputKey);
              onClose();
            }}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};