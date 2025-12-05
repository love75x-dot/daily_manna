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
    
    parts.push('<QT 나눔>');
    parts.push(bibleData.reference);
    parts.push('');
    
    // 말씀요약 (성경 본문을 2-3줄로 요약)
    parts.push('<말씀요약>');
    const textLines = bibleData.text.split('\n').filter(line => line.trim());
    if (textLines.length > 0) {
      const summary = textLines.slice(0, 2).join(' ').substring(0, 150);
      parts.push(summary + (summary.length >= 150 ? '...' : ''));
    }
    parts.push('');
    
    // 와닿은 점, 느낀점, 말씀 적용내용
    const allContent = [
      meditation.observation || '',
      meditation.interpretation || '',
      meditation.application || ''
    ].join('\n');
    
    const contentLines = allContent.split('\n')
      .filter(line => line.trim())
      .filter(line => !line.includes('1.') && !line.includes('2.') && !line.includes('3.'))
      .filter(line => !line.includes('1)') && !line.includes('2)') && !line.includes('3)'))
      .slice(0, 3);
    
    parts.push(contentLines.join('\n'));
    
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
      
      말씀해석: ${meditation.interpretation || '없음'}
      
      말씀적용: ${meditation.application || '없음'}
      
      요구사항:
      1. 다음 형식으로 작성:
      
      <QT 나눔>
      성경구절 (예: 시편 35)
      
      <말씀요약>
      성경 본문을 2-3줄로 요약
      
      그 후 와닿은 점, 느낀점, 말씀 적용내용을 자연스럽게 작성
      
      2. 이모지는 절대 사용하지 말 것
      3. 1, 2, 3 같은 번호 매기지 말 것
      4. AI가 쓴 것처럼 형식적이지 않게, 자연스럽고 진솔하게 작성
      5. 따뜻하고 격려하는 톤 유지
      6. 특수기호는 ', ", (), [], {}, <> 만 사용
      7. 전체 길이는 10-15줄 이내
      `;

      const result = await geminiService.generateSummary(prompt);
      setSummary(result || '요약 생성에 실패했습니다.');
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
