'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, MapPin, ChevronDown, User, Smartphone, Laptop, 
  Gamepad2, Camera, Watch, RefreshCw, PenTool, Store, ShoppingBag, 
  ArrowRight, ShieldCheck, Truck, Zap, Star, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import FAQs from '@/components/FAQs';
import ClosingCta from '@/components/home/ClosingCta';

export default function LandingPage() {
  const [selectedCity, setSelectedCity] = useState('Gurgaon');
  const [activeSlide, setActiveSlide] = useState(0);

  const heroBanners = [
    {
      title: "Sell old phone",
      subtitle: "From your doorstep or at any of our 200 stores pan-India",
      ctaText: "Sell Now",
      ctaLink: "/quote",
      bgGradient: "from-[#2ec4b6] via-[#20a39e] to-[#0e7478]",
      badge1: "DOORSTEP PICKUP",
      badge2: "200 STORES PAN INDIA",
      stat: "Instant Cash at Doorstep"
    },
    {
      title: "Buy Refurbished Mobiles",
      subtitle: "32-Point Quality Inspected with 6 to 12 Months Cashify Warranty",
      ctaText: "Shop Now",
      ctaLink: "/buy",
      bgGradient: "from-[#128085] via-[#0e6468] to-[#094649]",
      badge1: "32-POINT CHECK",
      badge2: "1 YEAR WARRANTY",
      stat: "Up to 70% Off Flagships"
    },
    {
      title: "Broken Phone Screen?",
      subtitle: "Doorstep screen & battery repair in 30 minutes with 6 months warranty",
      ctaText: "Book Repair",
      ctaLink: "/repair",
      bgGradient: "from-[#028090] via-[#007f5f] to-[#2b9348]",
      badge1: "GENUINE PARTS",
      badge2: "30-MIN DOORSTEP",
      stat: "Free Doorstep Visit"
    }
  ];

  const services = [
    { name: "Sell Phone", icon: "📱", href: "/quote", badge: "Instant Cash" },
    { name: "Buy Gadgets", icon: "💻", href: "/buy", badge: "Warranty" },
    { name: "Buy Phone", icon: "📱", href: "/buy", badge: "Refurbished" },
    { name: "Buy Laptops", icon: "💻", href: "/buy", badge: "Top Brands" },
    { name: "Rent Devices", icon: "🎮", href: "/buy", badge: "Easy Rent" },
    { name: "Buy Cameras", icon: "📷", href: "/buy", badge: "DSLR & Lens" },
    { name: "Pixel Upgrade", icon: "✨", href: "/quote", badge: "Extra ₹2K" },
    { name: "Gaming Consoles", icon: "🕹️", href: "/buy", badge: "PS5 & Xbox" },
    { name: "Repair Phone", icon: "🛠️", href: "/repair", badge: "Doorstep" },
    { name: "Repair Laptop", icon: "💻", href: "/repair", badge: "In 45 Mins" },
    { name: "Find New Phone", icon: "🔍", href: "/quote", badge: "Compare" },
    { name: "Nearby Stores", icon: "🏬", href: "/stores", badge: "200+ Stores" },
    { name: "Accessories", icon: "🎧", href: "/buy", badge: "Chargers & Buds" },
    { name: "Smartwatches", icon: "⌚", href: "/quote", badge: "Apple & Wear" },
    { name: "Recycle Phone", icon: "♻️", href: "/quote", badge: "Go Green" },
    { name: "Buy Tablets", icon: "📱", href: "/buy", badge: "iPads & Tabs" },
  ];

  const topSellingMobiles = [
    { name: "Apple iPhone 13 (128 GB)", price: "₹34,499", origPrice: "₹59,900", discount: "42% OFF", condition: "Superb", rating: 4.8 },
    { name: "Samsung Galaxy S22 5G", price: "₹26,999", origPrice: "₹72,999", discount: "63% OFF", condition: "Flawless", rating: 4.7 },
    { name: "Apple iPhone 14 Pro", price: "₹68,999", origPrice: "₹1,29,900", discount: "47% OFF", condition: "Flawless", rating: 4.9 },
    { name: "OnePlus 10 Pro 5G", price: "₹23,499", origPrice: "₹66,999", discount: "65% OFF", condition: "Superb", rating: 4.6 }
  ];

  return (
    <div className="w-full bg-[#f4f7f8] text-[#1c252c] min-h-screen">
      
      {/* Sub-Header / Search & Top Bar (Exact Cashify Header) */}
      <div className="bg-white border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Cashify Official Logo */}
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="w-9 h-9 rounded-full bg-[#20a39e] flex items-center justify-center text-white font-black text-xl shadow-sm">
                C
              </div>
              <span className="text-2xl font-black tracking-tight text-[#148387]">
                CASHIFY
              </span>
            </Link>

            {/* Central Search Bar */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for mobiles, accessories & More"
                  className="w-full bg-[#f1f5f7] border border-gray-200 rounded-lg pl-11 pr-4 py-2 text-sm focus:outline-none focus:border-[#20a39e] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Location Selector & User Profile */}
            <div className="flex items-center gap-5 text-sm font-semibold text-gray-700">
              <div className="flex items-center gap-1 cursor-pointer hover:text-[#20a39e]">
                <MapPin className="h-4 w-4 text-[#20a39e]" />
                <span>{selectedCity}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </div>

              <Link href="/auth" className="flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-[#20a39e] no-underline">
                <User className="h-4 w-4 text-gray-500" />
                <span>Login</span>
              </Link>
            </div>

          </div>
        </div>

        {/* Secondary Category Navigation Bar */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 py-2.5 overflow-x-auto no-scrollbar gap-6">
              <span className="flex items-center gap-1 cursor-pointer hover:text-[#20a39e]">All <ChevronDown className="h-3 w-3 text-gray-400" /></span>
              <Link href="/quote" className="hover:text-[#20a39e] flex items-center gap-1 no-underline text-gray-700">Sell Phone <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/quote" className="hover:text-[#20a39e] flex items-center gap-1 no-underline text-gray-700">Sell Gadgets <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/buy" className="hover:text-[#20a39e] flex items-center gap-1 no-underline text-gray-700">Buy Refurbished Devices <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/quote" className="hover:text-[#20a39e] flex items-center gap-1 no-underline text-gray-700">Find New Gadget <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/buy" className="hover:text-[#20a39e] flex items-center gap-1 no-underline text-gray-700">Buy Laptop <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <Link href="/stores" className="hover:text-[#20a39e] flex items-center gap-1 no-underline text-gray-700">Cashify Store <ChevronDown className="h-3 w-3 text-gray-400" /></Link>
              <span className="hover:text-[#20a39e] flex items-center gap-1 cursor-pointer">More <ChevronDown className="h-3 w-3 text-gray-400" /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Exact Hero Slider Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg transition-all duration-500">
          <div className={`bg-gradient-to-r ${heroBanners[activeSlide].bgGradient} p-8 sm:p-12 text-white min-h-[300px] sm:min-h-[340px] flex items-center justify-between relative`}>
            
            {/* Left Texts */}
            <div className="max-w-xl space-y-4 z-10">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {heroBanners[activeSlide].title}
              </h1>
              <p className="text-sm sm:text-lg text-teal-50 max-w-md font-medium leading-relaxed">
                {heroBanners[activeSlide].subtitle}
              </p>
              
              <div className="pt-2">
                <Link
                  href={heroBanners[activeSlide].ctaLink}
                  className="inline-flex items-center gap-2 bg-white text-[#128085] hover:bg-teal-50 font-black text-sm px-7 py-3 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 no-underline"
                >
                  {heroBanners[activeSlide].ctaText}
                  <ArrowRight className="h-4 w-4 stroke-[3]" />
                </Link>
              </div>
            </div>

            {/* Right Graphic Mockup */}
            <div className="hidden lg:flex items-center gap-6 z-10 pr-6">
              <div className="w-56 h-72 bg-gray-900 rounded-3xl border-4 border-gray-700 shadow-2xl p-4 flex flex-col justify-between text-white relative">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="bg-[#20a39e] text-white px-2 py-0.5 rounded-full">{heroBanners[activeSlide].badge1}</span>
                  <span className="text-teal-300">verified</span>
                </div>
                <div className="text-center my-auto">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 text-2xl">
                    📱
                  </div>
                  <h4 className="font-extrabold text-sm">{heroBanners[activeSlide].stat}</h4>
                  <p className="text-[10px] text-teal-200 mt-1">UPI in 60 seconds</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2 text-center text-[10px] font-bold">
                  {heroBanners[activeSlide].badge2}
                </div>
              </div>
            </div>

            {/* Controls */}
            <button
              onClick={() => setActiveSlide((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow-md transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev === heroBanners.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow-md transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {heroBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${activeSlide === i ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                />
              ))}
            </div>

          </div>
        </div>

        {/* Our Services Section (Exact 2-Row Grid from Reference) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Our Services</h2>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {services.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="group flex flex-col items-center text-center p-3 rounded-2xl border border-gray-100 bg-[#f7fafb] hover:bg-[#ebf6f6] hover:border-[#20a39e]/40 hover:shadow-sm transition-all no-underline"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-gray-800 mt-2.5 group-hover:text-[#148387] line-clamp-1">
                  {item.name}
                </span>
                <span className="text-[9px] font-semibold text-[#20a39e] mt-0.5 line-clamp-1">
                  {item.badge}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Selling Mobiles (Refurbished Storefront) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Buy Refurbished Mobiles</h2>
              <p className="text-xs text-gray-500 mt-1">32-point inspection • 6 Months Warranty • 7-day replacement</p>
            </div>
            <Link href="/buy" className="text-xs font-bold text-[#20a39e] hover:text-[#148387] flex items-center gap-1 no-underline">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topSellingMobiles.map((item, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 hover:border-[#20a39e] hover:shadow-md transition p-4 bg-white flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-2 font-bold">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{item.condition}</span>
                    <span className="flex items-center text-amber-500 font-semibold"><Star className="h-3 w-3 fill-amber-400 mr-0.5" /> {item.rating}</span>
                  </div>
                  <div className="h-36 bg-[#f7fafb] rounded-xl flex items-center justify-center text-4xl mb-3">
                    📱
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{item.name}</h4>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-black text-gray-900">{item.price}</span>
                    <span className="text-xs text-gray-400 line-through">{item.origPrice}</span>
                    <span className="text-xs font-bold text-emerald-600">{item.discount}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                  <Link href="/buy" className="flex-1 bg-[#20a39e] hover:bg-[#148387] text-white text-xs font-bold py-2 rounded-xl text-center no-underline transition">
                    Buy Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Cashify 4-Card Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#e6f6f6] text-[#20a39e] flex items-center justify-center mx-auto text-xl font-bold">
              ⚡
            </div>
            <h4 className="font-bold text-sm text-gray-900">Instant Spot Payment</h4>
            <p className="text-xs text-gray-500">Instant transfer via UPI or Cash right at your doorstep before pickup.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#e6f6f6] text-[#20a39e] flex items-center justify-center mx-auto text-xl font-bold">
              🚚
            </div>
            <h4 className="font-bold text-sm text-gray-900">Free Doorstep Pickup</h4>
            <p className="text-xs text-gray-500">Pickups scheduled in 60 minutes across India with verified executives.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#e6f6f6] text-[#20a39e] flex items-center justify-center mx-auto text-xl font-bold">
              🛡️
            </div>
            <h4 className="font-bold text-sm text-gray-900">100% Data Safety</h4>
            <p className="text-xs text-gray-500">Certified military-grade data wipe guarantee with invoice certification.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#e6f6f6] text-[#20a39e] flex items-center justify-center mx-auto text-xl font-bold">
              🏬
            </div>
            <h4 className="font-bold text-sm text-gray-900">200+ Retail Stores</h4>
            <p className="text-xs text-gray-500">Walk into any nearby Cashify store for walk-in checks and spot deals.</p>
          </div>
        </section>

        {/* FAQs */}
        <section aria-labelledby="faq-title" className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <FAQs />
        </section>

        {/* Closing CTA */}
        <ClosingCta />

      </div>
    </div>
  );
}
