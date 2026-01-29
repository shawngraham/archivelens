
import { GoogleGenAI, Type } from "@google/genai";
import { DataRecord } from "../types";

// Always initialize the client with named parameters and use process.env.API_KEY.
export const getVectorProvocations = async (data: DataRecord[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataSummary = JSON.stringify(data.slice(0, 20)); // Limit to keep context manageable
  
  const prompt = `
    You are a 'Vector Space Provocator' for humanities researchers. 
    Analyze the following heritage dataset fragment: ${dataSummary}
    
    CRITICAL RULES:
    1. DO NOT SUMMARIZE the data.
    2. Identify HOLES: What stories are conspicuously missing? Whose voices are silenced?
    3. Identify ELISIONS: What categories seem too neat or glossed over?
    4. Identify SURPRISES: What statistical or narrative outliers defy the expected pattern of this historical context?
    5. Frame your response as a series of intellectual provocations meant to spur further research.
    
    Return the response strictly as a JSON list of objects with the following schema:
    [{ "type": "silence" | "surprise" | "contradiction" | "elision", "observation": string, "context": string }]
  `;

  try {
    // Basic text tasks like provocation generation use gemini-3-flash-preview.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              observation: { type: Type.STRING },
              context: { type: Type.STRING }
            },
            required: ['type', 'observation', 'context'],
            propertyOrdering: ["type", "observation", "context"]
          }
        }
      }
    });

    // Access .text property directly as it is a getter.
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Vector Provocator Error:", error);
    return [{
      type: 'surprise',
      observation: "The vector space is momentarily obscured.",
      context: "Ensure the Gemini API environment is correctly configured to receive provocations."
    }];
  }
};
