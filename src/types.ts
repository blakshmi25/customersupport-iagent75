export type TicketCategory = 'Orders' | 'Payments' | 'Refunds' | 'Account' | 'Technical Issues';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface FAQ {
  id: number;
  category: TicketCategory;
  question: string;
  answer: string;
  helpful_count: number;
  not_helpful_count: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: string;
  sender: 'customer' | 'agent' | 'system';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  customer_name: string;
  customer_email: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolution_notes?: string | null;
  chat_transcript?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface CustomerFeedback {
  id: number;
  ticket_id?: string | null;
  rating: number; // 1 to 5
  category?: string;
  comment?: string | null;
  tags?: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: 'ai' | 'faq_fallback';
  confidence?: number;
  matchedFaqs?: Array<{
    id: number;
    category: string;
    question: string;
    answer: string;
  }>;
  canEscalate?: boolean;
  suggestedQuestions?: string[];
}

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  token?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  token?: string;
}

export interface AdminStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgCsat: number;
  feedbackCount: number;
  categoryStats: Array<{ category: string; count: number }>;
  recentFeedback: CustomerFeedback[];
}
