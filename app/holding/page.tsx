import React from 'react';
import type { Metadata } from 'next';
import { Mail, Globe, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Domain Transfer Notice',
  description: 'To transfer this domain, please send an email to mail2nvd@gmail.com.',
};

export default function HoldingPage() {
  return (
    <div className="fixed inset-0 z-[99999] flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#0c1416] via-[#101f22] to-[#0a1214] px-4 text-white">
      {/* Background ambient lighting */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute h-96 w-96 rounded-full bg-[#128085]/20 blur-[120px]" 
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-10">
        
        {/* Domain Icon Emblem */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#128085]/20 border border-[#128085]/40 text-[#2ecc71] shadow-lg shadow-[#128085]/20">
          <Globe className="h-8 w-8 stroke-[2.2]" />
        </div>

        <span className="inline-block rounded-full bg-[#128085]/25 border border-[#128085]/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-300">
          Domain Inquiries
        </span>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
          To Transfer this Domain
        </h1>

        <p className="mt-3 text-sm text-gray-300 sm:text-base leading-relaxed">
          This website is temporarily paused. For domain acquisition and transfer inquiries, please send an email to:
        </p>

        {/* Email Highlight Card */}
        <div className="mt-6 rounded-2xl border border-white/15 bg-black/40 p-4">
          <a
            href="mailto:mail2nvd@gmail.com?subject=Domain%20Transfer%20Inquiry"
            className="group flex items-center justify-center gap-2.5 text-base sm:text-lg font-black text-[#2ecc71] hover:text-[#52e891] transition-colors no-underline break-all"
          >
            <Mail className="h-5 w-5 shrink-0 text-[#128085] group-hover:text-[#2ecc71] transition-colors" />
            <span>mail2nvd@gmail.com</span>
          </a>
        </div>

        {/* Direct Action Button */}
        <div className="mt-6">
          <a
            href="mailto:mail2nvd@gmail.com?subject=Domain%20Transfer%20Inquiry"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#128085] hover:bg-[#0e6468] px-6 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg transition-all no-underline hover:-translate-y-0.5"
          >
            <span>Send Email Now</span>
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </a>
        </div>

        <p className="mt-6 text-[11px] text-gray-400">
          We will respond with transfer terms and instructions shortly.
        </p>
      </div>
    </div>
  );
}
