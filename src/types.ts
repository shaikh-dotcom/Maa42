export type ScreenId =
  | "landing"
  | "home"
  | "sophia"
  | "tracker"
  | "circle"
  | "messages";

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
