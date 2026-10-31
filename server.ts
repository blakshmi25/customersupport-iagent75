import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, initDatabase } from './src/server/db.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'customer-support-agent-jwt-secret-key-2026';

// Initialize SQLite database
initDatabase();

app.use(express.json());

// Server-side Gemini AI Client
const rawKey = process.env.GEMINI_API_KEY;
const isRealKey = Boolean(rawKey && !rawKey.includes('MY_GEMINI') && rawKey.trim().length > 10);
const geminiApiKey = isRealKey ? rawKey : undefined;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize Gemini AI client:', err);
  }
}

// Authentication Middleware for Admin routes
interface AuthRequest extends Request {
  adminUser?: { id: number; email: string; role: string };
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
    req.adminUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

interface CustomerAuthRequest extends Request {
  customer?: { id: number; email: string; name: string };
}

function requireCustomer(req: CustomerAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid customer token' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };
    req.customer = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired customer token' });
  }
}

// ---------------------------------------------------------------------------
// 1. CHATBOT ENDPOINT (Intelligent grounding & FAQ search)
// ---------------------------------------------------------------------------
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'User message is required.' });
    }

    const query = message.trim();
    const queryLower = query.toLowerCase();

    // 1. Search knowledge base in SQLite for relevant FAQs
    const words = queryLower
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(' ')
      .filter((w) => w.length > 2);

    let matchingFaqs: Array<{ id: number; category: string; question: string; answer: string; score: number }> = [];

    const allFaqs = db.prepare('SELECT id, category, question, answer FROM faqs WHERE is_active = 1').all() as Array<{
      id: number;
      category: string;
      question: string;
      answer: string;
    }>;

    for (const faq of allFaqs) {
      let score = 0;
      const qLower = faq.question.toLowerCase();
      const aLower = faq.answer.toLowerCase();
      const cLower = faq.category.toLowerCase();

      if (queryLower.includes(cLower)) score += 3;
      if (qLower.includes(queryLower) || queryLower.includes(qLower)) score += 10;

      for (const w of words) {
        if (qLower.includes(w)) score += 3;
        if (aLower.includes(w)) score += 1;
      }

      if (score > 0) {
        matchingFaqs.push({ ...faq, score });
      }
    }

    matchingFaqs.sort((a, b) => b.score - a.score);
    const topFaqs = matchingFaqs.slice(0, 4);

    // Predefined dynamic suggestions
    const defaultSuggestions = [
      'How can I track my shipped order?',
      'What is your 30-day refund policy?',
      'Why was my credit card declined?',
      'How do I enable Two-Factor Authentication?',
    ];

    // If Gemini AI is available, generate grounded response
    if (aiClient && geminiApiKey) {
      try {
        const knowledgeSnippets = topFaqs.length > 0
          ? topFaqs.map((f) => `[Category: ${f.category}] Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
          : 'No directly matching FAQ found.';

        const conversationContext = (history as Array<{ role: string; content: string }>)
          .slice(-4)
          .map((h) => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.content}`)
          .join('\n');

        const systemPrompt = `You are the Customer Support Intelligent Agent for our customer service system.
You provide accurate, friendly, concise, and helpful support to customers.

STRICT GROUNDING & ACCURACY RULES:
1. Base your knowledge strictly on our official knowledge base:
${knowledgeSnippets}
2. NEVER invent fake order IDs, carrier tracking numbers, refund transaction codes, or sensitive account changes.
3. If the knowledge base does not cover the question, or if the customer expresses frustration, urgent account issues, or asks to speak with a human agent, clearly recommend opening a support ticket so our support team can take action.
4. Keep responses structured, concise, and polite. Use bullet points for step-by-step guidance.
5. If you advise opening a ticket, reassure them that our human support team responds promptly.`;

        const callPromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${conversationContext ? `Recent conversation:\n${conversationContext}\n\n` : ''}Customer Question: ${query}`,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timeout')), 4000)
        );

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        const replyText = response.text || "I'm here to help. Could you provide a bit more detail regarding your request?";

        return res.json({
          message: replyText,
          mode: 'ai',
          confidence: topFaqs.length > 0 ? 0.94 : 0.75,
          matchedFaqs: topFaqs.map(({ id, category, question, answer }) => ({ id, category, question, answer })),
          canEscalate: true,
          suggestedQuestions: defaultSuggestions,
        });
      } catch (aiErr) {
        console.warn('Gemini AI call failed, falling back to FAQ engine:', aiErr);
      }
    }

    // FAQ-based Fallback / Demo Mode
    if (topFaqs.length > 0 && topFaqs[0].score >= 3) {
      const best = topFaqs[0];
      const relatedNotice = topFaqs.length > 1
        ? `\n\nRelated topics you might find helpful:\n` + topFaqs.slice(1, 3).map((f) => `• ${f.question}`).join('\n')
        : '';

      return res.json({
        message: `${best.answer}${relatedNotice}\n\nIf you need individualized assistance or your issue requires account modification, click "Create Support Ticket" below and our human support team will resolve it for you.`,
        mode: 'faq_fallback',
        confidence: 0.88,
        matchedFaqs: topFaqs.map(({ id, category, question, answer }) => ({ id, category, question, answer })),
        canEscalate: true,
        suggestedQuestions: defaultSuggestions,
      });
    }

    // Generic fallback if no FAQ match
    return res.json({
      message: `I searched our knowledge base, but couldn't find a direct match for "${query}".\n\nWould you like me to open a support ticket for our specialist team? You can also browse our FAQs or rephrase your question.`,
      mode: 'faq_fallback',
      confidence: 0.35,
      matchedFaqs: [],
      canEscalate: true,
      suggestedQuestions: defaultSuggestions,
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'An unexpected error occurred while processing your message. Please try again or create a support ticket.',
    });
  }
});

