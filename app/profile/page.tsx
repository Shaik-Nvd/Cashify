'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useHydratedAuth } from '@/lib/useHydratedAuth';
import { api } from '@/lib/api';
import { 
  Package, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Sparkles,
  PhoneCall,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface PickupLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  brand: string;
  model: string;
  storage?: string;
  quotedPrice?: number;
  finalPrice?: number;
  pickupDate?: string;
  pickupTime?: string;
  address?: string;
  city?: string;
  pincode?: string;
  status: string;
  paymentMode?: string;
  createdAt: string;
  updatedAt: string;
}

const ORDER_STAGES = [
  { key: 'scheduled', label: 'Pickup Scheduled', icon: Calendar },
  { key: 'assigned', label: 'Executive Assigned', icon: PhoneCall },
  { key: 'out_for_pickup', label: 'Out for Pickup', icon: Truck },
  { key: 'completed', label: 'Verified & Paid', icon: CheckCircle2 },
];

function getStageProgress(status: string) {
  const norm = (status || '').toLowerCase();
  if (norm === 'cancelled' || norm === 'dropped' || norm === 'rejected') {
    return { stepIndex: -1, isCancelled: true, label: 'Cancelled' };
  }
  if (norm === 'completed' || norm === 'paid' || norm === 'sold') {
    return { stepIndex: 3, isCancelled: false, label: 'Completed' };
  }
  if (norm.includes('out') || norm.includes('transit') || norm.includes('verified')) {
    return { stepIndex: 2, isCancelled: false, label: 'Out for Pickup' };
  }
  if (norm === 'processing' || norm.includes('follow') || norm.includes('assigned') || norm.includes('contacted')) {
    return { stepIndex: 1, isCancelled: false, label: 'Processing' };
  }
  // Default: Pending / Scheduled / Price checked
  return { stepIndex: 0, isCancelled: false, label: 'Pickup Scheduled' };
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justScheduled = searchParams?.get('scheduled') === 'true';

  const { hydrated, isAuthenticated, user, loginAt, logout } = useHydratedAuth();
  const [durationStr, setDurationStr] = useState<string | null>(null);
  const [pickups, setPickups] = useState<PickupLead[]>([]);
  const [loadingPickups, setLoadingPickups] = useState(true);

  useEffect(() => {
    if (!loginAt) return;
    const updateDuration = () => {
      const diff = Date.now() - loginAt;
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) setDurationStr(`${days}d ${hours % 24}h`);
      else if (hours > 0) setDurationStr(`${hours}h ${mins % 60}m`);
      else setDurationStr(`${mins}m`);
    };
    updateDuration();
    const interval = setInterval(updateDuration, 60000);
    return () => clearInterval(interval);
  }, [loginAt]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    // Fetch user's scheduled pickups
    api.get('/api/quote/my-pickups')
      .then((res: any) => {
        const payload = res?.data?.data || res?.data || res;
        if (Array.isArray(payload)) {
          setPickups(payload);
        } else if (payload && Array.isArray(payload.pickups)) {
          setPickups(payload.pickups);
        } else {
          setPickups([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load user pickups:', err);
      })
      .finally(() => {
        setLoadingPickups(false);
      });
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '48rem', margin: '0 auto', minHeight: '80vh' }}>
      
      {/* Just Scheduled Banner */}
      {justScheduled && (
        <div className="mb-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 sm:p-5 text-foreground flex items-start gap-3 shadow-lg">
          <Sparkles className="w-6 h-6 text-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gold text-base sm:text-lg">🎉 Pickup Scheduled Successfully!</h3>
            <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
              Your pickup order is confirmed. Our doorstep inspection executive will contact you before arriving at your chosen time slot.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Profile & Pickups</h1>
          <div className="flex items-center gap-2 mt-1">
            {user?.name && <span className="font-semibold text-foreground">{user.name}</span>}
            <span className="text-muted text-sm">{user?.phone || 'Verified User'}</span>
            {user?.role === 'admin' && (
              <span className="bg-gold/20 text-gold text-[11px] font-bold px-2 py-0.5 rounded-full border border-gold/40">Admin</span>
            )}
          </div>
          {durationStr && <p className="text-xs text-muted mt-1">Logged in for: {durationStr}</p>}
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-all no-underline"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Panel
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-danger border border-danger/30 bg-danger/5 hover:bg-danger/10 transition-all"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Scheduled Pickups Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-bold">Scheduled Doorstep Pickups</h2>
          </div>
          <Link
            href="/quote"
            className="text-xs font-semibold text-gold hover:text-gold-hover inline-flex items-center gap-1 no-underline"
          >
            Sell another device <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingPickups ? (
          <div className="p-8 text-center rounded-2xl border border-border bg-surface/50 text-muted animate-pulse">
            Loading your scheduled pickups...
          </div>
        ) : pickups.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface/30">
            <Package className="w-10 h-10 mx-auto text-muted mb-2 stroke-[1.5]" />
            <p className="font-semibold text-foreground">No pickups scheduled yet</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Get an instant quote and book free doorstep evaluation with instant spot payment.
            </p>
            <Link
              href="/quote"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-semibold text-xs shadow-md hover:bg-gold-hover transition-all no-underline"
            >
              Sell Your Device Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {pickups.map((pickup) => {
              const progress = getStageProgress(pickup.status);
              const price = pickup.finalPrice || pickup.quotedPrice || 0;

              return (
                <div 
                  key={pickup.id} 
                  className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm hover:border-gold/30 transition-all"
                >
                  {/* Top Header of Card */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base sm:text-lg text-foreground">
                          {pickup.brand} {pickup.model}
                        </h3>
                        {pickup.storage && (
                          <span className="text-xs bg-surface-raised px-2 py-0.5 rounded-md font-medium text-muted border border-border">
                            {pickup.storage}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Booked on {new Date(pickup.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-muted">Estimated Payout</div>
                      <div className="text-lg sm:text-xl font-bold text-gold">
                        ₹{price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  {!progress.isCancelled ? (
                    <div className="py-6">
                      <div className="grid grid-cols-4 gap-2 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-6 right-6 h-0.5 bg-border -z-0" />
                        <div 
                          className="absolute top-4 left-6 h-0.5 bg-gold -z-0 transition-all duration-500" 
                          style={{ width: `${Math.min(100, (progress.stepIndex / (ORDER_STAGES.length - 1)) * 100)}%` }} 
                        />

                        {ORDER_STAGES.map((stage, idx) => {
                          const isDone = idx <= progress.stepIndex;
                          const isCurrent = idx === progress.stepIndex;
                          const IconComp = stage.icon;

                          return (
                            <div key={stage.key} className="flex flex-col items-center text-center z-10">
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone 
                                    ? 'bg-gold text-on-gold ring-4 ring-gold/20' 
                                    : 'bg-surface-raised border border-border text-muted'
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <span className={`text-[11px] sm:text-xs mt-2 font-medium ${isCurrent ? 'text-gold font-bold' : isDone ? 'text-foreground' : 'text-muted'}`}>
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 my-2 px-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-2 text-danger text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      This scheduled pickup was cancelled.
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs bg-surface-raised/40 p-3.5 rounded-xl border border-border/40">
                    <div className="flex items-start gap-2 text-foreground/80">
                      <Calendar className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-foreground">Pickup Schedule</span>
                        <span>{pickup.pickupDate || 'Earliest Slot'} {pickup.pickupTime ? `(${pickup.pickupTime})` : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-foreground/80">
                      <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-foreground">Pickup Location</span>
                        <span className="line-clamp-2">
                          {[pickup.address, pickup.city, pickup.pincode].filter(Boolean).join(', ') || 'Doorstep Pickup'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Helper */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                    <span className="text-muted">
                      Status: <strong className="text-foreground capitalize">{progress.label}</strong>
                    </span>
                    <span className="text-muted text-[11px]">
                      Payment Mode: <strong className="text-foreground capitalize">{pickup.paymentMode || 'Instant Bank / UPI'}</strong>
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
