export type ScreenId =
  | "landing"
  | "home"
  | "sophia"
  | "tracker"
  | "circle"
  | "messages"
  | "bot";

export interface ChatMessage {
  id: string;
  sender: "user" | "sophia";
  text: string;
  timestamp: string;
  triage?: {
    status: string;
    description: string;
    level: "low" | "moderate" | "high";
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
  // Short shareable ID (e.g. "MAA-4F82"), separate from the Firebase uid.
  // Optional so older profiles created before this feature don't break.
  maa42Id?: string;
}

// ---------------------------------------------------------------------------
// Friends / Messaging / Notifications
// ---------------------------------------------------------------------------

// Minimal, non-sensitive doc stored at publicProfiles/{uid} so other users
// can find this person by name or maa42Id. Never put health data here.
export interface PublicProfile {
  uid: string;
  name: string;
  nameLower: string;
  // Lowercased words in `name`, used so a search matches any word (e.g. a
  // last name), not just a prefix of the full name. Optional so profiles
  // created before this field existed still type-check.
  nameTokens?: string[];
  maa42Id: string;
  maa42IdLower: string;
}

export type FriendRequestStatus = "pending";

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromName: string;
  toName: string;
  status: FriendRequestStatus;
  createdAt: any;
}

export interface ConversationLastMessage {
  id: string;
  text: string;
  senderId: string;
  deleted?: boolean;
}

export interface Conversation {
  participants: [string, string];
  participantNames?: Record<string, string>;
  lastMessage: ConversationLastMessage | null;
  updatedAt: any;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  deletedForEveryone?: boolean;
}

export type NotificationType = "friend_request" | "friend_accept" | "message";

export interface AppNotification {
  id: string;
  type: NotificationType;
  fromUid: string;
  fromName: string;
  conversationId?: string;
  requestId?: string;
  preview?: string;
  read: boolean;
  createdAt: any;
}

// ---------------------------------------------------------------------------
// MaterniBot device dashboard
// ---------------------------------------------------------------------------
// Shapes returned by the /api/bot/* proxy routes in server.ts, which mirror
// what the MaterniBot FastAPI backend returns.

export interface BotProfile {
  due_date: string | null;
  preferred_lang: string;
  pregnancy_week: number;
}

export interface BotSensorReading {
  timestamp: string;
  heart_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  humidity: number | null;
}

// "medicine" has medicine_name/dose/frequency filled in; the rest
// ("water" | "vitamin" | "appointment" | "general") only use message.
export interface BotReminder {
  id: number;
  category:
    | "medicine"
    | "water"
    | "vitamin"
    | "appointment"
    | "general"
    | string;
  message: string;
  medicine_name?: string | null;
  dose?: string | null;
  frequency?: string | null;
  next_due: string | null;
  interval_minutes?: number | null;
  source?: string;
}

export interface BotSymptomEntry {
  id: number;
  timestamp: string;
  symptom_text: string;
  severity?: string | null;
  red_flag: boolean;
}

// ---------------------------------------------------------------------------
// Care Circle — manually logged vitals (BP/weight aren't tracked by
// MaterniBot's sensors or anywhere else yet, so these come from a form).
// ---------------------------------------------------------------------------

export interface VitalsEntry {
  id: string;
  bp: string;
  weightChange: string;
  symptoms: string;
  loggedAt: any;
}
