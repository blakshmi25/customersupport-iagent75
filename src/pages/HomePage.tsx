import React from 'react';
import {
  MessageSquare,
  HelpCircle,
  Ticket as TicketIcon,
  Search,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Headphones,
  FileText,
  User,
  UserPlus
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string, state?: any) => void;
  onOpenFeedback: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const popularQuestions = [
    {
      q: 'How can I track my shipped order?',
      cat: 'Orders',
      action: () => onNavigate('chat', { initialPrompt: 'How can I track my shipped order?' }),
    },
    {
      q: 'What is your 30-day refund policy?',
      cat: 'Refunds',
      action: () => onNavigate('chat', { initialPrompt: 'What is your standard 30-day refund policy?' }),
    },
    {
      q: 'Why was my credit card transaction declined?',
      cat: 'Payments',
      action: () => onNavigate('chat', { initialPrompt: 'Why was my credit card transaction declined?' }),
    },
    {
      q: 'How do I enable Two-Factor Authentication (2FA)?',
      cat: 'Account',
      action: () => onNavigate('chat', { initialPrompt: 'How do I enable Two-Factor Authentication (2FA)?' }),
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'Knowledge Grounded AI',
      desc: 'Accurate instant answers verified directly against official FAQs and support guidelines. No hallucinated tracking codes or unauthorized refund approvals.',
      accent: 'from-blue-600 to-indigo-600',
    },
    {
      icon: Zap,
      title: 'Instant Ticket Escalation',
      desc: 'Seamlessly convert complex inquiries into structured support tickets with full conversation context and priority tagging in one click.',
      accent: 'from-indigo-600 to-purple-600',
    },
    {
      icon: Clock,
      title: 'Real-Time Status Tracking',
      desc: 'Track support resolutions live with Ticket ID and email verification. View timeline updates, internal notes, and send direct follow-up replies.',
      accent: 'from-blue-500 to-cyan-600',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security & SLA',
      desc: 'Role-based access control, encrypted SQLite database persistence, and rapid response SLAs backed by a dedicated human support escalation team.',
      accent: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 md:pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Next-Generation Customer Support</span>
                <span className="text-slate-300">·</span>
                <span>Powered by Gemini 3.8 Flash & SQLite</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] text-balance">
                Instant answers with intelligent AI resolution.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Get immediate help with orders, refunds, payments, and technical accounts through our grounded knowledge agent—or seamlessly escalate to our human support team with full context preservation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('chat')}
                  className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-blue-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Start AI Chat Now</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() => onNavigate('ticket')}
                  className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <TicketIcon className="w-4 h-4 text-slate-500" />
                  <span>Open Support Ticket</span>
                </button>

                <button
                  onClick={() => onNavigate('auth')}
                  className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Sign Up / Portal</span>
                </button>

                <button
                  onClick={() => onNavigate('track')}
                  className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl transition-colors whitespace-nowrap"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>Track Status</span>
                </button>
              </div>

              {/* Proof Metric Strip */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">99.4%</div>
                  <div className="text-xs text-slate-500 font-medium">Knowledge Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">&lt; 15s</div>
                  <div className="text-xs text-slate-500 font-medium">Average Response Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">4.9 / 5.0</div>
                  <div className="text-xs text-slate-500 font-medium">Customer CSAT Score</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Interface Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
                <img
                  src="/src/assets/images/support_hero_interface_1793424885644.jpg"
                  alt="Customer Support Intelligent Agent Console"
                  className="w-full h-80 sm:h-96 object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Graceful fallback container if asset loading fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Floating Preview Pill */}
                <div className="p-5 bg-gradient-to-b from-white/95 to-slate-50/95 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      AI
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">OmniSupport Agent Active</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Ready to assist 24/7 with zero waiting queue</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('chat')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Chat →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Support Questions Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Frequently Asked Inquiries</h2>
              <p className="text-xs text-slate-500">Click any inquiry to immediately launch the AI resolution workflow.</p>
            </div>
            <button
              onClick={() => onNavigate('faqs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start md:self-auto"
            >
              <span>Explore full knowledge base</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularQuestions.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="group p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-sm text-left transition-all flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                    {item.cat}
                  </div>
                  <div className="text-xs font-medium text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2">
                    {item.q}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-blue-600">
                  <span>Ask Agent</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Core Architectural Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered for reliability, precision, and trust
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Eliminate traditional chat frustration with strict grounding in verified company policies, instant ticket generation, and transparent tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${feat.accent} flex items-center justify-center text-white shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Support Escalation Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
              <Headphones className="w-4 h-4" />
              <span>Need Dedicated Human Assistance?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Complex problem or billing dispute? We are on standby.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Our tier-2 engineers and billing specialists actively monitor open tickets with real-time updates and notifications.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('ticket')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors"
              >
                Submit High Priority Ticket
              </button>
              <button
                onClick={() => onNavigate('track')}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
              >
                Check Existing Ticket
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
