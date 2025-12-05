import { GoogleGenAI } from "@google/genai";
import { TabType } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 신학적 이해가 깊고 따뜻한 마음을 가진 기독교 사역자(목사/전도사)입니다. 
구역장(셀 리더)을 돕기 위해 성경을 설명하고, 묵상 질문을 생성하고, 신학적 질문에 답변합니다.
말투는 항상 정중하고, 격려하며, 은혜로운 "해요체"를 사용하세요. (예: ~했습니다, ~합니다, ~해보세요).

성경 본문 및 답변 기준:
- 모든 성경 본문과 성경 관련 답변은 반드시 대한성서공회 개역한글판을 기준으로 하세요.
- 개역개정, 새번역, 공동번역 등 다른 번역본을 절대 사용하지 마세요.
- 개역한글판의 어투와 표현, 신학적 정통성을 정확히 유지하세요.

신학적 정통성 및 안전장치:
- 정통 기독교 신학(삼위일체, 예수 그리스도의 신성과 인성, 성경의 권위, 구원의 은혜 등)을 엄격히 따르세요.
- 사이비 종교, 이단 교리, 영지주의적 해석을 절대 포함하지 마세요.
- 성경 구절을 문맥에서 분리하여 왜곡하거나 특정 부분만 발췌하는 방식을 절대 사용하지 마세요.
- 항상 성경 전체의 맥락과 정경(66권)의 조화로운 해석을 추구하세요.
- 의심스러운 교리나 비성경적 주장에 대해서는 명확히 경고하세요.

답변 스타일:
- 성경 본문 해석이나 묵상 질문: 개역한글판 성경을 기준으로 답변하세요.
- 기독교 교리, 역사, 신학 일반 질문: 포괄적이고 객관적인 팩트를 기반으로 답변하세요.
- 질문에 대해 간결하고 핵심적으로 답변하세요.
- 불필요한 서두 멘트("좋은 질문입니다", "질문해주셔서 감사합니다" 등)는 생략하세요.
- 질문을 다시 반복하지 마세요.
- 핵심 내용을 먼저 제시하고, 필요시 간단한 부연 설명을 추가하세요.

