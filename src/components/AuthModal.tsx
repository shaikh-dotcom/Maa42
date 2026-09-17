import React, { useState, useEffect } from 'react';
import { Maa42Logo } from './Maa42Logo';
import { SignUpDetails, firebaseErrorToMessage } from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, User, Calendar, ShieldCheck, ArrowRight, Check, X, Loader2, AlertTriangle } from 'lucide-react';

interface AuthModalProps {
  initialMode: 'signin' | 'signup';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSignIn: (email: string, password: string) => Promise<unknown>;
  onSignUp: (email: string, password: string, details: SignUpDetails) => Promise<unknown>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode,
  isOpen,
  onClose,
  onSuccess,
  onSignIn,
  onSignUp,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isPostpartum, setIsPostpartum] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [postpartumDay, setPostpartumDay] = useState(1);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // The modal stays mounted between opens, so re-sync to whichever mode it
  // was opened with instead of getting stuck on whatever the user last
  // clicked inside a previous session.
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage('');
      setSuccessMessage('');
      setPassword('');
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await onSignIn(email, password);
        setSuccessMessage('Welcome Back, Mama!');
      } else {
        await onSignUp(email, password, {
          fullName,
          isPostpartum,
          dueDate: isPostpartum ? undefined : dueDate,
          postpartumDay: isPostpartum ? postpartumDay : undefined,
        });
        setSuccessMessage('Account Created Successfully!');
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(firebaseErrorToMessage(err?.code));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-surface-container my-auto animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'signin' ? (
          /* Sign In Screen */
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-[0_4px_20px_rgba(19,107,115,0.08)] mb-4 p-2.5 border border-surface-container">
              <Maa42Logo className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-bold font-headline text-on-surface mb-1">
              Welcome Back, Mama
            </h1>
            <p className="text-sm text-on-surface-variant mb-6 text-center">
              Sign in to continue your care journey
            </p>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 absolute left-3.5 text-outline pointer-events-none" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                    placeholder="mama@example.com"
                    className="w-full bg-surface-container-low pl-11 pr-4 py-3.5 rounded-xl text-sm text-on-surface placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 absolute left-3.5 text-outline pointer-events-none" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="w-full bg-surface-container-low pl-11 pr-12 py-3.5 rounded-xl text-sm text-on-surface placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-outline hover:text-on-surface transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-secondary accent-secondary focus:ring-secondary cursor-pointer"
                  />
                  <span className="text-xs text-on-surface-variant font-medium">
                    Remember me on this device
                  </span>
                </label>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 bg-error-container text-on-error-container text-xs font-medium px-3.5 py-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-4 rounded-full font-semibold text-sm shadow-[0_4px_16px_rgba(0,67,73,0.2)] hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : successMessage ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{successMessage}</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 mt-5 text-sm text-on-surface-variant">
              <span>Don&apos;t have an account?</span>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 bg-secondary-fixed/30 px-4 py-2.5 rounded-full text-xs text-secondary font-medium shadow-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Your health data is securely encrypted &amp; private</span>
            </div>
          </div>
        ) : (
          /* Sign Up Screen */
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-[0_4px_20px_rgba(19,107,115,0.08)] flex items-center justify-center p-2.5 mb-4 border border-surface-container">
              <Maa42Logo className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-bold font-headline text-on-surface tracking-tight mb-1 text-center">
              Join MedSophia Maa42
            </h1>
            <p className="text-sm text-on-surface-variant max-w-xs text-center mb-6">
              Personalized AI care for pregnancy and postpartum
            </p>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" />
                  <span>Full Name</span>
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm border border-surface-container focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>Email Address</span>
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="sarah@example.com"
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm border border-surface-container focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Password</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-surface-container-low text-on-surface text-sm border border-surface-container focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-outline hover:text-on-surface p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Pregnancy / Postpartum mode — this is what every screen
                  will branch on, so we capture it up front at signup. */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Where are you in your journey?
                </label>
                <div className="flex bg-surface-container-low p-1 rounded-xl border border-surface-container">
                  <button
                    type="button"
                    onClick={() => setIsPostpartum(false)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !isPostpartum ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Pregnant
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPostpartum(true)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isPostpartum ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Postpartum
                  </button>
                </div>
              </div>

              {isPostpartum ? (
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Day of Postpartum Recovery</span>
                  </label>
                  <input
                    value={postpartumDay}
                    onChange={(e) => setPostpartumDay(Math.max(1, Math.min(42, Number(e.target.value) || 1)))}
                    required
                    type="number"
                    min={1}
                    max={42}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm border border-surface-container focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Expected Due Date</span>
                  </label>
                  <input
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    type="date"
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm border border-surface-container focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              )}

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  required
                  className="mt-1 w-4 h-4 rounded text-secondary accent-secondary focus:ring-secondary cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-on-surface-variant leading-relaxed">
                  I agree to MedSophia&apos;s <span className="text-primary font-medium underline">Terms of Service</span> and <span className="text-primary font-medium underline">Privacy Policy</span>, ensuring my health data remains secure and private.
                </label>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 bg-error-container text-on-error-container text-xs font-medium px-3.5 py-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full h-12 bg-primary text-on-primary rounded-full font-semibold text-sm shadow-[0_4px_12px_rgba(0,67,73,0.2)] hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : successMessage ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{successMessage}</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-5">
              <p className="text-sm text-on-surface-variant">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-primary font-bold hover:underline ml-1 cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
