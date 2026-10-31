import React from 'react';
import { Bot, Mail, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenFeedback: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenFeedback }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span>OmniSupport Intelligent Agent</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              AI-powered customer service platform combining strict knowledge base grounding, automated escalation, and human-in-the-loop ticket resolution.
            </p>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SOC2 Type II & GDPR Compliant</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">Platform Services</h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('chat')} className="hover:text-white transition-colors">
                  AI Customer Support Chat
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faqs')} className="hover:text-white transition-colors">
                  Knowledge Base & FAQs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('ticket')} className="hover:text-white transition-colors">
                  Submit Support Ticket
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('track')} className="hover:text-white transition-colors">
                  Track Ticket Status
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">Developer & Admin</h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">
                  Admin Operations Console
                </button>
              </li>
              <li>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>FastAPI Swagger UI</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="/api/openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  OpenAPI 3.0 Specification
                </a>
              </li>
              <li>
                <button onClick={onOpenFeedback} className="hover:text-white transition-colors text-blue-400">
                  Rate Support Experience (CSAT)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">Direct Support & Hours</h4>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@supportagent.io</span>
              </div>
              <p>Specialist Coverage: Monday – Sunday, 24/7 Priority Response</p>
              <p className="text-emerald-400 font-medium">Core SLA: &lt; 2 Hours for High-Priority Tickets</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} OmniSupport Intelligent Agent. All rights reserved. Built with React, Tailwind CSS, SQLite, and FastAPI.
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Customer First Customer Support</span>
            <span>·</span>
            <button
              onClick={onOpenFeedback}
              className="text-xs font-medium text-slate-300 hover:text-white underline underline-offset-2 flex items-center gap-1"
            >
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
              Give Feedback
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
