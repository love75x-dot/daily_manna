export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MeditationContent {
  observation: string | null;
  interpretation: string | null;
  application: string | null;
}

export enum TabType {
  OBSERVATION = 'observation',
  INTERPRETATION = 'interpretation',
  APPLICATION = 'application',
}

export interface BibleData {
  reference: string;
  text: string;
}

export interface AppState {
  apiKey: string;
  showSettings: boolean;
  bibleInput: string;
  bibleData: BibleData | null;
  meditation: MeditationContent;
  activeTab: TabType;
  chatInput: string;
  chatHistory: ChatMessage[];
  isLoadingBible: boolean;
  isLoadingMeditation: boolean;
  isLoadingChat: boolean;
}