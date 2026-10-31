import React, { useState, useEffect } from 'react';
import {
  User,
  Ticket as TicketIcon,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  Building,
  Phone,
  Mail,
  ArrowRight
} from 'lucide-react';
import { CustomerUser, Ticket } from '../types';
import { fetchCustomerTickets } from '../services/api';

interface CustomerPortalPageProps {
  customer: CustomerUser;
  onLogout: () => void;
  onNavigateToNewTicket: () => void;
  onNavigateToTrack: (ticketId: string, email: string) => void;
}

export const CustomerPortalPage: React.FC<CustomerPortalPageProps> = ({
  customer,
  onLogout,
  onNavigateToNewTicket,
  onNavigateToTrack,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadTickets = async () => {
    if (!customer.token) return;
    setIsLoading(true);
    try {
      const data = await fetchCustomerTickets(customer.token);
      setTickets(data);
    } catch (err: any) {
      console.error('Failed to load customer tickets:', err);
      setErrorMessage(err.message || 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [customer]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Customer Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Verified Customer
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {customer.email}
              </span>
              {customer.company && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {customer.company}
                  </span>
                </>
              )}
              {customer.phone && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {customer.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToNewTicket}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open New Ticket</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Ticket History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">My Support Tickets</h2>
            <span className="text-xs font-semibold text-slate-400 tabular-nums">({tickets.length})</span>
          </div>

          <button
            onClick={loadTickets}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-medium">Retrieving your support history...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 text-center text-xs text-rose-600">{errorMessage}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <TicketIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No support tickets found</h3>
              <p className="text-xs text-slate-500">
                You haven't submitted any support requests under this account yet.
              </p>
            </div>
            <button
              onClick={onNavigateToNewTicket}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Submit Your First Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigateToTrack(t.id, customer.email)}
                className="p-5 hover:bg-blue-50/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 tabular-nums">{t.id}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-medium text-slate-600">{t.category}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">
                      Created {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{t.subject}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(t.status)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToTrack(t.id, customer.email);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>View Conversation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
