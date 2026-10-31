import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { TicketCategory, TicketPriority } from '../types';
import { createTicket } from '../services/api';

interface SubmitTicketPageProps {
  prefillData?: {
    subject?: string;
    description?: string;
    transcript?: any[];
  };
  customerDefault?: { name: string; email: string };
  onNavigateToTrack: (ticketId: string, email: string) => void;
  onNavigateToFaqs: () => void;
}

export const SubmitTicketPage: React.FC<SubmitTicketPageProps> = ({
  prefillData,
  customerDefault,
  onNavigateToTrack,
  onNavigateToFaqs,
}) => {
  const [name, setName] = useState(customerDefault?.name || '');
  const [email, setEmail] = useState(customerDefault?.email || '');
  const [category, setCategory] = useState<TicketCategory>('Orders');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [subject, setSubject] = useState(prefillData?.subject || '');
  const [description, setDescription] = useState(prefillData?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdTicket, setCreatedTicket] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const categories: TicketCategory[] = ['Orders', 'Payments', 'Refunds', 'Account', 'Technical Issues'];
  const priorities: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await createTicket({
        customer_name: name,
        customer_email: email,
        category,
        subject,
        description,
        priority,
        chat_transcript: prefillData?.transcript,
      });

      setCreatedTicket(res.ticket);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit ticket. Please verify inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!createdTicket) return;
    navigator.clipboard.writeText(createdTicket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
          <TicketIcon className="w-5 h-5" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Submit a Support Ticket
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Need personalized help from a human specialist? Fill in the details below and we will assign a dedicated support engineer.
        </p>
      </div>

      {prefillData?.transcript && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-800">
          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
          <span>Chat transcript context has been automatically attached to this ticket for seamless handoff.</span>
        </div>
      )}

      {/* Confirmation State */}
      {createdTicket ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Support Ticket Created Successfully!</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              We have dispatched confirmation to <span className="font-semibold text-slate-800">{createdTicket.customer_email}</span>. Please save your unique Ticket ID below for real-time tracking.
            </p>
          </div>

          {/* Ticket ID Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto flex items-center justify-between">
            <div className="text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Unique Ticket ID
              </span>
              <span className="text-lg font-mono font-bold text-blue-600 tabular-nums">
                {createdTicket.id}
              </span>
            </div>
            <button
              onClick={handleCopyId}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              title="Copy ID to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Details Pill Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-md mx-auto text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
              <span className="font-semibold text-slate-800">{createdTicket.status}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Priority</span>
              <span className="font-semibold text-slate-800">{createdTicket.priority}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
              <span className="font-semibold text-slate-800">{createdTicket.category}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">SLA Target</span>
              <span className="font-semibold text-emerald-600">&lt; 2 Hours</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTrack(createdTicket.id, createdTicket.customer_email)}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Track Ticket Progress Live</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCreatedTicket(null);
                setSubject('');
                setDescription('');
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Submit Another Ticket
            </button>
          </div>
        </div>
      ) : (
        /* Ticket Form */
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex.morgan@example.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400">Used for ticket status tracking and updates.</span>
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Urgency Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Ticket Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue (e.g. Order #8921 delayed delivery)"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide specifics: order numbers, error codes, steps taken, or dates..."
              className="w-full text-xs p-3.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onNavigateToFaqs}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Browse FAQs first
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Generating Ticket...</span>
              ) : (
                <>
                  <span>Submit Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
