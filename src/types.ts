export interface Archetype {
  name: string;
  explanation: string;
}

export interface DreamSymbol {
  name: string;
  meaning: string;
}

export interface DreamAnalysis {
  title: string;
  emotionalTheme: string;
  analysis: string;
  archetypes: Archetype[];
  symbols: DreamSymbol[];
  reflectionQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

export interface Dream {
  id: string;
  date: string;
  title: string;
  transcription: string;
  imageUrl: string;
  imageSize: "1K" | "2K" | "4K";
  imageAspectRatio: "1:1" | "16:9" | "4:3" | "3:4";
  analysis: DreamAnalysis | null;
  chatHistory: ChatMessage[];
  isTranscribing?: boolean;
  isAnalyzing?: boolean;
  isGeneratingImage?: boolean;
  error?: string;
}
