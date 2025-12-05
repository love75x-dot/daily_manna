import { GoogleGenAI } from "@google/genai";
import { TabType } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 신학적 이해가 깊고 따뜻한 마음을 가진 기독교 사역자(목사/전도사)입니다. 
구역장(셀 리더)을 돕기 위해 성경을 설명하고, 묵상 질문을 생성하고, 신학적 질문에 답변합니다.
말투는 항상 정중하고, 격려하며, 은혜로운 "해요체"를 사용하세요. (예: ~했습니다, ~합니다, ~해보세요).
성경 본문은 반드시 대한성서공회 개역한글판만 사용하세요. 개역개정, 새번역, 공동번역 등 다른 번역본을 절대 사용하지 마세요.
개역한글판의 어투와 표현, 신학적 정통성을 정확히 유지하세요.

특수기호 사용 규칙:
- 사용 가능한 특수기호: 작은따옴표('), 큰따옴표("), 괄호(()), 대괄호([]), 중괄호({}), 꺾쇠괄호(<>)
- 위 기호를 제외한 다른 특수기호(★, ●, ■, ▶, ※, ◆, ✓ 등)는 절대 사용하지 마세요.
- 번호 매기기는 1. 2. 3. 형식으로만 사용하세요.
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

  async getBibleText(reference: string): Promise<string> {
    const models = this.getModel();
    const prompt = `
    성경 본문 "${reference}"의 내용을 '대한성서공회 개역한글판'으로만 정확하게 출력해주세요.
    반드시 개역한글판만 사용하고, 개역개정이나 다른 번역본을 절대 사용하지 마세요.
    절 번호를 포함하여 텍스트만 깔끔하게 출력해주세요.
    다른 서론이나 본론, 주석 없이 오직 개역한글 성경 텍스트만 출력하세요.
    `;

    const result = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    
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
        5. 특수기호는 ', ", (), [], {}, <> 만 사용하고 다른 특수기호는 사용하지 마세요.
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
        4. 특수기호는 ', ", (), [], {}, <> 만 사용하고 다른 특수기호는 사용하지 마세요.
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
        4. 특수기호는 ', ", (), [], {}, <> 만 사용하고 다른 특수기호는 사용하지 마세요.
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

    return result.text || "묵상 내용을 생성하지 못했습니다.";
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

    return result.text || "답변을 생성할 수 없습니다.";
  }
}