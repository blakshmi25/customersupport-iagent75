import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  MessageSquare,
  ShieldCheck,
  Star,
  RefreshCw,
  User,
  Headphones
} from 'lucide-react';
import { Ticket, TicketMessage } from '../types';
import { trackTicket, appendTicketMessage } from '../services/api';

interface TrackTicketPageProps {
  initialTicketId?: string;
  initialEmail?: string;
  onOpenFeedback: (ticketId?: string, category?: string) => void;
}

export const TrackTicketPage: React.FC<TrackTicketPageProps> = ({
  initialTicketId = '',
  initialEmail = '',
  onOpenFeedback,
}) => {
  const [ticketId, setTicketId] = useState(initialTicketId);
  const [email, setEmail] = useState(initialEmail);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    if (initialTicketId && initialEmail) {
      handleTrack(initialTicketId, initialEmail);
    }
  }, [initialTicketId, initialEmail]);

  const handleTrack = async (idToUse?: string, emailToUse?: string) => {
    const id = idToUse || ticketId;
    const em = emailToUse || email;

    if (!id.trim() || !em.trim()) {
      setErrorMessage('Please enter both the Ticket ID and your registered email.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const data = await trackTicket(id.trim(), em.trim());
      setTicket(data.ticket);
      setMessages(data.messages);
    } catch (err: any) {
      setTicket(null);
      setMessages([]);
      setErrorMessage(err.message || 'No ticket found with this ID and Email combination.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCustomerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    try {
      const res = await appendTicketMessage(ticket.id, replyText.trim(), ticket.customer_name);
      setMessages(res.messages);
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Support Ticket Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your unique Ticket ID (e.g. TK-2026-10492) and associated email address to view updates.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-5">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Ticket ID</label>
            <input
              type="text"
              required
              placeholder="e.g. TK-2026-10492"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase font-mono"
            />
          </div>
          <div className="sm:col-span-5">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Email</label>
            <input
              type="email"
              required
              placeholder="e.g. sarah.j@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{isLoading ? 'Verifying...' : 'Track'}</span>
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Ticket Quick Fill for Evaluation */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Try Sample Tickets:</span>
          <button
            type="button"
            onClick={() => {
              setTicketId('TK-2026-10492');
              setEmail('sarah.j@example.com');
              handleTrack('TK-2026-10492', 'sarah.j@example.com');
            }}
            className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-md font-mono text-[11px]"
          >
            TK-2026-10492 (In Progress)
          </button>
          <button
            type="button"
            onClick={() => {
              setTicketId('TK-2026-10493');
              setEmail('marcus.v@example.com');
              handleTrack('TK-2026-10493', 'marcus.v@example.com');
            }}
            className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-md font-mono text-[11px]"
          >
            TK-2026-10493 (Resolved)
          </button>
        </div>
      </div>

      {/* Ticket Details & Timeline */}
      {ticket && (
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-blue-600 tabular-nums">{ticket.id}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-semibold text-slate-500">{ticket.category}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">Priority: {ticket.priority}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{ticket.subject}</h2>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(ticket.status)}
                {ticket.status === 'Resolved' && (
                  <button
                    onClick={() => onOpenFeedback(ticket.id, ticket.category)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Rate Resolution</span>
                  </button>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-500">
              <div>
                <span className="block text-[11px] font-medium text-slate-400">Created At</span>
                <span className="font-medium text-slate-700 tabular-nums">
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-400">Last Activity</span>
                <span className="font-medium text-slate-700 tabular-nums">
                  {new Date(ticket.updated_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-400">Customer</span>
                <span className="font-medium text-slate-700">{ticket.customer_name}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-400">Resolved Date</span>
                <span className="font-medium text-slate-700 tabular-nums">
                  {ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : 'Pending'}
                </span>
              </div>
            </div>

            {/* Resolution Notes if Resolved */}
            {ticket.resolution_notes && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Official Staff Resolution Note
                </span>
                <p className="text-xs text-emerald-900 leading-relaxed">{ticket.resolution_notes}</p>
              </div>
            )}
          </div>

          {/* Conversation History Thread */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Communication & Activity Thread</span>
            </h3>

            <div className="space-y-4">
              {messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl text-xs sm:text-sm space-y-1.5 ${
                      isAgent
                        ? 'bg-blue-50/70 border border-blue-100 ml-4'
                        : 'bg-slate-50 border border-slate-100 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {isAgent ? (
                          <>
                            <Headphones className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-blue-900">{msg.sender_name} (Support Specialist)</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-slate-800">{msg.sender_name} (Customer)</span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Customer Reply Input */}
            {ticket.status !== 'Resolved' ? (
              <form onSubmit={handleSendCustomerReply} className="pt-4 border-t border-slate-100 space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Send Follow-up Message to Support Team
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Provide additional details or reply to our specialist..."
                    className="flex-1 text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSendingReply}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer self-end"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingReply ? 'Sending...' : 'Reply'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                This ticket has been marked as Resolved. Need further help?{' '}
                <button
                  onClick={() => onOpenFeedback(ticket.id, ticket.category)}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Rate this support interaction
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
