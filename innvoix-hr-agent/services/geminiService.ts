
import { GoogleGenAI } from "@google/genai";
import { Employee, LeaveRequest } from "../types";

const HR_SYSTEM_INSTRUCTION = `
You are the Innvoix HR Agent. You assist HR Managers with workforce data.
Context:
- Total Employees: 154
- On Leave Today: 8 (John Doe, Sarah Smith, Michael Chen, etc.)
- New Hires this month: 12
- Recruiting Pipeline: 45 candidates
- Next Payroll: 30th of the month.
Respond professionally and helpfully. Keep answers concise.
`;

const EMPLOYEE_SYSTEM_INSTRUCTION = `
You are the Innvoix Employee Assistant. You help employees with personal HR queries.
Policy Info:
- Casual Leave: 12 days/year
- Sick Leave: 10 days/year
- Privilege Leave: 15 days/year
- Standard work hours: 9 AM - 6 PM
- Remote work allowed twice a week with manager approval.
Respond in a friendly, supportive tone.
`;

export const getGeminiResponse = async (prompt: string, role: 'HR' | 'EMPLOYEE'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: role === 'HR' ? HR_SYSTEM_INSTRUCTION : EMPLOYEE_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return response.text || "I'm sorry, I couldn't process that request right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI agent is currently offline. Please try again later.";
  }
};
