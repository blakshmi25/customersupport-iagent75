/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FeedbackModal } from './components/FeedbackModal';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { FaqPage } from './pages/FaqPage';
import { SubmitTicketPage } from './pages/SubmitTicketPage';
import { TrackTicketPage } from './pages/TrackTicketPage';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { AdminUser, CustomerUser } from './types';
import { fetchCustomerMe } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);
  const [ticketPrefill, setTicketPrefill] = useState<{
    subject?: string;
    description?: string;
    transcript?: any[];
  } | undefined>(undefined);
  const [trackParams, setTrackParams] = useState<{ ticketId?: string; email?: string }>({});
  const [feedbackConfig, setFeedbackConfig] = useState<{
    isOpen: boolean;
    ticketId?: string;
    category?: string;
  }>({ isOpen: false });

  // Admin session
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Customer session
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(null);

  useEffect(() => {
    // Check saved Admin Token
    const savedAdminToken = localStorage.getItem('admin_token');
    if (savedAdminToken) {
      setAdminUser({
        id: 1,
        email: 'admin@supportagent.io',
        full_name: 'Senior Support Lead',
        role: 'admin',
        token: savedAdminToken,
      });
    }

    // Check saved Customer Token
    const savedCustomerToken = localStorage.getItem('customer_token');
    if (savedCustomerToken) {
      fetchCustomerMe(savedCustomerToken)
        .then((res) => {
          setCurrentCustomer({ ...res.customer, token: savedCustomerToken });
        })
        .catch(() => {
          localStorage.removeItem('customer_token');
        });
    }
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminUser(null);
    setActiveTab('home');
  };

  const handleCustomerLogout = () => {
    localStorage.removeItem('customer_token');
    setCurrentCustomer(null);
    setActiveTab('home');
  };

  const handleCustomerAuthSuccess = (customer: CustomerUser) => {
    setCurrentCustomer(customer);
    setActiveTab('portal');
  };

  const handleAdminAuthSuccess = (admin: AdminUser) => {
    setAdminUser(admin);
    setActiveTab('admin');
  };

  const navigateTo = (tab: string, state?: any) => {
    if (tab === 'chat' && state?.initialPrompt) {
      setChatPrompt(state.initialPrompt);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChatEscalation = (data: { subject: string; description: string; transcript: any[] }) => {
    setTicketPrefill(data);
    setActiveTab('ticket');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackTicket = (ticketId: string, email: string) => {
    setTrackParams({ ticketId, email });
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openFeedbackModal = (ticketId?: string, category?: string) => {
    setFeedbackConfig({
      isOpen: true,
      ticketId,
      category,
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={!!adminUser}
        onLogoutAdmin={handleAdminLogout}
        currentCustomer={currentCustomer}
        onLogoutCustomer={handleCustomerLogout}
      />

      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={navigateTo}
            onOpenFeedback={() => openFeedbackModal()}
          />
        )}

        {activeTab === 'chat' && (
          <ChatPage
            initialPrompt={chatPrompt}
            onNavigateToTicket={handleChatEscalation}
            onOpenFeedback={() => openFeedbackModal()}
          />
        )}

        {activeTab === 'faqs' && (
          <FaqPage
            onNavigateToTicket={() => {
              setTicketPrefill(undefined);
              setActiveTab('ticket');
            }}
            onNavigateToChat={(prompt) => {
              setChatPrompt(prompt);
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'ticket' && (
          <SubmitTicketPage
            prefillData={ticketPrefill}
            customerDefault={
              currentCustomer
                ? { name: currentCustomer.name, email: currentCustomer.email }
                : undefined
            }
            onNavigateToTrack={handleTrackTicket}
            onNavigateToFaqs={() => setActiveTab('faqs')}
          />
        )}

        {activeTab === 'track' && (
          <TrackTicketPage
            initialTicketId={trackParams.ticketId}
            initialEmail={trackParams.email}
            onOpenFeedback={openFeedbackModal}
          />
        )}

        {activeTab === 'portal' && currentCustomer && (
          <CustomerPortalPage
            customer={currentCustomer}
            onLogout={handleCustomerLogout}
            onNavigateToNewTicket={() => setActiveTab('ticket')}
            onNavigateToTrack={handleTrackTicket}
          />
        )}

        {activeTab === 'auth' && (
          <AuthPage
            onCustomerAuthSuccess={handleCustomerAuthSuccess}
            onAdminAuthSuccess={handleAdminAuthSuccess}
            onNavigate={navigateTo}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            currentUser={adminUser}
            onLoginSuccess={(user) => setAdminUser(user)}
            onLogout={handleAdminLogout}
          />
        )}
      </main>

      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFeedback={() => openFeedbackModal()}
      />

      <FeedbackModal
        isOpen={feedbackConfig.isOpen}
        onClose={closeFeedbackModal}
        ticketId={feedbackConfig.ticketId}
        category={feedbackConfig.category}
      />
    </div>
  );
}
