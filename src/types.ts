export type ScreenId = 'landing' | 'home' | 'sophia' | 'tracker' | 'circle';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'sophia';
  text: string;
  timestamp: string;
  triage?: {
    status: string;
    description: string;
    level: 'low' | 'moderate' | 'high';
  };
  steps?: string[];
  suggestedAction?: string;
}

export interface CareMember {
  id: string;
  name: string;
  role: string;
  facility: string;
  nextAppointment?: string;
  badge: string;
  avatar: string;
  status: string;
  canCall?: boolean;
  canMessage?: boolean;
}

export interface AudioTrack {
  id: string;
  title: string;
  category: string;
  duration: string;
  speaker: string;
  description: string;
  colorClass: string;
  frequency: number;
}

export interface ArticleItem {
  id: string;
  category: string;
  title: string;
  snippet: string;
  fullContent: string;
  readTime: string;
  imageUrl: string;
  alt: string;
}

export interface UserProfile {
  name: string;
  week: number;
  trimester: number;
  postpartumDay: number;
  dueDate: string;
  isPostpartum: boolean;
}
