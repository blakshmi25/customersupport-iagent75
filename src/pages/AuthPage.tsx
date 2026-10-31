import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Sparkles,
  Ticket as TicketIcon
} from 'lucide-react';
import { customerSignUp, customerLogin, adminSignUp } from '../services/api';
import { CustomerUser, AdminUser } from '../types';

interface AuthPageProps {
  onCustomerAuthSuccess: (customer: CustomerUser) => void;
  onAdminAuthSuccess: (admin: AdminUser) => void;
  onNavigate: (tab: string) => void;
  initialMode?: 'customer-signup' | 'customer-login' | 'staff-signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onCustomerAuthSuccess,
  onAdminAuthSuccess,
  onNavigate,
  initialMode = 'customer-signup',
}) => {
  // Mode: 'customer-signup' | 'customer-login' | 'staff-signup'
  const [mode, setMode] = useState<'customer-signup' | 'customer-login' | 'staff-signup'>(initialMode);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'customer-signup' || mode === 'staff-signup') {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }
      if (!agreeTerms && mode === 'customer-signup') {
        setErrorMessage('Please accept the customer support terms of service to continue.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'customer-signup') {
        const res = await customerSignUp({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
        });

        localStorage.setItem('customer_token', res.token);
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          onCustomerAuthSuccess({ ...res.customer, token: res.token });
        }, 800);
      } else if (mode === 'customer-login') {
        const res = await customerLogin(email.trim(), password);
        localStorage.setItem('customer_token', res.token);
        setSuccessMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          onCustomerAuthSuccess({ ...res.customer, token: res.token });
        }, 800);
      } else if (mode === 'staff-signup') {
        const res = await adminSignUp({
          full_name: name.trim(),
          email: email.trim(),
          password,
          invite_code: inviteCode.trim() || undefined,
        });

        localStorage.setItem('admin_token', res.token);
        setSuccessMessage('Staff account created successfully! Launching Admin Console...');
        setTimeout(() => {
          onAdminAuthSuccess({ ...res.user, token: res.token });
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillSampleCustomer = () => {
    setName('Sarah Jenkins');
    setEmail('sarah.j@example.com');
    setPassword('Customer@2026!');
    setConfirmPassword('Customer@2026!');
    setPhone('+1 (555) 019-2834');
    setCompany('Apex Global');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            {mode === 'staff-signup' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'customer-signup' && 'Create Customer Account'}
            {mode === 'customer-login' && 'Customer Portal Sign In'}
            {mode === 'staff-signup' && 'Support Staff Registration'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {mode === 'customer-signup' &&
              'Track all your support tickets in one place, chat with our AI agent, and receive priority resolution.'}
            {mode === 'customer-login' &&
              'Access your ongoing support inquiries, resolution history, and communication threads.'}
            {mode === 'staff-signup' &&
              'Register as an authorized customer support engineer or operations agent.'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-5 p-1 bg-slate-100/90 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('customer-signup');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'customer-signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('customer-login');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'customer-login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('staff-signup');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'staff-signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Sign Up
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {(mode === 'customer-signup' || mode === 'staff-signup') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {mode === 'staff-signup' ? 'Staff Full Name' : 'Full Name'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {(mode === 'customer-signup' || mode === 'staff-signup') && (
              <span className="text-[10px] text-slate-400">Minimum 6 characters</span>
            )}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {(mode === 'customer-signup' || mode === 'staff-signup') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Optional Phone & Company (Customer Signup only) */}
          {mode === 'customer-signup' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs pl-8 pr-2.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">Company (Optional)</label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full text-xs pl-8 pr-2.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Staff Invite Code (Staff Signup only) */}
          {mode === 'staff-signup' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Staff Invite Code (Optional)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. SUPPORT2026 (or leave blank for evaluation)"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
              <span className="text-[10px] text-slate-400">Use SUPPORT2026 or leave blank for instant evaluation.</span>
            </div>
          )}

          {/* Terms Agreement (Customer Signup only) */}
          {mode === 'customer-signup' && (
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-600 leading-tight">
                I agree to the Customer Support Terms and consent to email updates regarding ticket status and AI assistant conversations.
              </label>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>
                    {mode === 'customer-signup' && 'Create Account'}
                    {mode === 'customer-login' && 'Sign In to Portal'}
                    {mode === 'staff-signup' && 'Register Support Specialist'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Fill Helper */}
          {mode === 'customer-signup' && (
            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={fillSampleCustomer}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill with sample customer details</span>
              </button>
            </div>
          )}

          {mode === 'customer-login' && (
            <div className="pt-3 border-t border-slate-100 text-center space-y-1">
              <button
                type="button"
                onClick={() => {
                  setEmail('sarah.j@example.com');
                  setPassword('Customer@2026!');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill demo customer (sarah.j@example.com)</span>
              </button>
              <div className="text-[11px] text-slate-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('customer-signup')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign up now
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
