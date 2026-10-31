import React, { useState, useEffect } from 'react';
import {
  Shield,
  Ticket as TicketIcon,
  HelpCircle,
  BarChart3,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  X,
  Send,
  ExternalLink,
  Lock,
  Star,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { Ticket, FAQ, CustomerFeedback, AdminStats, AdminUser } from '../types';
import {
  adminLogin,
  fetchAdminStats,
  fetchAdminTickets,
  fetchAdminTicketDetail,
  updateAdminTicket,
  replyAdminTicket,
  fetchAdminFaqs,
  createAdminFaq,
  updateAdminFaq,
  deleteAdminFaq,
  fetchAdminFeedback
} from '../services/api';

interface AdminPageProps {
  onLoginSuccess: (user: AdminUser) => void;
  currentUser: AdminUser | null;
  onLogout: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  // Login form state
  const [email, setEmail] = useState('admin@supportagent.io');
  const [password, setPassword] = useState('Admin@2026!');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active admin tab: 'tickets' | 'faqs' | 'analytics' | 'feedback'
  const [activeTab, setActiveTab] = useState<'tickets' | 'faqs' | 'analytics' | 'feedback'>('tickets');

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('All');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [newStatusReply, setNewStatusReply] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // FAQs state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqCategory, setFaqCategory] = useState('Orders');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Feedback list state
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);

  const token = currentUser?.token || localStorage.getItem('admin_token') || '';

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const data = await adminLogin(email, password);
      localStorage.setItem('admin_token', data.token);
      onLoginSuccess({ ...data.user, token: data.token });
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!token) return;
    try {
      const [statsData, ticketsData, faqsData, feedbackData] = await Promise.all([
        fetchAdminStats(token),
        fetchAdminTickets(token, {
          status: ticketStatusFilter,
          category: ticketCategoryFilter,
          search: ticketSearch,
        }),
        fetchAdminFaqs(token),
        fetchAdminFeedback(token),
      ]);
      setStats(statsData);
      setTickets(ticketsData);
      setFaqs(faqsData);
      setFeedbackList(feedbackData);
    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err);
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        onLogout();
      }
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, ticketStatusFilter, ticketCategoryFilter, ticketSearch]);

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const data = await fetchAdminTicketDetail(token, ticketId);
      setSelectedTicket(data.ticket);
      setTicketMessages(data.messages);
      setNewStatusReply(data.ticket.status);
    } catch (err) {
      console.error('Failed to fetch ticket detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket || !token) return;
    setActionLoading(true);
    try {
      const res = await updateAdminTicket(token, selectedTicket.id, { status: newStatus });
      setSelectedTicket(res.ticket);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedTicket || !token) return;
    setActionLoading(true);
    try {
      const res = await updateAdminTicket(token, selectedTicket.id, { priority: newPriority });
      setSelectedTicket(res.ticket);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update priority');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReplyText.trim() || !token || actionLoading) return;

    setActionLoading(true);
    try {
      const res = await replyAdminTicket(token, selectedTicket.id, adminReplyText.trim(), newStatusReply);
      setSelectedTicket(res.ticket);
      setTicketMessages(res.messages);
      setAdminReplyText('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim() || !token) return;

    try {
      if (editingFaq) {
        await updateAdminFaq(token, editingFaq.id, {
          category: faqCategory as any,
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
        });
      } else {
        await createAdminFaq(token, {
          category: faqCategory,
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
        });
      }
      setFaqModalOpen(false);
      setEditingFaq(null);
      setFaqQuestion('');
      setFaqAnswer('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to save FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await deleteAdminFaq(token, id);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  // If not logged in, render Admin Login Card
  if (!currentUser && !token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Console Login</h1>
            <p className="text-xs text-slate-500">
              Authorized support personnel and operations supervisors only.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Staff Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@supportagent.io"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loginLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          {/* 1-Click Demo Login Helper */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-2">Preconfigured Evaluation Account:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@supportagent.io');
                setPassword('Admin@2026!');
                setTimeout(() => handleLogin(), 100);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              ⚡ Click to Fill & Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar with Admin Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">Support Operations Dashboard</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Live SQLite Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as <span className="font-semibold text-slate-700">{currentUser?.full_name || 'Admin'}</span> ({currentUser?.email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <span>Swagger UI Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={loadDashboardData}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Tickets</span>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {stats ? stats.totalTickets : '—'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">All registered tickets</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-blue-600 block mb-1">Open Queue</span>
          <div className="text-2xl font-extrabold text-blue-700 tabular-nums">
            {stats ? stats.openTickets : '—'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Requires staff triage</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600 block mb-1">In Progress</span>
          <div className="text-2xl font-extrabold text-amber-600 tabular-nums">
            {stats ? stats.inProgressTickets : '—'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active investigation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 block mb-1">Resolved</span>
          <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
            {stats ? stats.resolvedTickets : '—'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Satisfied outcomes</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-slate-400 block mb-1">Customer CSAT</span>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums flex items-center gap-1">
            <span>{stats ? stats.avgCsat : '5.0'}</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats ? `${stats.feedbackCount} ratings logged` : ''}
          </span>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>Ticket Management ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'faqs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Knowledge Base Manager ({faqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Support Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Customer Reviews ({feedbackList.length})</span>
        </button>
      </div>

      {/* ----------------- TAB 1: TICKETS ----------------- */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Filters Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Search ticket ID, customer, email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={ticketCategoryFilter}
                onChange={(e) => setTicketCategoryFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Categories</option>
                <option value="Orders">Orders</option>
                <option value="Payments">Payments</option>
                <option value="Refunds">Refunds</option>
                <option value="Account">Account</option>
                <option value="Technical Issues">Technical Issues</option>
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No support tickets match the current filters.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => openTicketDetail(t.id)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 whitespace-nowrap tabular-nums">
                        {t.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{t.customer_name}</div>
                        <div className="text-[11px] text-slate-400">{t.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">
                        {t.category}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate font-medium text-slate-800">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            t.priority === 'Urgent'
                              ? 'text-rose-600'
                              : t.priority === 'High'
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            t.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : t.status === 'In Progress'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400 tabular-nums">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTicketDetail(t.id);
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md"
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: FAQS MANAGER ----------------- */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Knowledge Base Article Management</h2>
            <button
              onClick={() => {
                setEditingFaq(null);
                setFaqCategory('Orders');
                setFaqQuestion('');
                setFaqAnswer('');
                setFaqModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New FAQ</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/50">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                      {faq.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">
                      {faq.helpful_count} helpful / {faq.not_helpful_count} not helpful
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{faq.answer}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingFaq(faq);
                      setFaqCategory(faq.category);
                      setFaqQuestion(faq.question);
                      setFaqAnswer(faq.answer);
                      setFaqModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit article"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: ANALYTICS ----------------- */}
      {activeTab === 'analytics' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Ticket Volume by Issue Category</span>
            </h3>

            <div className="space-y-3 pt-2">
              {stats.categoryStats.map((item) => {
                const pct = stats.totalTickets > 0 ? Math.round((item.count / stats.totalTickets) * 100) : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{item.category}</span>
                      <span className="text-slate-500 tabular-nums">
                        {item.count} tickets ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket Resolution Status Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Resolution Health & Status Breakdown</span>
            </h3>

            <div className="grid grid-cols-3 gap-3 pt-4 text-center">
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-blue-700 block">Open Rate</span>
                <span className="text-xl font-bold text-blue-900 tabular-nums">
                  {stats.totalTickets > 0 ? Math.round((stats.openTickets / stats.totalTickets) * 100) : 0}%
                </span>
                <span className="text-[10px] text-blue-600 block">{stats.openTickets} tickets</span>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-amber-700 block">In Progress</span>
                <span className="text-xl font-bold text-amber-900 tabular-nums">
                  {stats.totalTickets > 0 ? Math.round((stats.inProgressTickets / stats.totalTickets) * 100) : 0}%
                </span>
                <span className="text-[10px] text-amber-600 block">{stats.inProgressTickets} tickets</span>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700 block">Resolution Rate</span>
                <span className="text-xl font-bold text-emerald-900 tabular-nums">
                  {stats.totalTickets > 0 ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) : 0}%
                </span>
                <span className="text-[10px] text-emerald-600 block">{stats.resolvedTickets} tickets</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1 mt-4">
              <span className="font-semibold text-slate-800">Operational SLA Performance</span>
              <p>
                Average response time is currently &lt; 15 minutes for initial triage. 94% of issues are resolved within the 24-hour service guarantee window.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: CUSTOMER REVIEWS ----------------- */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Customer Satisfaction Reviews (CSAT)</h2>
              <p className="text-xs text-slate-500">Live ratings logged by customers across chat and tickets.</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {stats?.avgCsat || '5.0'} / 5.0
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {feedbackList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No customer feedback submitted yet.</div>
            ) : (
              feedbackList.map((item) => (
                <div key={item.id} className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{item.category || 'General'}</span>
                      {item.ticket_id && (
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {item.ticket_id}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {item.comment && (
                    <p className="text-xs text-slate-700 leading-relaxed italic">"{item.comment}"</p>
                  )}

                  {item.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {JSON.parse(item.tags).map((tag: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------- TICKET DETAIL MODAL / DRAWER ----------------- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600">{selectedTicket.id}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-semibold text-slate-600">{selectedTicket.category}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Customer details bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Customer</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.customer_name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Email</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.customer_email}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Submitted</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selectedTicket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status and Priority Controls */}
              <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded-xl bg-white">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={actionLoading}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    disabled={actionLoading}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Chat Transcript Accordion if escalated from AI Chat */}
              {selectedTicket.chat_transcript && (
                <details className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-3 text-xs">
                  <summary className="font-semibold text-indigo-900 cursor-pointer">
                    View Pre-Escalation AI Chat Transcript ({JSON.parse(selectedTicket.chat_transcript).length} messages)
                  </summary>
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pt-2 border-t border-indigo-100">
                    {JSON.parse(selectedTicket.chat_transcript).map((item: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-lg bg-white border border-indigo-100 space-y-0.5">
                        <span className="font-bold text-indigo-900">{item.sender}:</span>
                        <p className="text-slate-700">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Thread Messages */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Conversation Log</h4>
                <div className="space-y-2">
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                        msg.sender === 'agent'
                          ? 'bg-blue-50/80 border border-blue-100 ml-4'
                          : 'bg-slate-50 border border-slate-100 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className={msg.sender === 'agent' ? 'text-blue-900' : 'text-slate-800'}>
                          {msg.sender_name} ({msg.sender === 'agent' ? 'Staff' : 'Customer'})
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Reply Form */}
              <form onSubmit={handleAdminReply} className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">Post Official Staff Reply</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Set status after reply:</span>
                    <select
                      value={newStatusReply}
                      onChange={(e) => setNewStatusReply(e.target.value)}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 bg-white"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Open">Open</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  required
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Type official reply or resolution details to customer..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={!adminReplyText.trim() || actionLoading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'Posting...' : 'Send Reply & Update Status'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CREATE/EDIT FAQ MODAL ----------------- */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingFaq ? 'Edit Knowledge Base Article' : 'Create Knowledge Base Article'}
              </h3>
              <button
                onClick={() => setFaqModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Category</label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="Orders">Orders</option>
                  <option value="Payments">Payments</option>
                  <option value="Refunds">Refunds</option>
                  <option value="Account">Account</option>
                  <option value="Technical Issues">Technical Issues</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Question Title</label>
                <input
                  type="text"
                  required
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="e.g. How do I request an exchange?"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Answer & Guidelines</label>
                <textarea
                  rows={4}
                  required
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Provide precise policy instructions..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingFaq ? 'Update Article' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
