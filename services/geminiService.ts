
import { GoogleGenAI } from "@google/genai";
import { Expense, HealthLog, PetProfile } from "../types";

// 宣告 process 變數以符合 TypeScript 編譯檢查
declare var process: { env: { [key: string]: string | undefined } };

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getAgeString = (birthday: string) => {
    if (!birthday) return "年齡未知";
    const birthDate = new Date(birthday);
    const now = new Date();
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    return `${years}歲${months}個月`;
};

export const GeminiService = {
  /**
   * Analyzes spending habits based on expense history
   */
  analyzeSpending: async (expenses: Expense[], profile: PetProfile) => {
    if (expenses.length === 0) return "目前沒有足夠的花費資料進行分析。";

    const expenseSummary = expenses.map(e => `${e.date}: ${e.category} - $${e.amount} (${e.description})`).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一個專業的寵物財務規劃顧問。
        寵物資料: ${profile.name} (${profile.type}, ${getAgeString(profile.birthday)}).
        
        請根據以下的花費紀錄，用繁體中文提供簡短的（150字以內）分析與省錢建議。語氣要親切。
        
        花費紀錄:
        ${expenseSummary}`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "暫時無法連接 AI 服務，請稍後再試。";
    }
  },

  /**
   * Provides health advice based on recent logs
   */
  analyzeHealth: async (logs: HealthLog[], profile: PetProfile) => {
    const relevantLogs = logs.slice(0, 10); // Analyze last 10 logs
    const logSummary = relevantLogs.map(l => `${l.date} [${l.type}]: ${l.title} - ${l.description}`).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一個經驗豐富的獸醫助理（非正式醫療建議）。
        寵物資料: ${profile.name} (${profile.type}, ${profile.weight}kg, ${getAgeString(profile.birthday)}).
        寵物個性/描述: ${profile.bio || "無"}.
        
        請根據以下的近期健康與看診紀錄，用繁體中文提供一個簡短的健康摘要與注意事項（150字以內）。
        請特別留意是否有根據寵物個性或年齡需要注意的地方（例如老狗、幼貓）。
        如果有驅蟲紀錄，請確認是否規律。
        
        紀錄:
        ${logSummary}`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "暫時無法連接 AI 服務，請稍後再試。";
    }
  },

  /**
   * General Q&A
   */
  askPetQuestion: async (question: string, profile: PetProfile) => {
     try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一個寵物專家。使用者問了一個關於他們寵物 (${profile.type}, ${profile.name}, ${getAgeString(profile.birthday)}) 的問題。
        寵物個性: ${profile.bio || "無特別說明"}
        
        使用者的問題：
        "${question}"
        
        請用繁體中文回答，簡潔有力，並提醒如有嚴重問題應就醫。`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "暫時無法回答您的問題。";
    }
  },

  /**
   * Nutritional Advice
   */
  analyzeNutrition: async (profile: PetProfile) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一位專業的寵物營養師。
        請根據以下資料，計算寵物的每日所需熱量 (DER) 以及建議的餵食量。
        
        寵物資料:
        - 名字: ${profile.name}
        - 物種: ${profile.type}
        - 年齡: ${getAgeString(profile.birthday)}
        - 體重: ${profile.weight} kg
        - 描述(包含活動量): ${profile.bio || "一般活動量"}
        
        請回覆一個結構清晰的建議，必須包含：
        1. **每日建議熱量 (kcal)**: 請根據體重與年齡係數計算 (RER * 係數)。
        2. **建議乾飼料克數 (g)**: 假設一般乾飼料熱量約為 3500-4000 kcal/kg (或 3.5-4 kcal/g)，請給出一個範圍。
        3. **營養小貼士**: 針對該年齡層（如幼犬、老貓）的簡短飲食建議 (50字以內)。

        請用繁體中文回答，語氣專業但親切。不要使用 markdown 表格，使用條列式即可。`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "暫時無法連接 AI 服務進行營養分析。";
    }
  }
};