// ---------------------------------------------------------------------------
// 2. FAQs ENDPOINTS
// ---------------------------------------------------------------------------
app.get('/api/faqs', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM faqs WHERE is_active = 1';
    const params: any[] = [];

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search && typeof search === 'string' && search.trim()) {
      sql += ' AND (question LIKE ? OR answer LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY category ASC, id ASC';
    const faqs = db.prepare(sql).all(...params);
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve FAQs' });
  }
});

app.post('/api/faqs/:id/feedback', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;

    if (helpful) {
      db.prepare('UPDATE faqs SET helpful_count = helpful_count + 1 WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE faqs SET not_helpful_count = not_helpful_count + 1 WHERE id = ?').run(id);
    }

    const updated = db.prepare('SELECT id, helpful_count, not_helpful_count FROM faqs WHERE id = ?').get(id);
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record FAQ feedback' });
  }
});

// ---------------------------------------------------------------------------
// 3. SUPPORT TICKETS ENDPOINTS
// ---------------------------------------------------------------------------
app.post('/api/tickets', (req: Request, res: Response) => {
  try {
    const { customer_name, customer_email, category, subject, description, priority = 'Medium', chat_transcript } = req.body;

    if (!customer_name || !customer_email || !category || !subject || !description) {
      return res.status(400).json({ error: 'All fields (name, email, category, subject, description) are required.' });
    }

    // Generate unique Ticket ID e.g. TK-2026-78419
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const ticketId = `TK-2026-${randomSuffix}`;
    const now = new Date().toISOString();

    const insertTicket = db.prepare(`
      INSERT INTO tickets (id, customer_name, customer_email, category, subject, description, status, priority, chat_transcript, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTicket.run(
      ticketId,
      customer_name.trim(),
      customer_email.trim().toLowerCase(),
      category,
      subject.trim(),
      description.trim(),
      'Open',
      priority,
      chat_transcript ? JSON.stringify(chat_transcript) : null,
      now,
      now
    );

    // Initial message
    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender, sender_name, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(ticketId, 'customer', customer_name.trim(), description.trim(), now);

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ error: 'Failed to create support ticket.' });
  }
});

app.get('/api/tickets/track', (req: Request, res: Response) => {
  try {
    const { ticket_id, email } = req.query;
    if (!ticket_id || !email) {
      return res.status(400).json({ error: 'Both ticket ID and registered email are required for verification.' });
    }

    const ticket = db.prepare(`
      SELECT * FROM tickets 
      WHERE UPPER(id) = UPPER(?) AND LOWER(customer_email) = LOWER(?)
    `).get(String(ticket_id).trim(), String(email).trim()) as any;

    if (!ticket) {
      return res.status(404).json({ error: 'No ticket found matching the provided Ticket ID and Email address.' });
    }

    const messages = db.prepare(`
      SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id ASC
    `).all(ticket.id);

    res.json({ ticket, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to track ticket' });
  }
});

app.post('/api/tickets/:id/messages', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sender, sender_name, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender, sender_name, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, sender || 'customer', sender_name || 'Customer', message.trim(), now);

    db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(now, id);

    const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id ASC').all(id);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to append message to ticket' });
  }
});

// ---------------------------------------------------------------------------
// 4. CUSTOMER SATISFACTION FEEDBACK
// ---------------------------------------------------------------------------
app.post('/api/feedback', (req: Request, res: Response) => {
  try {
    const { rating, ticket_id, category, comment, tags } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO customer_feedback (ticket_id, rating, category, comment, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      ticket_id || null,
      rating,
      category || 'General',
      comment ? comment.trim() : null,
      tags ? JSON.stringify(tags) : '[]',
      now
    );

    res.json({ success: true, message: 'Thank you for your valuable feedback!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// ---------------------------------------------------------------------------
// 5. ADMIN AUTHENTICATION & MANAGEMENT
// ---------------------------------------------------------------------------
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email.trim().toLowerCase()) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.hashed_password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// Admin Signup (Allows creating new support specialists / admins)
app.post('/api/admin/signup', (req: Request, res: Response) => {
  try {
    const { email, password, full_name, invite_code } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Optional invite code validation for staff security
    if (invite_code && invite_code.trim() !== 'SUPPORT2026' && invite_code.trim() !== 'ADMIN2026') {
      return res.status(400).json({ error: 'Invalid staff invite code. Use SUPPORT2026 or leave blank for demo.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An admin account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO admin_users (email, hashed_password, full_name, role, created_at)
      VALUES (?, ?, ?, 'admin', ?)
    `).run(cleanEmail, hash, full_name.trim(), now);

    const token = jwt.sign(
      { id: result.lastInsertRowid, email: cleanEmail, role: 'admin', name: full_name.trim() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        email: cleanEmail,
        full_name: full_name.trim(),
        role: 'admin',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Staff registration failed.' });
  }
});

// ---------------------------------------------------------------------------
// 5B. CUSTOMER AUTHENTICATION & PORTAL ENDPOINTS
// ---------------------------------------------------------------------------
app.post('/api/customer/signup', (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM customers WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO customers (name, email, hashed_password, phone, company, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), cleanEmail, hash, phone ? phone.trim() : null, company ? company.trim() : null, now);

    const customerId = result.lastInsertRowid;
    const token = jwt.sign(
      { id: customerId, email: cleanEmail, name: name.trim() },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      customer: {
        id: customerId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone || null,
        company: company || null,
      },
    });
  } catch (err) {
    console.error('Customer signup error:', err);
    res.status(500).json({ error: 'Failed to create customer account.' });
  }
});

