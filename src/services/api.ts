import { FAQ, Ticket, TicketMessage, CustomerFeedback, AdminUser, AdminStats, CustomerUser } from '../types';

const API_BASE = '/api';

export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to get response from AI agent');
  }
  return res.json();
}

export async function fetchFaqs(category?: string, search?: string): Promise<FAQ[]> {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (search && search.trim()) params.append('search', search.trim());

  const res = await fetch(`${API_BASE}/faqs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch FAQs');
  return res.json();
}

export async function submitFaqFeedback(faqId: number, helpful: boolean) {
  const res = await fetch(`${API_BASE}/faqs/${faqId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ helpful }),
  });
  if (!res.ok) throw new Error('Failed to submit FAQ feedback');
  return res.json();
}

export async function createTicket(data: {
  customer_name: string;
  customer_email: string;
  category: string;
  subject: string;
  description: string;
  priority?: string;
  chat_transcript?: any;
}) {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit ticket');
  }
  return res.json();
}

export async function trackTicket(ticketId: string, email: string): Promise<{ ticket: Ticket; messages: TicketMessage[] }> {
  const params = new URLSearchParams({
    ticket_id: ticketId.trim(),
    email: email.trim(),
  });
  const res = await fetch(`${API_BASE}/tickets/track?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Could not find ticket with matching ID and email');
  }
  return res.json();
}

export async function appendTicketMessage(ticketId: string, message: string, senderName: string = 'Customer') {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'customer', sender_name: senderName, message }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function submitFeedback(data: {
  rating: number;
  ticket_id?: string;
  category?: string;
  comment?: string;
  tags?: string[];
}) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
}

// Customer Authentication APIs
export async function customerSignUp(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
}): Promise<{ token: string; customer: CustomerUser }> {
  const res = await fetch(`${API_BASE}/customer/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Customer registration failed');
  }
  return res.json();
}

export async function customerLogin(email: string, password: string): Promise<{ token: string; customer: CustomerUser }> {
  const res = await fetch(`${API_BASE}/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid email or password');
  }
  return res.json();
}

export async function fetchCustomerMe(token: string): Promise<{ customer: CustomerUser }> {
  const res = await fetch(`${API_BASE}/customer/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch customer profile');
  return res.json();
}

export async function fetchCustomerTickets(token: string): Promise<Ticket[]> {
  const res = await fetch(`${API_BASE}/customer/tickets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch customer tickets');
  return res.json();
}

// Admin APIs
export async function adminSignUp(data: {
  email: string;
  password: string;
  full_name: string;
  invite_code?: string;
}): Promise<{ token: string; user: AdminUser }> {
  const res = await fetch(`${API_BASE}/admin/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Admin registration failed');
  }
  return res.json();
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid admin credentials');
  }
  return res.json();
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
}

export async function fetchAdminTickets(
  token: string,
  filters: { status?: string; category?: string; search?: string } = {}
): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  if (filters.category && filters.category !== 'All') params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);

  const res = await fetch(`${API_BASE}/admin/tickets?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function fetchAdminTicketDetail(token: string, ticketId: string): Promise<{ ticket: Ticket; messages: TicketMessage[] }> {
  const res = await fetch(`${API_BASE}/admin/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load ticket details');
  return res.json();
}

export async function updateAdminTicket(
  token: string,
  ticketId: string,
  updates: { status?: string; priority?: string; resolution_notes?: string }
) {
  const res = await fetch(`${API_BASE}/admin/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update ticket');
  return res.json();
}

export async function replyAdminTicket(token: string, ticketId: string, message: string, newStatus?: string) {
  const res = await fetch(`${API_BASE}/admin/tickets/${ticketId}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, new_status: newStatus }),
  });
  if (!res.ok) throw new Error('Failed to send admin reply');
  return res.json();
}

export async function fetchAdminFaqs(token: string): Promise<FAQ[]> {
  const res = await fetch(`${API_BASE}/admin/faqs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch FAQs');
  return res.json();
}

export async function createAdminFaq(token: string, faq: { category: string; question: string; answer: string; is_active?: number }) {
  const res = await fetch(`${API_BASE}/admin/faqs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(faq),
  });
  if (!res.ok) throw new Error('Failed to create FAQ');
  return res.json();
}

export async function updateAdminFaq(token: string, faqId: number, faq: Partial<FAQ>) {
  const res = await fetch(`${API_BASE}/admin/faqs/${faqId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(faq),
  });
  if (!res.ok) throw new Error('Failed to update FAQ');
  return res.json();
}

export async function deleteAdminFaq(token: string, faqId: number) {
  const res = await fetch(`${API_BASE}/admin/faqs/${faqId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete FAQ');
  return res.json();
}

export async function fetchAdminFeedback(token: string): Promise<CustomerFeedback[]> {
  const res = await fetch(`${API_BASE}/admin/feedback`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch feedback');
  return res.json();
}
