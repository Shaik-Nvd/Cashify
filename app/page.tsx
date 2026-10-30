'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, MapPin, ChevronDown, User, Smartphone, Laptop, 
  Gamepad2, Camera, Watch, RefreshCw, PenTool, Store, ShoppingBag, 
  ArrowRight, ShieldCheck, Truck, Zap, Star, ChevronLeft, ChevronRight, CheckCircle2,
  Percent, Shield, ThumbsUp, DollarSign, Award, Clock
} from 'lucide-react';
import FAQs from '@/components/FAQs';
import ClosingCta from '@/components/home/ClosingCta';

export default function LandingPage() {
  const [selectedCity, setSelectedCity] = useState('Gurgaon');
  const [showCityModal, setShowCityModal] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const heroBanners = [
    {
      tag: "DOORSTEP SERVICE",
      title: "Sell old phone",
      highlight: "for Instant Cash",
      subtitle: "From your doorstep in 60 mins or at any of our 200+ certified stores pan-India",
      ctaText: "Sell Now",
      ctaLink: "/quote",
      bgGradient: "from-[#128085] via-[#0d6e72] to-[#084b4e]",
      badge1: "DOORSTEP PICKUP",
      badge2: "200 STORES PAN INDIA",
      statNumber: "₹42,500+",
      statLabel: "Highest Payout Rate Today",
      statPhone: "iPhone 15 / Galaxy S24"
    },
    {
      tag: "REFURBISHED MEGA SALE",
      title: "Buy Refurbished",
      highlight: "Mobiles & Laptops",
      subtitle: "32-Point Quality Inspected with 6 to 12 Months Cashify Warranty & 7 Days Replacement",
      ctaText: "Shop Refurbished",
      ctaLink: "/buy",
      bgGradient: "from-[#0a4f52] via-[#0e6468] to-[#128085]",
      badge1: "32-POINT QUALITY CHECK",
      badge2: "1 YEAR WARRANTY",
      statNumber: "Up to 70% OFF",
      statLabel: "On Flagships with Warranty",
      statPhone: "Zero Cost EMI Available"
    },
    {
      tag: "EXPRESS DOORSTEP REPAIR",
      title: "Phone Screen Broken?",
      highlight: "Fix It In 30 Mins",
      subtitle: "Certified technicians visit your home or office. OEM grade screens with 6 months warranty.",
      ctaText: "Book Doorstep Repair",
      ctaLink: "/repair",
      bgGradient: "from-[#007f5f] via-[#10705a] to-[#025a47]",
      badge1: "GENUINE SPARE PARTS",
      badge2: "6 MONTHS WARRANTY",
      statNumber: "30 Minutes",
      statLabel: "Average Doorstep Repair Time",
      statPhone: "Free Diagnostic Visit"
    }
  ];

  const services = [
    { 
      name: "Sell Phone", 
      emoji: "📱", 
      href: "/quote", 
      badge: "Instant Cash & Doorstep", 
      desc: "Get the highest market valuation in 60 seconds with free pickup",
      actionText: "Sell Now →",
      bgGradient: "from-teal-50 to-emerald-50",
      borderColor: "border-teal-200"
    },
    { 
      name: "Buy Phone", 
      emoji: "📲", 
      href: "/buy", 
      badge: "Certified Refurbished", 
      desc: "32-Point Quality Inspected with 6-12 Months Warranty & Free Delivery",
      actionText: "Buy Now →",
      bgGradient: "from-blue-50 to-teal-50",
      borderColor: "border-teal-200"
    },
  ];

  const popularBrands = [
    { name: "Apple", logoSrc: "/images/brands/apple.png", models: "iPhone 15, 14, 13, 12, 11", href: "/quote?brand=Apple" },
    { name: "Samsung", logoSrc: "/images/brands/samsung.png", models: "Galaxy S24, S23, S22, Z Fold", href: "/quote?brand=Samsung" },
    { name: "OnePlus", logoSrc: "/images/brands/oneplus.png", models: "OnePlus 12, 11, 10, Nord Series", href: "/quote?brand=OnePlus" },
    { name: "Xiaomi", logoSrc: "/images/brands/xiaomi.png", models: "Redmi Note, Xiaomi Pro, POCO", href: "/quote?brand=Xiaomi" },
    { name: "Vivo", logoSrc: "/images/brands/vivo.png", models: "V30, V29, X90, T Series", href: "/quote?brand=Vivo" },
    { name: "Oppo", logoSrc: "/images/brands/oppo.png", models: "Reno 11, Find N, F Series", href: "/quote?brand=Oppo" },
    { name: "Google", logoSrc: "/images/brands/google.png", models: "Pixel 8 Pro, 7a, 6, 7", href: "/quote?brand=Google" },
    { name: "Realme", logoSrc: "/images/brands/realme.png", models: "Realme 12 Pro, GT, Narzo", href: "/quote?brand=Realme" },
  ];

  const featuredDeals = [
    {
      name: "Apple iPhone 13 (128 GB)",
      color: "Midnight Black",
      price: "₹34,499",
      origPrice: "₹59,900",
      discount: "42% OFF",
      condition: "Superb Condition",
      warranty: "6 Months Cashify Warranty",
      rating: 4.8,
      reviews: "1,240 ratings",
      tag: "Best Seller"
    },
    {
      name: "Samsung Galaxy S22 5G (128 GB)",
      color: "Phantom White",
      price: "₹26,999",
      origPrice: "₹72,999",
      discount: "63% OFF",
      condition: "Flawless Condition",
      warranty: "6 Months Cashify Warranty",
      rating: 4.7,
      reviews: "890 ratings",
      tag: "Top Value"
    },
    {
      name: "Apple iPhone 14 Pro (128 GB)",
      color: "Deep Purple",
      price: "₹68,999",
      origPrice: "₹1,29,900",
      discount: "47% OFF",
      condition: "Flawless Condition",
      warranty: "12 Months Warranty",
      rating: 4.9,
      reviews: "2,150 ratings",
      tag: "Premium Deal"
    },
    {
      name: "OnePlus 10 Pro 5G (128 GB)",
      color: "Emerald Forest",
      price: "₹23,499",
      origPrice: "₹66,999",
      discount: "65% OFF",
      condition: "Superb Condition",
      warranty: "6 Months Cashify Warranty",
      rating: 4.6,
      reviews: "640 ratings",
      tag: "Hot Price"
    }
  ];

  const citiesList = ["Gurgaon", "Delhi NCR", "Bengaluru", "Mumbai", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Noida"];

  return (
    <div className="w-full immersive-dark-canvas text-[#f1f5f9] min-h-screen relative overflow-hidden">
      
      {/* Background Floating Liquid Glow Orbs for Deep Immersion */}
      <div className="liquid-glow-orb w-[500px] h-[500px] bg-[#128085]/35 -top-32 -left-32" />
      <div className="liquid-glow-orb w-[450px] h-[450px] bg-[#2ecc71]/25 top-1/3 -right-32" style={{ animationDelay: '-5s' }} />
      <div className="liquid-glow-orb w-[600px] h-[600px] bg-[#0e6468]/30 bottom-1/4 -left-48" style={{ animationDelay: '-9s' }} />
      <div className="liquid-glow-orb w-[400px] h-[400px] bg-[#2ecc71]/20 -bottom-32 right-1/4" style={{ animationDelay: '-13s' }} />

      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-[#072527] via-[#0e6468] to-[#072527] border-b border-[#2ecc71]/20 text-white text-[11px] sm:text-xs py-2 px-4 text-center font-semibold flex items-center justify-center gap-2 relative z-50 shadow-lg">
        <span className="bg-[#2ecc71] text-gray-950 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs">OFFER</span>
        <span>Get Extra ₹1,500 Bonus on Selling Old Phones Today! Code: <strong className="text-[#2ecc71]">CASHIFYMAX</strong></span>
      </div>

      {/* Main Cashify Header (Liquid Glass Floating Navigation) */}
      <header className="sticky top-0 z-40 glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#2ecc71] to-[#128085] flex items-center justify-center text-gray-950 font-black text-xl shadow-lg neon-glow-green group-hover:scale-105 transition-transform">
                C
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
                  CASHIFY
                </span>
                <span className="text-[9px] font-bold text-[#2ecc71] uppercase tracking-widest mt-0.5">
                  Sell • Buy • Repair
                </span>
              </div>
            </Link>

            {/* Central Search Bar with Liquid Neon Glass Input */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-3 h-4 w-4 text-emerald-300/60" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search for mobiles, laptops, smartwatches & accessories..."
                  className="w-full glass-input rounded-full pl-11 pr-24 py-2.5 text-xs sm:text-sm focus:outline-none transition placeholder:text-gray-400"
                />
                <button 
                  onClick={() => {
                    if (searchVal) window.location.href = `/quote?search=${encodeURIComponent(searchVal)}`;
                  }}
                  className="absolute right-1.5 top-1.5 bg-gradient-to-r from-[#128085] to-[#2ecc71] hover:opacity-95 text-gray-950 text-xs font-black px-4 py-1.5 rounded-full transition shadow-md"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Location Selector & User Authentication Action */}
            <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-bold">
              <div 
                onClick={() => setShowCityModal(true)}
                className="flex items-center gap-1.5 cursor-pointer glass-pill px-3.5 py-1.5 rounded-full transition hover:border-[#2ecc71]"
              >
                <MapPin className="h-3.5 w-3.5 text-[#2ecc71]" />
                <span className="text-gray-200">{selectedCity}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </div>

              <Link 
                href="/auth" 
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#128085] to-[#2ecc71] text-gray-950 font-black px-4 py-1.5 rounded-full no-underline transition hover:scale-105 shadow-md neon-glow-green"
              >
                <User className="h-4 w-4 text-gray-950 stroke-[2.5]" />
                <span>Login</span>
              </Link>
            </div>

          </div>
        </div>

        {/* Secondary Category Navigation Bar */}
        <div className="border-t border-white/10 bg-black/30 backdrop-blur-md overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300 py-2.5 overflow-x-auto no-scrollbar gap-6 max-w-full">
              <span className="flex items-center gap-1 cursor-pointer text-[#2ecc71] font-black shrink-0">All Categories</span>
              <Link href="/quote" className="hover:text-[#2ecc71] flex items-center gap-1 no-underline text-gray-300 transition shrink-0">Sell Phone <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/quote" className="hover:text-[#2ecc71] flex items-center gap-1 no-underline text-gray-300 transition shrink-0">Sell Gadgets <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/buy" className="hover:text-[#2ecc71] flex items-center gap-1 no-underline text-gray-300 transition shrink-0">Buy Refurbished Devices <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/quote" className="hover:text-[#2ecc71] flex items-center gap-1 no-underline text-gray-300 transition shrink-0">Find New Gadget <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/buy" className="hover:text-[#2ecc71] flex items-center gap-1 no-underline text-gray-300 transition shrink-0">Buy Laptop <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/repair" className="hover:text-[#2ecc71] flex items-center gap-1 no-underline text-gray-300 transition shrink-0">Doorstep Repair <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/stores" className="hover:text-[#2ecc71] flex items-center gap-1 no-underline text-gray-300 transition shrink-0">Cashify Stores <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/partner" className="hover:text-[#2ecc71] flex items-center gap-1 no-underline text-[#f37021] transition shrink-0">Partner With Us</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        
        {/* Hero Interactive Slider */}
        <section className="relative rounded-3xl overflow-hidden glass-panel group border border-white/20">
          <div className={`bg-gradient-to-r ${heroBanners[activeSlide].bgGradient} p-8 sm:p-14 text-white min-h-[340px] sm:min-h-[380px] flex items-center justify-between relative`}>
            
            {/* Ambient liquid lighting glow inside banner */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#2ecc71]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#128085]/35 rounded-full blur-3xl pointer-events-none" />

            {/* Left Content */}
            <div className="max-w-xl space-y-5 z-10">
              <span className="inline-block bg-white/20 text-[#2ecc71] text-[11px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-xs">
                {heroBanners[activeSlide].tag}
              </span>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none drop-shadow-md">
                {heroBanners[activeSlide].title} <br />
                <span className="text-[#2ecc71]">{heroBanners[activeSlide].highlight}</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-200 max-w-lg font-medium leading-relaxed drop-shadow-xs">
                {heroBanners[activeSlide].subtitle}
              </p>
              
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href={heroBanners[activeSlide].ctaLink}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2ecc71] to-[#128085] text-gray-950 hover:brightness-110 font-black text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 no-underline neon-glow-green"
                >
                  {heroBanners[activeSlide].ctaText}
                  <ArrowRight className="h-4 w-4 stroke-[3]" />
                </Link>

                <div className="flex items-center gap-2 text-xs font-bold text-gray-200 glass-pill px-3.5 py-1.5 rounded-full">
                  <Truck className="h-4 w-4 text-[#2ecc71]" />
                  <span>Free Doorstep Pickup in {selectedCity}</span>
                </div>
              </div>
            </div>

            {/* Right Visual Card with Pure Liquid Glass */}
            <div className="hidden lg:flex items-center z-10 pr-6">
              <div className="w-68 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/20 p-6 shadow-2xl space-y-5 text-white">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="bg-[#2ecc71] text-gray-950 font-black px-3 py-1 rounded-full">{heroBanners[activeSlide].badge1}</span>
                  <span className="text-[#2ecc71] font-bold tracking-wide">✓ Verified</span>
                </div>

                <div className="text-center py-2">
                  <div className="text-3xl font-black text-white tracking-tight">{heroBanners[activeSlide].statNumber}</div>
                  <div className="text-xs text-gray-300 font-bold mt-1">{heroBanners[activeSlide].statLabel}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{heroBanners[activeSlide].statPhone}</div>
                </div>

                <div className="bg-white/10 rounded-2xl p-2.5 text-center text-[10px] font-black tracking-wider uppercase border border-white/10 text-emerald-300">
                  {heroBanners[activeSlide].badge2}
                </div>
              </div>
            </div>

            {/* Left / Right Slider Arrows */}
            <button
              onClick={() => setActiveSlide((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))}
              aria-label="Previous slide"
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/90 text-white hover:text-gray-900 flex items-center justify-center backdrop-blur-md opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-20 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev === heroBanners.length - 1 ? 0 : prev + 1))}
              aria-label="Next slide"
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/90 text-white hover:text-gray-900 flex items-center justify-center backdrop-blur-md opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-20 shadow-sm"
            >
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* Slide Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {heroBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all ${activeSlide === i ? 'w-8 bg-[#2ecc71]' : 'w-2 bg-white/30'}`}
                />
              ))}
            </div>

          </div>
        </section>

        {/* Services Showcase - Sell Phone & Buy Phone */}
        <section className="glass-panel p-6 sm:p-9">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-1.5">
            <div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#2ecc71] bg-[#2ecc71]/15 px-3 py-1 rounded-full border border-[#2ecc71]/30">
                Core Services
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight mt-2.5">
                Sell or Buy Refurbished Phones
              </h2>
              <p className="text-[11px] sm:text-sm text-gray-400 mt-1">
                India&apos;s most trusted smartphone trade-in and certified refurbished marketplace
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* SELL PHONE CARD */}
            <Link
              href="/quote"
              className="group relative overflow-hidden glass-card no-underline p-5 sm:p-8 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-r from-[#128085] to-[#2ecc71] text-gray-950 shadow-md">
                    <Zap className="h-3 w-3 fill-current text-gray-950" />
                    <span>Instant Price Quote</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#2ecc71] transition-colors leading-tight">
                    Sell Old Phone
                  </h3>

                  <p className="text-[11px] sm:text-xs text-gray-300 leading-snug line-clamp-2">
                    Instant cash at your doorstep. 100% certified data wipeout with free pickup.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] sm:text-[11px] font-bold">
                    <span className="glass-pill px-2.5 py-0.5 rounded-lg text-emerald-300">⚡ Instant UPI</span>
                    <span className="glass-pill px-2.5 py-0.5 rounded-lg text-emerald-300">🚚 Free Doorstep</span>
                    <span className="glass-pill px-2.5 py-0.5 rounded-lg text-emerald-300">🛡️ Safe Wipeout</span>
                  </div>
                </div>

                {/* Real High-End Transparent Smartphone Render */}
                <div className="relative w-24 h-28 sm:w-32 sm:h-36 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#2ecc71]/20 rounded-full blur-2xl transform scale-75" />
                  <Image
                    src="/images/models/apple-iphone-15-pro-max.png"
                    alt="Sell iPhone & Smartphones on Cashify"
                    fill
                    className="object-contain drop-shadow-2xl group-hover:scale-105 transition-transform"
                    priority
                  />
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Top Brands</span>
                  <span className="text-[11px] sm:text-xs font-bold text-gray-200 truncate block">Apple, Samsung, OnePlus</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#128085] to-[#2ecc71] text-gray-950 text-xs sm:text-sm font-black px-4 py-2 rounded-full shadow-md group-hover:scale-105 transition shrink-0">
                  <span>Sell Now</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>
            </Link>

            {/* BUY PHONE CARD */}
            <Link
              href="/buy"
              className="group relative overflow-hidden glass-card no-underline p-5 sm:p-8 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-[#128085] text-white shadow-md">
                    <ShieldCheck className="h-3 w-3 text-white" />
                    <span>Up to 70% Off</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#2ecc71] transition-colors leading-tight">
                    Buy Refurbished Phone
                  </h3>

                  <p className="text-[11px] sm:text-xs text-gray-300 leading-snug line-clamp-2">
                    Certified like-new phones. 32-point inspection, warranty &amp; 7 days refund.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] sm:text-[11px] font-bold">
                    <span className="glass-pill px-2.5 py-0.5 rounded-lg text-teal-300">🏷️ 32-Pt Tested</span>
                    <span className="glass-pill px-2.5 py-0.5 rounded-lg text-teal-300">🛡️ 1 Year Warranty</span>
                    <span className="glass-pill px-2.5 py-0.5 rounded-lg text-teal-300">💳 No-Cost EMI</span>
                  </div>
                </div>

                {/* Real High-End Transparent Smartphone Render */}
                <div className="relative w-24 h-28 sm:w-32 sm:h-36 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#128085]/25 rounded-full blur-2xl transform scale-75" />
                  <Image
                    src="/images/models/samsung-galaxy-s24-ultra-5g.png"
                    alt="Buy Refurbished Samsung & Flagship Phones on Cashify"
                    fill
                    className="object-contain drop-shadow-2xl group-hover:scale-105 transition-transform"
                    priority
                  />
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Starting From</span>
                  <span className="text-[11px] sm:text-xs font-bold text-gray-200 truncate block">₹6,999 with 1 Year Warranty</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#2ecc71] text-gray-950 text-xs sm:text-sm font-black px-4 py-2 rounded-full shadow-md group-hover:scale-105 transition shrink-0">
                  <span>Explore Phones</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* Brand Picker Section */}
        <section className="glass-panel p-6 sm:p-9">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Select Your Brand to Sell</h2>
              <p className="text-xs text-gray-400 mt-0.5">Instant online price calculation for 1,200+ models with free doorstep pickup</p>
            </div>
            <Link href="/quote" className="text-xs font-bold text-[#2ecc71] hover:underline flex items-center gap-1 no-underline glass-pill px-3.5 py-1 rounded-full">
              View All Brands <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {popularBrands.map((b) => (
              <Link
                key={b.name}
                href={b.href}
                className="p-4 rounded-2xl glass-card text-center transition-all group no-underline flex flex-col items-center justify-between min-h-[140px]"
              >
                <div className="h-10 w-full flex items-center justify-center">
                  <Image
                    src={b.logoSrc}
                    alt={`${b.name} logo`}
                    width={48}
                    height={48}
                    className="object-contain max-h-9 max-w-[70px] transition-transform duration-200 group-hover:scale-110 drop-shadow-md brightness-110"
                  />
                </div>
                <div className="w-full mt-2">
                  <div className="text-xs font-bold text-white group-hover:text-[#2ecc71] transition-colors">{b.name}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{b.models}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Buy Refurbished Phones Storefront */}
        <section className="glass-panel p-6 sm:p-9">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Buy Refurbished Mobiles</h2>
              <p className="text-xs text-gray-400 mt-0.5">32-point inspection • 6 to 12 Months Warranty • 7 Days Replacement</p>
            </div>
            <Link href="/buy" className="text-xs font-bold text-[#2ecc71] hover:underline flex items-center gap-1 no-underline glass-pill px-3.5 py-1 rounded-full">
              View All 150+ Deals <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDeals.map((deal, idx) => (
              <div 
                key={idx}
                className="rounded-2xl glass-card p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-[#2ecc71]/20 text-[#2ecc71] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#2ecc71]/30">
                      {deal.tag}
                    </span>
                    <span className="flex items-center text-amber-400 text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 mr-1" />
                      {deal.rating}
                    </span>
                  </div>

                  <div className="h-44 bg-black/40 rounded-2xl flex items-center justify-center p-4 mb-4 relative border border-white/10">
                    <div className="w-20 h-32 bg-gray-900 rounded-2xl border-4 border-gray-700 shadow-md flex flex-col items-center justify-between p-2">
                      <div className="w-6 h-1 bg-gray-600 rounded-full mt-1"></div>
                      <span className="text-[8px] font-black text-teal-400">CERTIFIED</span>
                      <div className="w-2 h-2 rounded-full border border-gray-600 mb-1"></div>
                    </div>
                    <span className="absolute bottom-2 right-2 text-[10px] glass-pill px-2 py-0.5 rounded-md font-semibold text-gray-300">
                      {deal.condition}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-white line-clamp-1">{deal.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{deal.color}</p>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-black text-white">{deal.price}</span>
                    <span className="text-xs text-gray-500 line-through">{deal.origPrice}</span>
                    <span className="text-xs font-black text-[#2ecc71]">{deal.discount}</span>
                  </div>

                  <p className="text-[11px] font-semibold text-[#2ecc71] mt-2 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {deal.warranty}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex gap-2">
                  <Link 
                    href="/buy" 
                    className="flex-1 bg-gradient-to-r from-[#128085] to-[#2ecc71] text-gray-950 text-xs font-black py-2.5 rounded-xl text-center no-underline transition hover:scale-[1.02] shadow-md"
                  >
                    Buy Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4 Pillars of Cashify Trust */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-6 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/30 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              ⚡
            </div>
            <h3 className="font-extrabold text-sm text-white">Instant Spot Payment</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Payment credited via UPI or Bank Transfer right in front of you before your device is picked up.</p>
          </div>

          <div className="glass-panel p-6 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/30 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              🚚
            </div>
            <h3 className="font-extrabold text-sm text-white">Free Doorstep Pickup</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Book a convenient pickup slot. Our verified executive reaches your location with zero visit fees.</p>
          </div>

          <div className="glass-panel p-6 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/30 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              🛡️
            </div>
            <h3 className="font-extrabold text-sm text-white">100% Data Safety</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Complete military-grade data wipeout guarantee on every smartphone with official certificate.</p>
          </div>

          <div className="glass-panel p-6 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/30 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              🏬
            </div>
            <h3 className="font-extrabold text-sm text-white">200+ Retail Stores</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Visit any nearby Cashify retail store across India for offline diagnostics, buyback, and repairs.</p>
          </div>
        </section>

        {/* FAQs */}
        <section aria-labelledby="faq-title" className="glass-panel p-6 sm:p-8">
          <FAQs />
        </section>

        {/* Closing CTA */}
        <ClosingCta />

      </main>

      {/* City Modal with Glass */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-panel max-w-sm w-full p-6 shadow-2xl relative border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Select City</h3>
              <button onClick={() => setShowCityModal(false)} className="text-gray-400 hover:text-white text-sm font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {citiesList.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setSelectedCity(c);
                    setShowCityModal(false);
                  }}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCity === c ? 'border-[#2ecc71] bg-[#2ecc71]/20 text-[#2ecc71]' : 'border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 text-[#2ecc71]" />
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
