import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'support.db');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      helpful_count INTEGER DEFAULT 0,
      not_helpful_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      priority TEXT DEFAULT 'Medium',
      resolution_notes TEXT,
      chat_transcript TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customer_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT,
      rating INTEGER NOT NULL,
      category TEXT,
      comment TEXT,
      tags TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default Admin if not exists
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE email = ?').get('admin@supportagent.io');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Admin@2026!', salt);
    db.prepare(`
      INSERT INTO admin_users (email, hashed_password, full_name, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin@supportagent.io', hash, 'Senior Support Lead', 'admin', new Date().toISOString());
  }

  // Seed default Customer if not exists
  const existingCustomer = db.prepare('SELECT id FROM customers WHERE email = ?').get('sarah.j@example.com');
  if (!existingCustomer) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Customer@2026!', salt);
    db.prepare(`
      INSERT INTO customers (name, email, hashed_password, phone, company, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Sarah Jenkins', 'sarah.j@example.com', hash, '+1 (555) 019-2834', 'Apex Global Inc', new Date().toISOString());
  }

  // Seed FAQs if empty
  const faqCount = db.prepare('SELECT count(*) as count FROM faqs').get() as { count: number };
  if (faqCount.count === 0) {
    const now = new Date().toISOString();
    const seedFaqs = [
      {
        category: 'Orders',
        question: 'How can I track my shipped order?',
        answer: 'You can track your order using the tracking number sent in your shipping confirmation email. Simply navigate to our Track Ticket page or click the link in your email to view real-time courier updates, estimated delivery time, and dispatch status.'
      },
      {
        category: 'Orders',
        question: 'Can I change my delivery address after placing an order?',
        answer: 'Delivery addresses can be updated within 60 minutes of placing an order, provided the fulfillment process has not begun. Reach out to our customer support or initiate an immediate chat to request an address update before dispatch.'
      },
      {
        category: 'Orders',
        question: 'What should I do if my package says delivered but I have not received it?',
        answer: 'Please check with neighbors, building reception, or safe drop locations. Couriers occasionally scan packages up to 24 hours in advance. If 24 hours have passed and you still cannot locate it, submit a support ticket under the Orders category and we will file a trace investigation.'
      },
      {
        category: 'Payments',
        question: 'Which payment methods and currencies are accepted?',
        answer: 'We accept Visa, MasterCard, American Express, PayPal, Apple Pay, Google Pay, and SEPA direct debit. Transactions are processed in USD, EUR, GBP, CAD, and AUD based on your billing region.'
      },
      {
        category: 'Payments',
        question: 'Why was my credit card transaction declined?',
        answer: 'Card declines are typically caused by insufficient funds, incorrect billing ZIP/postal code, 3D-Secure verification timeout, or anti-fraud cardholder security flags. We recommend contacting your issuing bank or trying an alternate payment method like PayPal.'
      },
      {
        category: 'Payments',
        question: 'How can I download VAT invoices and receipts?',
        answer: 'Official tax receipts and VAT-compliant invoices are emailed automatically upon successful checkout. You can also retrieve historical invoices by requesting a summary via our support chat with your registered billing email.'
      },
      {
        category: 'Refunds',
        question: 'What is your standard refund and return policy?',
        answer: 'We offer a 30-day satisfaction guarantee for eligible items in unused, original condition with packaging intact. Once your return is received and inspected at our fulfillment hub, refunds are issued to the original payment method within 3 to 5 business days.'
      },
      {
        category: 'Refunds',
        question: 'How long does it take for a refund to show on my bank statement?',
        answer: 'Credit card refunds typically appear on your statement within 3 to 7 business days, depending on your bank processing cycle. PayPal and store credit refunds are usually available within 24 hours.'
      },
      {
        category: 'Refunds',
        question: 'Do I have to pay for return shipping labels?',
        answer: 'Domestic returns for defective, damaged, or incorrectly shipped items receive complimentary prepaid shipping labels. For elective change-of-mind returns, a nominal return shipping fee ($5.99) is deducted from the final refund amount.'
      },
      {
        category: 'Account',
        question: 'How do I reset my account password?',
        answer: 'Click on the "Forgot Password" link on the account sign-in page. Enter your registered email address and you will receive a secure one-time reset link valid for 30 minutes.'
      },
      {
        category: 'Account',
        question: 'How do I enable Two-Factor Authentication (2FA)?',
        answer: 'Navigate to Account Settings > Security > Two-Factor Authentication. Scan the QR code using any standard authenticator app (Google Authenticator, Authy, or 1Password) and verify the 6-digit confirmation code.'
      },
      {
        category: 'Account',
        question: 'How do I permanently delete my account and personal data?',
        answer: 'Under GDPR and CCPA guidelines, you have the right to request full account erasure. Submit a ticket under the Account category with the subject "Data Erasure Request". Our privacy compliance officer will process your request within 7 business days.'
      },
      {
        category: 'Technical Issues',
        question: 'The portal is showing a blank page or 500 error. How can I resolve it?',
        answer: 'First perform a hard refresh (Ctrl + F5 on Windows/Linux or Cmd + Shift + R on Mac). Ensure browser extensions (like aggressive ad-blockers or privacy script blockers) are disabled for our domain, and clear your local cache.'
      },
      {
        category: 'Technical Issues',
        question: 'What browsers are officially supported?',
        answer: 'Our customer support platform officially supports latest versions of Google Chrome (v110+), Mozilla Firefox (v115+), Apple Safari (v16+), and Microsoft Edge (v110+). JavaScript and cookies must be enabled.'
      },
      {
        category: 'Technical Issues',
        question: 'Where can I find system status and API uptime details?',
        answer: 'Our infrastructure operates with 99.98% uptime SLA. Real-time system health, scheduled maintenance windows, and incident logs can be viewed directly through the Admin console or by querying our support chatbot.'
      }
    ];

    const insertFaq = db.prepare(`
      INSERT INTO faqs (category, question, answer, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const faq of seedFaqs) {
      insertFaq.run(faq.category, faq.question, faq.answer, now, now);
    }
  }

  // Seed sample initial tickets if empty for rich admin experience
  const ticketCount = db.prepare('SELECT count(*) as count FROM tickets').get() as { count: number };
  if (ticketCount.count === 0) {
    const now = new Date();
    const d1 = new Date(now.getTime() - 3600000 * 24 * 2).toISOString();
    const d2 = new Date(now.getTime() - 3600000 * 8).toISOString();
    const d3 = new Date(now.getTime() - 3600000 * 2).toISOString();

    const insertTicket = db.prepare(`
      INSERT INTO tickets (id, customer_name, customer_email, category, subject, description, status, priority, resolution_notes, created_at, updated_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTicket.run(
      'TK-2026-10492',
      'Sarah Jenkins',
      'sarah.j@example.com',
      'Orders',
      'Delayed delivery for order #ORD-88219',
      'My package was scheduled for delivery on Monday but the carrier tracking has remained in transit for 4 days with no new scan updates.',
      'In Progress',
      'High',
      'Carrier tracking inquiry initiated with FedEx priority desk. Awaiting scan report.',
      d1,
      d2,
      null
    );

    insertTicket.run(
      'TK-2026-10493',
      'Marcus Vance',
      'marcus.v@example.com',
      'Payments',
      'Double charge on invoice #INV-4902',
      'I checked my banking app and noticed two identical transactions of $149.00 billed 30 seconds apart.',
      'Resolved',
      'Urgent',
      'Verified duplicate charge caused by gateway retry. Duplicate authorization of $149.00 reversed immediately. Customer notified.',
      d1,
      d2,
      d2
    );

    insertTicket.run(
      'TK-2026-10494',
      'Elena Rostova',
      'elena.rostova@example.com',
      'Technical Issues',
      'Unable to download quarterly PDF statement',
      'When clicking export statement on the billing screen, the button stays in spinning state and returns an HTTP 504 Gateway Timeout error.',
      'Open',
      'Medium',
      null,
      d3,
      d3,
      null
    );

    // Add initial messages
    const insertMsg = db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender, sender_name, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertMsg.run('TK-2026-10492', 'customer', 'Sarah Jenkins', 'Hello, my package has been stuck at the regional distribution center for 4 days.', d1);
    insertMsg.run('TK-2026-10492', 'agent', 'Support Agent Alex', 'Hi Sarah, thank you for reaching out. We have opened a priority trace with FedEx and will update you within 4 hours.', d2);

    insertMsg.run('TK-2026-10493', 'customer', 'Marcus Vance', 'Please check invoice INV-4902, I see two identical charges on my Visa card.', d1);
    insertMsg.run('TK-2026-10493', 'agent', 'Billing Specialist Nora', 'Hi Marcus, the duplicate authorization has been cancelled. Funds should unlock in 1-2 business days depending on your bank.', d2);

    insertMsg.run('TK-2026-10494', 'customer', 'Elena Rostova', 'Clicking export statement keeps timing out with error 504.', d3);

    // Seed sample customer feedback
    const insertFeedback = db.prepare(`
      INSERT INTO customer_feedback (ticket_id, rating, category, comment, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertFeedback.run('TK-2026-10493', 5, 'Payments', 'Super fast response and my duplicate charge was cleared within an hour! Outstanding customer service.', JSON.stringify(['Fast Resolution', 'Knowledgeable Agent']), d2);
    insertFeedback.run(null, 5, 'Orders', 'The AI agent found my tracking answers immediately without waiting in a long phone queue.', JSON.stringify(['Accurate AI', 'Instant Answer']), d2);
    insertFeedback.run(null, 4, 'Refunds', 'Clear return steps provided. Very smooth experience overall.', JSON.stringify(['Helpful']), d3);
  }
}
