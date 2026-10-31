import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Ticket as TicketIcon,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { FAQ, TicketCategory } from '../types';
import { fetchFaqs, submitFaqFeedback } from '../services/api';

interface FaqPageProps {
  onNavigateToTicket: () => void;
  onNavigateToChat: (prompt?: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigateToTicket, onNavigateToChat }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [votedMap, setVotedMap] = useState<Record<number, 'helpful' | 'not_helpful'>>({});

  const categories = ['All', 'Orders', 'Payments', 'Refunds', 'Account', 'Technical Issues'];

  const loadFaqs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFaqs(selectedCategory, searchQuery);
      setFaqs(data);
      if (data.length > 0 && expandedId === null) {
        setExpandedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFaqs();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleVote = async (id: number, helpful: boolean) => {
    if (votedMap[id]) return;
    try {
      await submitFaqFeedback(id, helpful);
      setVotedMap((prev) => ({
        ...prev,
        [id]: helpful ? 'helpful' : 'not_helpful',
      }));
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                helpful_count: helpful ? f.helpful_count + 1 : f.helpful_count,
                not_helpful_count: !helpful ? f.not_helpful_count + 1 : f.not_helpful_count,
              }
            : f
        )
      );
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge Base & Support Library</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How can we help you today?
        </h1>
        <p className="text-sm text-slate-600">
          Search verified resolutions across orders, billing, refunds, account security, and troubleshooting.
        </p>

        {/* Live Search Input */}
        <div className="relative max-w-xl mx-auto pt-2">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords (e.g., tracking, declined, refund timeline, 2FA)..."
            className="w-full pl-12 pr-4 py-3.5 text-sm bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Category Segmented Filter Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQs List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-medium">Loading knowledge base articles...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No matching articles found</h3>
              <p className="text-xs text-slate-500">
                Try using different keywords or create a support ticket directly with our team.
              </p>
            </div>
            <button
              onClick={onNavigateToTicket}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Submit Support Ticket
            </button>
          </div>
        ) : (
          faqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            const userVote = votedMap[faq.id];

            return (
              <div key={faq.id} className="transition-colors">
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-blue-600 tracking-wider uppercase">
                      {faq.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                      {faq.question}
                    </h3>
                  </div>
                  <div className={`p-1 rounded-lg text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-blue-600' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-6 pt-1 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/40 border-t border-slate-100">
                    <p className="whitespace-pre-line">{faq.answer}</p>

                    {/* Helpful Bar & Ask Agent Shortcut */}
                    <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-medium text-xs">Was this helpful?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleVote(faq.id, true)}
                            disabled={!!userVote}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              userVote === 'helpful'
                                ? 'bg-emerald-100 text-emerald-800 font-bold'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Yes ({faq.helpful_count})</span>
                          </button>
                          <button
                            onClick={() => handleVote(faq.id, false)}
                            disabled={!!userVote}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              userVote === 'not_helpful'
                                ? 'bg-rose-100 text-rose-800 font-bold'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />
                            <span>No</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigateToChat(faq.question)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ask AI agent more about this</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still need help CTA banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-slate-900">Didn't find what you're looking for?</h4>
          <p className="text-xs text-slate-500">
            Submit a support ticket and our human specialists will investigate within our guaranteed SLA.
          </p>
        </div>
        <button
          onClick={onNavigateToTicket}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs shrink-0"
        >
          <TicketIcon className="w-4 h-4" />
          <span>Open Support Ticket</span>
        </button>
      </div>
    </div>
  );
};