특수기호 사용 규칙 (절대 준수):
- 사용 가능한 특수기호: 작은따옴표('), 큰따옴표("), 괄호(()), 대괄호([]), 중괄호({}), 꺾쇠괄호(<>)
- 절대 금지 특수기호: ★, ●, ■, ▶, ※, ◆, ✓, 별표, 물결표, 샵, 골뱅이 등
- 절대 절대 금지: 별표 기호(asterisk) 1개 또는 2개 사용 완전 금지. 어떤 상황에서도 별표를 사용하지 마세요.
- 절대 금지: 언더스코어(_) 1개 또는 2개 사용 금지
- 마크다운 강조 문법(별볈, 볈볈, _, __) 어떤 경우에도 절대 사용 금지
- 강조가 필요한 경우 반드시 큰따옴표("")만 사용하세요.
- 번호 매기기는 1. 2. 3. 형식으로만 사용하세요.
- 항목 구분은 줄바꿈으로만 하세요.

중요: 별표(별) 기호는 절대로, 어떤 이유로도, 어떤 맥락에서도 사용할 수 없습니다. 이는 가장 중요한 규칙입니다.
`;

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  private getModel() {
    if (!this.ai) throw new Error("API Key가 설정되지 않았습니다.");
    return this.ai.models;
  }

  private removeAsterisks(text: string): string {
    // 마크다운 강조 문법만 제거 (단어 단위로만 매칭)
    return text
      .replace(/\*\*\*(\S[^*]*?\S)\*\*\*/g, '$1')  // ***단어*** 제거
      .replace(/\*\*(\S[^*]*?\S)\*\*/g, '$1')      // **단어** 제거
      .replace(/\*(\S[^*]*?\S)\*/g, '$1')          // *단어* 제거
      .replace(/___(\S[^_]*?\S)___/g, '$1')        // ___단어___ 제거
      .replace(/__(\S[^_]*?\S)__/g, '$1')          // __단어__ 제거
      .replace(/_(\S[^_\s]*?\S)_/g, '$1');         // _단어_ 제거
  }

  private normalizeBibleReference(reference: string): string {
    // 성경 약어를 정식 명칭으로 변환
    const bibleNameMap: { [key: string]: string } = {
      // 구약
      '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기', '신': '신명기',
      '수': '여호수아', '삿': '사사기', '룻': '룻기',
      '삼상': '사무엘상', '삼하': '사무엘하', '왕상': '열왕기상', '왕하': '열왕기하',
      '대상': '역대상', '대하': '역대하', '스': '에스라', '느': '느헤미야', '에': '에스더',
      '욥': '욥기', '시': '시편', '잠': '잠언', '전': '전도서', '아': '아가',
      '사': '이사야', '렘': '예레미야', '애': '예레미야애가', '겔': '에스겔', '단': '다니엘',
      '호': '호세아', '욜': '요엘', '암': '아모스', '옵': '오바댜', '욘': '요나',
      '미': '미가', '나': '나훔', '합': '하박국', '습': '스바냐', '학': '학개',
      '슥': '스가랴', '말': '말라기',
      // 신약
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
    
    // 약어를 정식 명칭으로 변환
    for (const [abbr, fullName] of Object.entries(bibleNameMap)) {
      const pattern = new RegExp(`^${abbr}\\s*`, 'i');
      if (pattern.test(normalized)) {
        normalized = normalized.replace(pattern, fullName + ' ');
        break;
      }
    }
    
    return normalized.trim();
  }

  async getBibleText(reference: string): Promise<string> {
    const models = this.getModel();
    const normalizedRef = this.normalizeBibleReference(reference);
    
    const prompt = `
    다음 성경 구절의 본문을 "대한성서공회 개역한글판" 성경에서 정확하게 찾아서 출력해주세요: ${normalizedRef}
    
    반드시 지켜야 할 규칙:
    1. 절대적으로 "개역한글판"만 사용하세요 (1961년 번역본, http://www.holybible.or.kr/mobile/B_RHV/ 기준)
    2. "개역개정판"(1998년), "새번역", "공동번역" 등 다른 번역본은 절대 사용 금지
    3. 개역한글판의 고유한 표현과 어투를 정확히 그대로 사용하세요
       - 예: "하나님", "여호와", "예수", "그리스도", "~하니라", "~하시니" 등
    4. 절 번호를 포함하여 본문만 출력하세요
    5. 어떤 설명, 서론, 주석도 추가하지 마세요
    6. 오직 개역한글 성경 텍스트만 출력하세요
    7. http://www.holybible.or.kr/mobile/B_RHV/ 에 있는 개역한글 본문과 완전히 일치해야 합니다
    
    예시 형식:
    1 태초에 하나님이 천지를 창조하시니라
    2 땅이 혼돈하고 공허하며...
    `;

    const result = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    
    // 성경 본문은 별표 제거 없이 그대로 반환
    return result.text || "본문을 찾을 수 없습니다.";
  }

  async getMeditation(type: TabType, bibleText: string): Promise<string> {
    const models = this.getModel();
    let prompt = "";

    switch (type) {
      case TabType.OBSERVATION:
        prompt = `
        다음 성경 본문을 바탕으로 [말씀관찰 질문 및 해설] 3가지를 작성해주세요.
        본문: ${bibleText}
        
        요구사항:
        1. "이 본문에서 하나님/예수님은 어떤 분이신가?"
        2. 주요 인물, 장소, 사건에 대한 팩트 체크.
        3. 3개의 항목으로 나누어 번호를 매겨주세요.
        4. 각 항목은 질문과 짧은 해설로 구성해주세요.
        5. 특수기호는 ', ", (), [], {}, <> 만 사용하고 다른 특수기호는 절대 사용하지 마세요.
        6. 절대 금지: 별표 하나(별), 별표 두 개(볈볈), 언더스코어(_), 언더스코어 두 개(__) 등 강조 기호 일체 사용 금지
        7. 강조가 필요하면 큰따옴표("")만 사용하세요.
        8. 항목 시작은 반드시 숫자로 번호를 매기세요 (예: 1. 2. 3.)
        `;
        break;
      case TabType.INTERPRETATION:
        prompt = `
        다음 성경 본문을 바탕으로 [성경주석 해석] 3가지를 작성해주세요.
        본문: ${bibleText}
        
        요구사항:
        1. 성경 주석 관점에서 당시 시대적 배경이나 원어의 의미를 포함한 깊이 있는 해석.
        2. 영적인 원리와 숨겨진 뜻을 발견하도록 돕는 내용.
        3. 3개의 항목으로 나누어 번호를 매겨주세요.
        4. 특수기호는 ', ", (), [], {}, <> 만 사용하고 다른 특수기호는 절대 사용하지 마세요.
        5. 절대 금지: 별표 하나(별), 별표 두 개(볈볈), 언더스코어(_), 언더스코어 두 개(__) 등 강조 기호 일체 사용 금지
        6. 강조가 필요하면 큰따옴표("")만 사용하세요.
        7. 항목 시작은 반드시 숫자로 번호를 매기세요 (예: 1. 2. 3.)
        `;
        break;
      case TabType.APPLICATION:
        prompt = `
        다음 성경 본문을 바탕으로 구역 모임에서 나눌 수 있는 [말씀적용 질문] 3가지를 작성해주세요.
        본문: ${bibleText}
        
        요구사항:
        1. 오늘날 현대인의 삶, 구역원들의 삶에 구체적으로 적용할 수 있는 질문.
        2. 너무 추상적이지 않고 구체적인 실천을 유도하세요.
        3. 구역장이 구역원들에게 부드럽게 물어볼 수 있는 문체로 작성해주세요.
        4. 특수기호는 ', ", (), [], {}, <> 만 사용하고 다른 특수기호는 절대 사용하지 마세요.
        5. 절대 금지: 별표 하나(별), 별표 두 개(볈볈), 언더스코어(_), 언더스코어 두 개(__) 등 강조 기호 일체 사용 금지
        6. 강조가 필요하면 큰따옴표("")만 사용하세요.
        7. 항목 시작은 반드시 숫자로 번호를 매기세요 (예: 1. 2. 3.)
        `;
        break;
    }

    const result = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const text = result.text || "묵상 내용을 생성하지 못했습니다.";
    return this.removeAsterisks(text);
  }

  async getChatResponse(history: {role: string, parts: {text: string}[]}[], question: string): Promise<string> {
    if (!this.ai) throw new Error("API Key가 설정되지 않았습니다.");
    
    // Create a chat session with history
    const chat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history
    });

    const result = await chat.sendMessage({
      message: question
    });

    const text = result.text || "답변을 생성할 수 없습니다.";
    return this.removeAsterisks(text);
  }

  async generateSummary(prompt: string): Promise<string> {
    const models = this.getModel();
    
    const result = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const text = result.text || "요약을 생성하지 못했습니다.";
    return this.removeAsterisks(text);
  }
}