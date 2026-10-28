import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function ClosingCta() {
  return (
    <section aria-labelledby="closing-title" className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#128085] via-[#0e6468] to-[#094649] px-6 py-12 text-center text-white shadow-2xl sm:px-10 md:py-16">
        
        {/* Soft glowing teal radial light */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[140%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(46,204,113,0.25),transparent)]"
        />

        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-100 backdrop-blur-md mb-4 border border-white/15">
          <Zap className="h-3.5 w-3.5 fill-current text-[#f8c12d]" />
          Instant Doorstep Cash &amp; Free Pickup
        </div>

        <p className="relative text-[2.2rem] sm:text-[3rem] font-black leading-tight tracking-tight text-white" id="closing-title">
          Sell smart. <span className="text-[#2ecc71]">Buy smarter.</span>
        </p>

        <p className="relative mx-auto mt-3 max-w-lg text-teal-50 text-sm sm:text-base leading-relaxed">
          Find out what your phone is worth in a few taps. Get highest market value, zero pickup fee, and instant UPI payment.
        </p>

        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/quote"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#2ecc71] hover:bg-[#27ae60] px-7 py-4 text-base font-extrabold text-white shadow-lg transition-transform hover:-translate-y-0.5 no-underline w-full sm:w-auto"
          >
            Sell your phone
            <ArrowRight aria-hidden="true" className="h-5 w-5 stroke-[2.5]" />
          </Link>
          <Link
            href="/buy"
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 px-6 py-4 text-base font-bold text-white backdrop-blur-md transition-all no-underline w-full sm:w-auto"
          >
            <ShieldCheck className="h-5 w-5 text-teal-200" />
            Browse refurbished phones
          </Link>
        </div>
      </div>
    </section>
  );
}
