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
    <div className="w-full bg-[#f8fafb] text-[#1c252c] min-h-screen">
      
      {/* Top Banner Notice */}
      <div className="bg-[#0e6468] text-white text-[11px] sm:text-xs py-1.5 px-4 text-center font-semibold flex items-center justify-center gap-2">
        <span className="bg-[#f8c12d] text-[#0e6468] text-[9px] font-black uppercase px-1.5 py-0.5 rounded">OFFER</span>
        <span>Get Extra ₹1,500 Bonus on Selling Old Phones Today! Code: <strong>CASHIFYMAX</strong></span>
      </div>

      {/* Main Cashify Header (Exact Desktop & Mobile Layout) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#128085] flex items-center justify-center text-white font-black text-xl shadow-sm">
                C
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#128085] leading-none">
                  CASHIFY
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  Sell • Buy • Repair
                </span>
              </div>
            </Link>

            {/* Central Search Bar with Icon & Placeholder */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search for mobiles, laptops, smartwatches & accessories..."
                  className="w-full bg-[#f1f5f7] border border-gray-200 rounded-full pl-11 pr-24 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#128085] focus:bg-white transition"
                />
                <button 
                  onClick={() => {
                    if (searchVal) window.location.href = `/quote?search=${encodeURIComponent(searchVal)}`;
                  }}
                  className="absolute right-1.5 top-1.5 bg-[#128085] hover:bg-[#0e6468] text-white text-xs font-bold px-4 py-1.5 rounded-full transition shadow-xs"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Location Selector & User Authentication Action */}
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold text-gray-700">
              <div 
                onClick={() => setShowCityModal(true)}
                className="flex items-center gap-1.5 cursor-pointer bg-gray-50 border border-gray-200 hover:border-[#128085] px-3 py-1.5 rounded-full transition"
              >
                <MapPin className="h-3.5 w-3.5 text-[#128085]" />
                <span>{selectedCity}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </div>

              <Link 
                href="/auth" 
                className="flex items-center gap-1.5 bg-[#e6f6f6] hover:bg-[#d5efef] text-[#128085] px-3.5 py-1.5 rounded-full no-underline transition"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </div>

          </div>
        </div>

        {/* Secondary Category Navigation Bar */}
        <div className="border-t border-gray-100 bg-[#fafbfc] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 py-2.5 overflow-x-auto no-scrollbar gap-6 max-w-full">
              <span className="flex items-center gap-1 cursor-pointer text-[#128085] font-extrabold shrink-0">All Categories</span>
              <Link href="/quote" className="hover:text-[#128085] flex items-center gap-1 no-underline text-gray-700 transition shrink-0">Sell Phone <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/quote" className="hover:text-[#128085] flex items-center gap-1 no-underline text-gray-700 transition shrink-0">Sell Gadgets <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/buy" className="hover:text-[#128085] flex items-center gap-1 no-underline text-gray-700 transition shrink-0">Buy Refurbished Devices <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/quote" className="hover:text-[#128085] flex items-center gap-1 no-underline text-gray-700 transition shrink-0">Find New Gadget <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/buy" className="hover:text-[#128085] flex items-center gap-1 no-underline text-gray-700 transition shrink-0">Buy Laptop <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/repair" className="hover:text-[#128085] flex items-center gap-1 no-underline text-gray-700 transition shrink-0">Doorstep Repair <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/stores" className="hover:text-[#128085] flex items-center gap-1 no-underline text-gray-700 transition shrink-0">Cashify Stores <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/partner" className="hover:text-[#128085] flex items-center gap-1 no-underline text-[#f37021] transition shrink-0">Partner With Us</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        
        {/* Hero Interactive Slider */}
        <section className="relative rounded-3xl overflow-hidden shadow-xl border border-teal-100 group">
          <div className={`bg-gradient-to-r ${heroBanners[activeSlide].bgGradient} p-8 sm:p-14 text-white min-h-[340px] sm:min-h-[380px] flex items-center justify-between relative`}>
            
            {/* Left Content */}
            <div className="max-w-xl space-y-5 z-10">
              <span className="inline-block bg-white/20 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                {heroBanners[activeSlide].tag}
              </span>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
                {heroBanners[activeSlide].title} <br />
                <span className="text-[#2ecc71]">{heroBanners[activeSlide].highlight}</span>
              </h1>

              <p className="text-sm sm:text-base text-teal-50 max-w-lg font-medium leading-relaxed">
                {heroBanners[activeSlide].subtitle}
              </p>
              
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href={heroBanners[activeSlide].ctaLink}
                  className="inline-flex items-center gap-2 bg-white text-[#128085] hover:bg-teal-50 font-black text-sm px-8 py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 no-underline"
                >
                  {heroBanners[activeSlide].ctaText}
                  <ArrowRight className="h-4 w-4 stroke-[3]" />
                </Link>

                <div className="flex items-center gap-2 text-xs font-semibold text-teal-100">
                  <Truck className="h-4 w-4 text-[#2ecc71]" />
                  <span>Free Doorstep Pickup in {selectedCity}</span>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="hidden lg:flex items-center z-10 pr-6">
              <div className="w-64 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl space-y-5 text-white">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="bg-[#2ecc71] text-gray-900 font-extrabold px-2.5 py-0.5 rounded-full">{heroBanners[activeSlide].badge1}</span>
                  <span className="text-teal-200">Verified</span>
                </div>

                <div className="text-center py-2">
                  <div className="text-3xl font-black text-white">{heroBanners[activeSlide].statNumber}</div>
                  <div className="text-xs text-teal-100 font-semibold mt-1">{heroBanners[activeSlide].statLabel}</div>
                  <div className="text-[10px] text-teal-200 mt-0.5">{heroBanners[activeSlide].statPhone}</div>
                </div>

                <div className="bg-white/15 rounded-xl p-2.5 text-center text-[10px] font-bold tracking-wide uppercase">
                  {heroBanners[activeSlide].badge2}
                </div>
              </div>
            </div>

            {/* Left / Right Slider Arrows (Subtle: smaller, semi-transparent, reveal on hover) */}
            <button
              onClick={() => setActiveSlide((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))}
              aria-label="Previous slide"
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/25 hover:bg-white/90 text-white hover:text-gray-900 flex items-center justify-center backdrop-blur-md opacity-40 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-20 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev === heroBanners.length - 1 ? 0 : prev + 1))}
              aria-label="Next slide"
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/25 hover:bg-white/90 text-white hover:text-gray-900 flex items-center justify-center backdrop-blur-md opacity-40 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-20 shadow-sm"
            >
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* Slide Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {heroBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all ${activeSlide === i ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                />
              ))}
            </div>

          </div>
        </section>

        {/* Services Showcase - Sell Phone & Buy Phone */}
        <section className="bg-white rounded-3xl p-4 sm:p-8 shadow-xs border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-8 gap-1.5">
            <div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#128085] bg-[#e6f6f6] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                Core Services
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1.5">
                Sell or Buy Refurbished Phones
              </h2>
              <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5">
                India&apos;s most trusted smartphone trade-in and certified refurbished marketplace
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* SELL PHONE CARD */}
            <Link
              href="/quote"
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-100 bg-[#f7fafb] hover:bg-[#eef8f8] hover:border-[#128085]/60 hover:shadow-xl transition-all duration-300 no-underline p-4 sm:p-7 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-[#128085] text-white shadow-xs">
                    <Zap className="h-3 w-3 fill-current text-white" />
                    <span>Instant Price Quote</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-950 group-hover:text-[#128085] transition-colors leading-tight">
                    Sell Old Phone
                  </h3>

                  <p className="text-[11px] sm:text-xs text-gray-500 leading-snug line-clamp-2">
                    Instant cash at your doorstep. 100% certified data wipeout with free pickup.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] sm:text-[11px] font-bold text-gray-700">
                    <span className="bg-white border border-teal-100 text-[#128085] px-2 py-0.5 rounded-md shadow-2xs">⚡ Instant UPI</span>
                    <span className="bg-white border border-teal-100 text-[#128085] px-2 py-0.5 rounded-md shadow-2xs">🚚 Free Doorstep</span>
                    <span className="bg-white border border-teal-100 text-[#128085] px-2 py-0.5 rounded-md shadow-2xs">🛡️ Safe Wipeout</span>
                  </div>
                </div>

                {/* Real High-End Transparent Smartphone Render */}
                <div className="relative w-24 h-28 sm:w-32 sm:h-36 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-teal-200/30 rounded-full blur-xl transform scale-75" />
                  <Image
                    src="/images/models/apple-iphone-15-pro-max.png"
                    alt="Sell iPhone & Smartphones on Cashify"
                    fill
                    className="object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                    priority
                  />
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-gray-200/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Top Brands</span>
                  <span className="text-[11px] sm:text-xs font-bold text-gray-800 truncate block">Apple, Samsung, OnePlus</span>
                </div>
                <div className="flex items-center gap-1 bg-[#128085] text-white text-xs sm:text-sm font-bold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xs group-hover:bg-[#0e6468] transition shrink-0">
                  <span>Sell Now</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
              </div>
            </Link>

            {/* BUY PHONE CARD */}
            <Link
              href="/buy"
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-100 bg-[#f7fafb] hover:bg-[#eef8f8] hover:border-[#128085]/60 hover:shadow-xl transition-all duration-300 no-underline p-4 sm:p-7 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-[#0e6468] text-white shadow-xs">
                    <ShieldCheck className="h-3 w-3 text-white" />
                    <span>Up to 70% Off</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-950 group-hover:text-[#128085] transition-colors leading-tight">
                    Buy Refurbished Phone
                  </h3>

                  <p className="text-[11px] sm:text-xs text-gray-500 leading-snug line-clamp-2">
                    Certified like-new phones. 32-point inspection, warranty &amp; 7 days refund.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] sm:text-[11px] font-bold text-gray-700">
                    <span className="bg-white border border-teal-100 text-[#0e6468] px-2 py-0.5 rounded-md shadow-2xs">🏷️ 32-Pt Tested</span>
                    <span className="bg-white border border-teal-100 text-[#0e6468] px-2 py-0.5 rounded-md shadow-2xs">🛡️ 1 Year Warranty</span>
                    <span className="bg-white border border-teal-100 text-[#0e6468] px-2 py-0.5 rounded-md shadow-2xs">💳 No-Cost EMI</span>
                  </div>
                </div>

                {/* Real High-End Transparent Smartphone Render */}
                <div className="relative w-24 h-28 sm:w-32 sm:h-36 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-teal-200/30 rounded-full blur-xl transform scale-75" />
                  <Image
                    src="/images/models/samsung-galaxy-s24-ultra-5g.png"
                    alt="Buy Refurbished Samsung & Flagship Phones on Cashify"
                    fill
                    className="object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                    priority
                  />
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-gray-200/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Starting From</span>
                  <span className="text-[11px] sm:text-xs font-bold text-gray-800 truncate block">₹6,999 with 1 Year Warranty</span>
                </div>
                <div className="flex items-center gap-1 bg-[#2ecc71] text-white text-xs sm:text-sm font-bold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xs group-hover:bg-[#27ae60] transition shrink-0">
                  <span>Explore Phones</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* Brand Picker Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Select Your Brand to Sell</h2>
              <p className="text-xs text-gray-500 mt-0.5">Instant online price calculation for 1,200+ models with free doorstep pickup</p>
            </div>
            <Link href="/quote" className="text-xs font-bold text-[#128085] hover:underline flex items-center gap-1 no-underline">
              View All Brands <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {popularBrands.map((b) => (
              <Link
                key={b.name}
                href={b.href}
                className="p-4 rounded-2xl border border-gray-100 bg-[#fbfcfd] hover:border-[#128085] hover:bg-[#f0f9f9] text-center transition-all group no-underline flex flex-col items-center justify-between min-h-[140px]"
              >
                <div className="h-10 w-full flex items-center justify-center">
                  <Image
                    src={b.logoSrc}
                    alt={`${b.name} logo`}
                    width={48}
                    height={48}
                    className="object-contain max-h-9 max-w-[70px] transition-transform duration-200 group-hover:scale-110"
                  />
                </div>
                <div className="w-full mt-2">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-[#128085] transition-colors">{b.name}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{b.models}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Buy Refurbished Phones Storefront */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Buy Refurbished Mobiles</h2>
              <p className="text-xs text-gray-500 mt-0.5">32-point inspection • 6 to 12 Months Warranty • 7 Days Replacement</p>
            </div>
            <Link href="/buy" className="text-xs font-bold text-[#128085] hover:underline flex items-center gap-1 no-underline">
              View All 150+ Deals <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDeals.map((deal, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-gray-200 hover:border-[#128085] hover:shadow-lg transition p-5 bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-[#e6f6f6] text-[#128085] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      {deal.tag}
                    </span>
                    <span className="flex items-center text-amber-500 text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 mr-1" />
                      {deal.rating}
                    </span>
                  </div>

                  <div className="h-44 bg-[#f8fafb] rounded-2xl flex items-center justify-center p-4 mb-4 relative">
                    <div className="w-20 h-32 bg-gray-900 rounded-2xl border-4 border-gray-700 shadow-md flex flex-col items-center justify-between p-2">
                      <div className="w-6 h-1 bg-gray-600 rounded-full mt-1"></div>
                      <span className="text-[8px] font-black text-teal-400">CERTIFIED</span>
                      <div className="w-2 h-2 rounded-full border border-gray-600 mb-1"></div>
                    </div>
                    <span className="absolute bottom-2 right-2 text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-md font-semibold text-gray-600 shadow-xs">
                      {deal.condition}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-gray-900 line-clamp-1">{deal.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{deal.color}</p>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-black text-gray-900">{deal.price}</span>
                    <span className="text-xs text-gray-400 line-through">{deal.origPrice}</span>
                    <span className="text-xs font-extrabold text-[#2ecc71]">{deal.discount}</span>
                  </div>

                  <p className="text-[11px] font-semibold text-[#128085] mt-2 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {deal.warranty}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex gap-2">
                  <Link 
                    href="/buy" 
                    className="flex-1 bg-[#128085] hover:bg-[#0e6468] text-white text-xs font-bold py-2.5 rounded-xl text-center no-underline transition shadow-xs"
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
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e6f6f6] text-[#128085] flex items-center justify-center mx-auto text-2xl font-bold">
              ⚡
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">Instant Spot Payment</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Payment credited via UPI or Bank Transfer right in front of you before your device is picked up.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e6f6f6] text-[#128085] flex items-center justify-center mx-auto text-2xl font-bold">
              🚚
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">Free Doorstep Pickup</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Book a convenient pickup slot. Our verified executive reaches your location with zero visit fees.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e6f6f6] text-[#128085] flex items-center justify-center mx-auto text-2xl font-bold">
              🛡️
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">100% Data Safety</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Complete military-grade data wipeout guarantee on every smartphone with official certificate.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e6f6f6] text-[#128085] flex items-center justify-center mx-auto text-2xl font-bold">
              🏬
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">200+ Retail Stores</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Visit any nearby Cashify retail store across India for offline diagnostics, buyback, and repairs.</p>
          </div>
        </section>

        {/* FAQs */}
        <section aria-labelledby="faq-title" className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <FAQs />
        </section>

        {/* Closing CTA */}
        <ClosingCta />

      </main>

      {/* City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">Select City</h3>
              <button onClick={() => setShowCityModal(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold">✕</button>
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
                    selectedCity === c ? 'border-[#128085] bg-[#e6f6f6] text-[#128085]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 text-[#128085]" />
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
