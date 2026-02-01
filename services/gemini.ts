
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const chatWithPastorAI = async (message: string, history: { role: 'user' | 'model', parts: [{ text: string }] }[]) => {
  const model = 'gemini-3-pro-preview';
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: 'You are an AI assistant for a Pastor. You help with pastoral care advice, sermon ideas, and member management tips. Be empathetic, wise, and helpful.',
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const findNearbyServices = async (lat: number, lng: number, query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find ${query} nearby for a pastoral visit.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Maps grounding error:", error);
    throw error;
  }
};
