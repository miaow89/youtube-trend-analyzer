
import { GoogleGenAI, Type } from "@google/genai";
import { YouTubeVideo, TrendAnalysis } from "../types";

export const analyzeYouTubeTrends = async (videos: YouTubeVideo[]): Promise<TrendAnalysis> => {
  // Fix: Always use process.env.API_KEY directly for client initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const videoDataText = videos.map(v => ({
    title: v.snippet.title,
    channel: v.snippet.channelTitle,
    views: v.statistics.viewCount,
    tags: v.snippet.tags?.join(', '),
    description: v.snippet.description.slice(0, 100) + '...'
  }));

  const prompt = `Analyze the following trending YouTube videos and provide insights into current trends. 
  Focus on content styles, recurring topics, emotional triggers, and why these are currently popular.
  
  Data: ${JSON.stringify(videoDataText)}`;

  // Fix: Use gemini-3-pro-preview for complex reasoning and analysis tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'Overall summary of the trends.' },
          keyThemes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                theme: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ['theme', 'explanation']
            }
          },
          audienceInsights: { type: Type.STRING, description: 'What this says about current audience behavior.' },
          prediction: { type: Type.STRING, description: 'What trends might emerge next.' }
        },
        required: ['summary', 'keyThemes', 'audienceInsights', 'prediction']
      }
    }
  });

  // Handle cases where response.text might be undefined to satisfy TypeScript strict null checks
  const text = response.text;
  if (!text) {
    throw new Error('AI 분석 결과를 생성하는 데 실패했습니다. (응답 텍스트 없음)');
  }

  try {
    return JSON.parse(text.trim()) as TrendAnalysis;
  } catch (e) {
    throw new Error('AI 응답을 파싱하는 중 오류가 발생했습니다.');
  }
};
