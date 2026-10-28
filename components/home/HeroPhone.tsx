'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Smartphone, ArrowRight, ShieldCheck, Truck, Zap, CheckCircle2, 
  Sparkles, Star, ChevronRight, RefreshCw, Award
} from 'lucide-react';

export default function HeroPhone() {
  const [selectedBrand, setSelectedBrand] = useState('Apple');
  const [selectedModel, setSelectedModel] = useState('iPhone 14 (128 GB)');
  const [condition, setCondition] = useState<'flawless' | 'good' | 'average'>('good');

  const brandOptions: Record<string, string[]> = {
    Apple: ['iPhone 15 Pro Max', 'iPhone 15', 'iPhone 14 (128 GB)', 'iPhone 13', 'iPhone 12'],
    Samsung: ['Galaxy S23 Ultra', 'Galaxy S22 5G', 'Galaxy S21 FE', 'Galaxy A54'],
    OnePlus: ['OnePlus 11 5G', 'OnePlus 10 Pro', 'OnePlus 9RT', 'OnePlus Nord CE 3'],
    Xiaomi: ['Xiaomi 13 Pro', 'Redmi Note 12 Pro+', 'Redmi Note 11', 'POCO X5 Pro'],
  };

  const getEstimatedPrice = () => {
    let base = 26000;
    if (selectedBrand === 'Apple') {
      if (selectedModel.includes('15 Pro')) base = 62000;
      else if (selectedModel.includes('15')) base = 44000;
      else if (selectedModel.includes('14')) base = 34500;
      else if (selectedModel.includes('13')) base = 28000;
      else base = 21000;
    } else if (selectedBrand === 'Samsung') {
      if (selectedModel.includes('Ultra')) base = 52000;
      else if (selectedModel.includes('S22')) base = 27500;
      else base = 16000;
    } else if (selectedBrand === 'OnePlus') {
      if (selectedModel.includes('11')) base = 29000;
      else if (selectedModel.includes('10')) base = 23000;
      else base = 14500;
    } else {
      base = 13500;
    }

    if (condition === 'flawless') base = Math.round(base * 1.12);
    if (condition === 'average') base = Math.round(base * 0.78);

    return base.toLocaleString('en-IN');
  };

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
      
      {/* Decorative ambient glowing rings matching Cashify teal */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#128085]/20 via-[#2ecc71]/15 to-transparent blur-2xl opacity-75"></div>

      {/* Main Glassmorphic Pricing Card */}
      <div className="relative rounded-3xl border border-[#128085]/25 bg-surface/95 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#128085] text-xs font-black text-white">
              C
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#128085]">
              Instant Valuation Engine
            </span>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3 w-3" /> Highest Payout
          </span>
        </div>

        {/* Brand Chips */}
        <div className="mt-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Select Brand</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {Object.keys(brandOptions).map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => {
                  setSelectedBrand(brand);
                  setSelectedModel(brandOptions[brand][0]);
                }}
                className={`rounded-xl py-2 px-1 text-center text-xs font-bold transition-all ${
                  selectedBrand === brand
                    ? 'border border-[#128085] bg-[#128085] text-white shadow-md shadow-[#128085]/20'
                    : 'border border-border bg-surface-elevated text-foreground hover:border-[#128085]/50'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Model Dropdown */}
        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Device Model</label>
          <div className="relative mt-1.5">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-surface-elevated py-2.5 pl-3.5 pr-8 text-sm font-semibold text-foreground focus:border-[#128085] focus:outline-none"
            >
              {brandOptions[selectedBrand].map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-3 h-4 w-4 rotate-90 text-muted" />
          </div>
        </div>

        {/* Condition Selector */}
        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Condition State</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {[
              { id: 'flawless', label: 'Flawless', desc: 'Like new' },
              { id: 'good', label: 'Good', desc: 'Minor signs' },
              { id: 'average', label: 'Average', desc: 'Scratched' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCondition(c.id as any)}
                className={`rounded-xl p-2 text-left border transition-all ${
                  condition === c.id
                    ? 'border-[#128085] bg-[#128085]/10 text-[#128085] font-bold'
                    : 'border-border bg-surface-elevated text-muted hover:border-[#128085]/40'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{c.label}</div>
                <div className="text-[10px] opacity-75">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Output Box */}
        <div className="mt-6 rounded-2xl border border-[#128085]/20 bg-gradient-to-r from-[#128085]/10 via-[#2ecc71]/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted">Estimated Cash at Doorstep</span>
              <div className="mt-0.5 text-2xl md:text-3xl font-black tracking-tight text-[#128085]">
                ₹{getEstimatedPrice()}
              </div>
            </div>
            <Link
              href={`/quote?brand=${encodeURIComponent(selectedBrand)}`}
              className="flex items-center gap-1.5 rounded-xl bg-[#2ecc71] hover:bg-[#27ae60] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-transform hover:-translate-y-0.5 no-underline"
            >
              Get Exact Quote
              <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
            </Link>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/80 pt-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <Truck className="h-4 w-4 text-[#128085]" />
            <span className="text-[11px] font-semibold text-foreground">Free Doorstep</span>
            <span className="text-[9px] text-muted">Within 60 Mins</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="h-4 w-4 text-[#2ecc71]" />
            <span className="text-[11px] font-semibold text-foreground">Spot Payment</span>
            <span className="text-[9px] text-muted">Instant UPI / Cash</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-[#128085]" />
            <span className="text-[11px] font-semibold text-foreground">100% Safe</span>
            <span className="text-[9px] text-muted">Data Erasure Cert</span>
          </div>
        </div>

      </div>
    </div>
  );
}
