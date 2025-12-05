import React, { useState, useEffect } from 'react';
import { BibleData, MeditationContent } from '../types';
import { GeminiService } from '../services/geminiService';

interface KakaoShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bibleData: BibleData;
  meditation: MeditationContent;
  apiKey: string;
}

export const KakaoShareModal: React.FC<KakaoShareModalProps> = ({
  isOpen, onClose, bibleData, meditation, apiKey
}) => {
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && !summary) {
      generateDefaultSummary();
    }
  }, [isOpen]);

  const generateDefaultSummary = () => {
    const parts = [];
    
    parts.push(`📖 ${bibleData.reference}`);
    parts.push('');
    
    // 성경 본문 요약 (첫 구절만 또는 짧게)
    const textLines = bibleData.text.split('\n').filter(line => line.trim());
    if (textLines.length > 0) {
      const firstVerse = textLines[0].length > 80 ? textLines[0].substring(0, 80) + '...' : textLines[0];
      parts.push(firstVerse);
      parts.push('');
    }
    
    // 말씀관찰 요약
    if (meditation.observation) {
      parts.push('🔍 말씀관찰');
      const obsLines = meditation.observation.split('\n').filter(line => line.trim());
      const obsFirst = obsLines.find(line => line.includes('1.') || line.includes('1)'));
      if (obsFirst) {
        parts.push(obsFirst.length > 100 ? obsFirst.substring(0, 100) + '...' : obsFirst);
      }
      parts.push('');
    }
    
    // 말씀적용 요약
    if (meditation.application) {
      parts.push('✨ 말씀적용');
      const appLines = meditation.application.split('\n').filter(line => line.trim());
      const appFirst = appLines.find(line => line.includes('1.') || line.includes('1)'));
      if (appFirst) {
        parts.push(appFirst.length > 100 ? appFirst.substring(0, 100) + '...' : appFirst);
      }
      parts.push('');
    }
    
    parts.push('💬 함께 은혜 나눠요!');
    
    setSummary(parts.join('\n'));
  };

  const generateAISummary = async () => {
    if (!apiKey) {
      alert('API 키가 필요합니다.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const geminiService = new GeminiService(apiKey);
      
      const prompt = `
      다음 성경 묵상 내용을 카카오톡으로 공유하기 좋게 요약해주세요.
      
      성경 본문: ${bibleData.reference}
      ${bibleData.text}
      
      말씀관찰: ${meditation.observation || '없음'}
      
      말씀적용: ${meditation.application || '없음'}
      
      요구사항:
      1. 카카오톡 메시지로 보내기 적합한 길이 (10-15줄 이내)
      2. 이모지를 적절히 사용하여 가독성 높이기
      3. 핵심 메시지만 간결하게 전달
      4. 따뜻하고 격려하는 톤 유지
      5. 성경 구절 인용 포함
      6. 특수기호는 ', ", (), [], {}, <> 만 사용
      `;

      const models = geminiService['getModel']();
      const result = await models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setSummary(result.text || '요약 생성에 실패했습니다.');
      setIsGenerating(false);
    } catch (error) {
      console.error(error);
      alert('요약 생성 중 오류가 발생했습니다.');
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary).then(() => {
      alert('카카오톡 공유 내용이 복사되었습니다! 💬');
      onClose();
    }).catch(() => {
      alert('복사에 실패했습니다.');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <span>💬</span> 카카오톡 공유
            </h2>
            <button 
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-stone-600">
            묵상 내용을 요약하여 카카오톡으로 공유하세요
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex gap-2">
            <button
              onClick={generateDefaultSummary}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors text-sm"
            >
              기본 요약
            </button>
            <button
              onClick={generateAISummary}
              disabled={isGenerating}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {isGenerating ? 'AI 요약 중...' : 'AI 요약'}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors text-sm"
            >
              {isEditing ? '편집 완료' : '내용 수정'}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full h-96 p-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm"
              placeholder="공유할 내용을 입력하세요..."
            />
          ) : (
            <div className="bg-[#FEE500] rounded-lg p-6 min-h-96">
              <pre className="whitespace-pre-wrap font-sans text-sm text-[#3c1e1e] leading-relaxed">
{summary || '요약 버튼을 눌러 내용을 생성하세요.'}
              </pre>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-stone-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleCopy}
            disabled={!summary}
            className="px-6 py-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            복사하기
          </button>
        </div>
      </div>
    </div>
  );
};
