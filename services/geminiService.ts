import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

export const generateQuestions = async (
  content: string,
  apiKey?: string
): Promise<Question[]> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("API Key 未设置。请点击右上角设置按钮输入您的 Gemini API Key。");
  }

  const ai = new GoogleGenAI({ apiKey: key });

  // Schema for the response
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: {
            type: Type.STRING,
            enum: ["single", "multiple"],
            description: "The type of the question: 'single' for single choice, 'multiple' for multiple choice."
        },
        text: {
          type: Type.STRING,
          description: "The question text in Chinese.",
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "An array of 4 to 5 multiple choice options in Chinese.",
        },
        correctAnswerIndices: {
          type: Type.ARRAY,
          items: { type: Type.INTEGER },
          description: "An array of integers representing the indices of the correct options (0-based). For single choice, this array has one element.",
        },
        explanation: {
          type: Type.STRING,
          description: "A detailed explanation in Chinese.",
        },
      },
      required: ["type", "text", "options", "correctAnswerIndices", "explanation"],
    },
  };

  // Reduce context slightly to 30,000 to improve network reliability
  const prompt = `
    你是一位专业的考试出题专家。
    请深入分析提供的文本内容，并严格生成 **50道** 高质量的题目。
    
    生成指南：
    1. **数量要求**：必须尝试生成 50 道题目。如果内容不足，请尽可能多生成。
    2. **题型混合**：
       - 约 70% 为 **单选题** (Single Choice)。
       - 约 30% 为 **多选题** (Multiple Choice)。
    3. **语言要求**：所有问题、选项和解析必须完全使用中文（简体）。
    4. **难度要求**：问题应考察理解、分析和应用，避免简单死记硬背。
    5. **选项要求**：每道题提供 4 个或 5 个选项。
    6. **解析要求**：为每道题提供详细的中文解析，解释为什么选这些答案。
    
    对于多选题，correctAnswerIndices 数组中必须包含所有正确选项的索引。
    
    输入内容：
    ${content.substring(0, 30000)} ... (truncated if too long)
  `;

  // Implement Retry Logic for robustness against Network/XHR errors
  const MAX_RETRIES = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.5,
        },
      });

      const rawJson = response.text;
      if (!rawJson) throw new Error("No data returned from Gemini.");

      const parsedQuestions = JSON.parse(rawJson);

      // Enforce strictly 50 questions if the model returns more
      const slicedQuestions = parsedQuestions.slice(0, 50);

      // Map to ensure IDs and types match our interface
      return slicedQuestions.map((q: any, index: number) => ({
        id: index,
        type: q.type || (q.correctAnswerIndices.length > 1 ? 'multiple' : 'single'),
        text: q.text,
        options: q.options,
        correctAnswerIndices: q.correctAnswerIndices,
        explanation: q.explanation,
      }));

    } catch (error: any) {
      console.warn(`Attempt ${attempt} of ${MAX_RETRIES} failed:`, error);
      lastError = error;
      
      // We don't retry if it's an API Key error (usually 400/401/403).
      const errorMsg = error.toString().toLowerCase();
      if (errorMsg.includes("api key") || errorMsg.includes("permission")) {
        throw error;
      }
      
      // If we have retries left, wait and retry
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  console.error("Final Gemini API Error:", lastError);
  // Enhance error message for the user
  const userMessage = lastError?.message?.includes("xhr") 
    ? "网络连接不稳定，请检查您的网络或代理设置后重试。" 
    : (lastError?.message || "生成失败，请重试。");
    
  throw new Error(userMessage);
};