app.post('/api/customer/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(cleanEmail) as any;
    if (!customer) {
      return res.status(401).json({ error: 'No customer account found with this email. Please check your spelling or sign up.' });
    }

    const isValid = bcrypt.compareSync(password, customer.hashed_password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, name: customer.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Customer login failed.' });
  }
});

app.get('/api/customer/me', requireCustomer, (req: CustomerAuthRequest, res: Response) => {
  try {
    const customer = db.prepare('SELECT id, name, email, phone, company, created_at FROM customers WHERE id = ?').get(req.customer!.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

app.get('/api/customer/tickets', requireCustomer, (req: CustomerAuthRequest, res: Response) => {
  try {
    const tickets = db.prepare(`
      SELECT * FROM tickets 
      WHERE LOWER(customer_email) = LOWER(?) 
      ORDER BY created_at DESC
    `).all(req.customer!.email);

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer tickets' });
  }
});

app.get('/api/admin/stats', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const totalTickets = (db.prepare('SELECT COUNT(*) as c FROM tickets').get() as any).c;
    const openTickets = (db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'Open'").get() as any).c;
    const inProgressTickets = (db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'In Progress'").get() as any).c;
    const resolvedTickets = (db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'Resolved'").get() as any).c;

    const feedbackStats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM customer_feedback').get() as any;
    const avgCsat = feedbackStats.avg_rating ? Number(feedbackStats.avg_rating.toFixed(1)) : 5.0;

    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM tickets 
      GROUP BY category
    `).all();

    const recentFeedback = db.prepare(`
      SELECT * FROM customer_feedback ORDER BY id DESC LIMIT 5
    `).all();

    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgCsat,
      feedbackCount: feedbackStats.count,
      categoryStats,
      recentFeedback,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin stats' });
  }
});

app.get('/api/admin/tickets', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { status, category, search } = req.query;
    let sql = 'SELECT * FROM tickets WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search && typeof search === 'string' && search.trim()) {
      sql += ' AND (id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR subject LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC';
    const tickets = db.prepare(sql).all(...params);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

app.get('/api/admin/tickets/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id ASC').all(id);
    res.json({ ticket, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve ticket details' });
  }
});

app.patch('/api/admin/tickets/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, resolution_notes } = req.body;

    const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    let resolvedAt = existing.resolved_at;
    if (status === 'Resolved' && existing.status !== 'Resolved') {
      resolvedAt = now;
    } else if (status !== 'Resolved') {
      resolvedAt = null;
    }

    db.prepare(`
      UPDATE tickets 
      SET status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          resolution_notes = COALESCE(?, resolution_notes),
          resolved_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(status || null, priority || null, resolution_notes !== undefined ? resolution_notes : null, resolvedAt, now, id);

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json({ success: true, ticket: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

app.post('/api/admin/tickets/:id/reply', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message, new_status } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Reply message cannot be empty.' });
    }

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    const adminName = (req.adminUser && (req.adminUser as any).name) || 'Support Specialist';

    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender, sender_name, message, created_at)
      VALUES (?, 'agent', ?, ?, ?)
    `).run(id, adminName, message.trim(), now);

    let resolvedAt = ticket.resolved_at;
    const nextStatus = new_status || (ticket.status === 'Open' ? 'In Progress' : ticket.status);
    if (nextStatus === 'Resolved') {
      resolvedAt = now;
    }

    db.prepare('UPDATE tickets SET status = ?, resolved_at = ?, updated_at = ? WHERE id = ?')
      .run(nextStatus, resolvedAt, now, id);

    const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id ASC').all(id);
    const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

    res.json({ success: true, ticket: updatedTicket, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post admin reply' });
  }
});

// Admin FAQ CRUD
app.get('/api/admin/faqs', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const faqs = db.prepare('SELECT * FROM faqs ORDER BY id DESC').all();
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

app.post('/api/admin/faqs', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { category, question, answer, is_active = 1 } = req.body;
    if (!category || !question || !answer) {
      return res.status(400).json({ error: 'Category, question, and answer are required.' });
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO faqs (category, question, answer, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(category, question.trim(), answer.trim(), is_active ? 1 : 0, now, now);

    const created = db.prepare('SELECT * FROM faqs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

app.put('/api/admin/faqs/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { category, question, answer, is_active } = req.body;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE faqs 
      SET category = COALESCE(?, category),
          question = COALESCE(?, question),
          answer = COALESCE(?, answer),
          is_active = COALESCE(?, is_active),
          updated_at = ?
      WHERE id = ?
    `).run(category || null, question ? question.trim() : null, answer ? answer.trim() : null, is_active !== undefined ? (is_active ? 1 : 0) : null, now, id);

    const updated = db.prepare('SELECT * FROM faqs WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

app.delete('/api/admin/faqs/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// Admin Feedback List
app.get('/api/admin/feedback', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const feedback = db.prepare('SELECT * FROM customer_feedback ORDER BY id DESC LIMIT 50').all();
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve feedback' });
  }
});

// ---------------------------------------------------------------------------
// 6. OPENAPI SPEC & SWAGGER UI DOCUMENTATION
// ---------------------------------------------------------------------------
const openApiSchema = {
  openapi: '3.0.3',
  info: {
    title: 'Customer Support Intelligent Agent API',
    description: 'FastAPI / Express REST API for Customer Support Intelligent Agent — AI-Powered Customer Service System',
    version: '1.0.0',
    contact: {
      name: 'OmniSupport Engineering',
      email: 'support@supportagent.io',
    },
  },
  servers: [{ url: '/api', description: 'Application API Base' }],
  paths: {
    '/chat': {
      post: {
        summary: 'Send inquiry to AI Chatbot with Knowledge Base grounding',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'What is your 30-day refund policy?' },
                  history: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['user', 'assistant'] },
                        content: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Grounded response with matched FAQs and escalation status' },
        },
      },
    },
    '/faqs': {
      get: {
        summary: 'List active FAQs with category and keyword search',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', example: 'Orders' } },
          { name: 'search', in: 'query', schema: { type: 'string', example: 'tracking' } },
        ],
        responses: { '200': { description: 'Array of FAQ items' } },
      },
    },
    '/tickets': {
      post: {
        summary: 'Create a new support ticket',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customer_name', 'customer_email', 'category', 'subject', 'description'],
                properties: {
                  customer_name: { type: 'string' },
                  customer_email: { type: 'string' },
                  category: { type: 'string' },
                  subject: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Ticket created with unique tracking ID' } },
      },
    },
    '/tickets/track': {
      get: {
        summary: 'Track ticket status by Ticket ID and Email verification',
        parameters: [
          { name: 'ticket_id', in: 'query', required: true, schema: { type: 'string', example: 'TK-2026-10492' } },
          { name: 'email', in: 'query', required: true, schema: { type: 'string', example: 'sarah.j@example.com' } },
        ],
        responses: { '200': { description: 'Ticket and communication history' } },
      },
    },
    '/feedback': {
      post: {
        summary: 'Submit customer satisfaction rating and review',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating'],
                properties: {
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  ticket_id: { type: 'string' },
                  category: { type: 'string' },
                  comment: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Feedback logged' } },
      },
    },
    '/admin/login': {
      post: {
        summary: 'Admin authentication to receive JWT bearer token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@supportagent.io' },
                  password: { type: 'string', example: 'Admin@2026!' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'JWT Token and Admin Profile' } },
      },
    },
  },
};

app.get('/api/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSchema);
});

// Swagger UI HTML Endpoint at /docs and /api/docs
const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Customer Support Intelligent Agent — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { display: none !important; }
    .custom-header {
      background: #0f172a;
      color: white;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1e293b;
    }
    .custom-header a {
      color: #93c5fd;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: 6px;
      background: #1e293b;
    }
    .custom-header a:hover {
      background: #334155;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <div style="font-weight: 600; font-size: 18px; display: flex; align-items: center; gap: 10px;">
      <span>⚡ Customer Support Intelligent Agent — REST API & Swagger UI</span>
    </div>
    <a href="/">← Return to Web Application</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
`;

app.get('/docs', (_req: Request, res: Response) => {
  res.type('html').send(swaggerHtml);
});
app.get('/api/docs', (_req: Request, res: Response) => {
  res.type('html').send(swaggerHtml);
});

// ---------------------------------------------------------------------------
// 7. DEV & PROD CLIENT MOUNTING
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // If in development, mount Vite dev server middlewares
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
