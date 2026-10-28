'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, ShieldCheck, CheckCircle2, ArrowRight, Lock, KeyRound, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  
  // Two-step number login state
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneFirst, setPhoneFirst] = useState('');
  const [phoneSecond, setPhoneSecond] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const normalizePhone = (num: string) => {
    return num.replace(/\D/g, '').slice(-10);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const clean = normalizePhone(phoneFirst);
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const firstClean = normalizePhone(phoneFirst);
    const secondClean = normalizePhone(phoneSecond);

    if (secondClean.length !== 10) {
      setIsLoading(false);
      setErrorMsg('Please enter a valid 10-digit confirmation number.');
      return;
    }

    if (firstClean !== secondClean) {
      setIsLoading(false);
      setErrorMsg('Mobile numbers do not match! Please enter the same phone number to verify.');
      return;
    }

    // Both phone numbers match - Authenticate user directly
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg('Number verified successfully! Logging you in...');

      const formattedPhone = `+91${firstClean}`;
      const mockToken = `cashify_auth_${Date.now()}`;
      
      setAuth(
        { 
          id: `usr_${firstClean}`, 
          phone: formattedPhone, 
          role: 'user', 
          email: `${firstClean}@cashify.store` 
        }, 
        mockToken, 
        mockToken
      );

      setTimeout(() => {
        router.push('/');
      }, 700);
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden bg-background">
      
      {/* Background glowing orbs matching Cashify teal theme */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#128085]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2ecc71]/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] p-8 sm:p-10 rounded-3xl bg-surface/90 border border-border shadow-2xl backdrop-blur-2xl overflow-hidden"
      >
        
        {/* Header Icon */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#128085] to-[#0a4f52] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#128085]/25 border border-teal-300/30">
            {step === 1 ? (
              <Smartphone className="w-8 h-8 text-white stroke-[2.2]" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-[#2ecc71] stroke-[2.5]" />
            )}
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {step === 1 ? 'Two-Step Phone Login' : 'Confirm Your Number'}
          </h1>
          <p className="text-xs text-muted mt-1.5 max-w-xs mx-auto">
            {step === 1 
              ? 'Step 1 of 2: Enter your primary mobile number' 
              : 'Step 2 of 2: Re-enter your mobile number to confirm identity'}
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-8 bg-[#128085]' : 'w-4 bg-[#2ecc71]'}`} />
            <span className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-8 bg-[#128085]' : 'w-4 bg-border'}`} />
          </div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1 Form */}
        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Mobile Number (Step 1)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-sm font-bold text-muted select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={phoneFirst}
                  onChange={(e) => setPhoneFirst(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-surface-elevated border border-border focus:border-[#128085] rounded-xl pl-14 pr-4 py-3 text-base font-bold text-foreground focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#128085] hover:bg-[#0e6468] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>Continue to Step 2</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>
        ) : (
          /* Step 2 Form: Confirm number */
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Re-enter Mobile Number (Step 2)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-sm font-bold text-muted select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="Re-enter to confirm"
                  value={phoneSecond}
                  onChange={(e) => setPhoneSecond(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-surface-elevated border border-border focus:border-[#128085] rounded-xl pl-14 pr-4 py-3 text-base font-bold text-foreground focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setPhoneSecond('');
                  setErrorMsg('');
                }}
                className="w-1/3 border border-border hover:bg-surface-elevated text-muted font-bold text-xs py-3.5 rounded-xl transition"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <span>Confirm &amp; Login</span>
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Badges */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#128085]" /> 2-Step Verified
          </span>
          <span>•</span>
          <span>Instant Login</span>
          <span>•</span>
          <span>100% Privacy</span>
        </div>

      </motion.div>
    </div>
  );
}
