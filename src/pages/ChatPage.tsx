import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Ticket as TicketIcon,
  RefreshCw,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/api';

interface ChatPageProps {
  onNavigateToTicket: (prefillData: { subject: string; description: string; transcript: any[] }) => void;
  onOpenFeedback: () => void;
  initialPrompt?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  onNavigateToTicket,
  onOpenFeedback,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I am your AI Customer Support Agent. How can I assist you today?

I can answer questions regarding:
• Order status, dispatch & tracking
• 30-day refund & return guidelines
• Payment methods, invoice downloads & declined cards
• Two-factor authentication & password recovery
• Technical troubleshooting & API status

Feel free to ask a question or select a suggested topic below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'ai',
      confidence: 1.0,
      suggestedQuestions: [
        'How can I track my shipped order?',
        'What is your 30-day refund policy?',
        'Why was my credit card declined?',
        'How do I enable Two-Factor Authentication?',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle optional initial prompt passed from home page
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt.trim());
    }
  }, [initialPrompt]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    setErrorMessage('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(textToSend.trim(), historyPayload);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: res.mode,
        confidence: res.confidence,
        matchedFaqs: res.matchedFaqs,
        canEscalate: res.canEscalate,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err.message || 'The AI customer service is temporarily unreachable. Please try again or create a support ticket.'
      );
      const fallbackErrorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `I'm currently having trouble reaching the knowledge agent. You can still browse our FAQ knowledge base or escalate this issue directly to our human support team using the button below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        canEscalate: true,
      };
      setMessages((prev) => [...prev, fallbackErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEscalateToTicket = (lastQuestion?: string) => {
    const transcript = messages.map((m) => ({
      sender: m.role === 'user' ? 'Customer' : 'AI Agent',
      content: m.content,
      time: m.timestamp,
    }));

    // Generate smart subject from user's last question or first user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const subject = lastUserMsg ? `Escalated Chat: ${lastUserMsg.content.slice(0, 60)}` : 'Customer Support Escalation';
    const description = `This inquiry was escalated from the AI customer support chat for human specialist review.\n\nSummary of inquiry: ${lastUserMsg ? lastUserMsg.content : 'Unresolved question'}`;

    onNavigateToTicket({
      subject,
      description,
      transcript,
    });
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation cleared. How else can I assist you with your orders, account, or payments?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'ai',
      },
    ]);
  };

  const quickTopics = [
    { label: 'Track Order', query: 'How can I track my shipped order?' },
    { label: '30-Day Return', query: 'What is your standard 30-day return and refund policy?' },
    { label: 'Card Declined', query: 'Why was my credit card transaction declined?' },
    { label: 'Setup 2FA', query: 'How do I enable Two-Factor Authentication?' },
    { label: 'Change Address', query: 'Can I change my delivery address after placing an order?' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">AI Customer Support Specialist</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Knowledge Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded strictly in verified policy · Zero hallucinated order numbers · 24/7 Response
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
          <button
            onClick={() => handleEscalateToTicket()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <TicketIcon className="w-3.5 h-3.5" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
                    isUser ? 'bg-slate-800' : 'bg-blue-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-2 max-w-[85%] sm:max-w-xl">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/70'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Matched FAQ Citation Badges if present */}
                    {!isUser && msg.matchedFaqs && msg.matchedFaqs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs">
                        <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-blue-500" />
                          <span>Knowledge Base Grounding:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.matchedFaqs.slice(0, 2).map((faq) => (
                            <span
                              key={faq.id}
                              className="text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1"
                            >
                              <span className="font-semibold text-blue-600">{faq.category}:</span>
                              <span className="truncate max-w-[200px]">{faq.question}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bubble Metadata & Action Bar */}
                  <div className={`flex items-center gap-2 text-[11px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="tabular-nums">{msg.timestamp}</span>
                    {!isUser && (
                      <>
                        <span>·</span>
                        <span className="text-slate-500 font-medium">
                          {msg.mode === 'ai' ? 'Gemini 3.8 Flash' : 'FAQ Engine'}
                        </span>
                        {msg.canEscalate && (
                          <>
                            <span>·</span>
                            <button
                              onClick={() => handleEscalateToTicket()}
                              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>Escalate to Human Ticket</span>
                            </button>
                          </>
                        )}
                        <span>·</span>
                        <button
                          onClick={onOpenFeedback}
                          className="hover:text-slate-600 text-slate-400 transition-colors"
                          title="Rate this answer"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-xl mr-auto">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-100 border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 flex items-center gap-2 text-slate-500 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-medium">Consulting official knowledge base...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips Bar */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {quickTopics.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 rounded-lg border border-slate-200 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask about orders, refunds, payments, account, or technical issues..."
              className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Press Enter to send. All responses are verified against current company FAQs.</span>
            <span className="hidden sm:inline">Strict Zero-Hallucination Policy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
