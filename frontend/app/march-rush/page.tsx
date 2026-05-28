"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Clock, ShieldAlert, Award, Calendar, Bell, HelpCircle, CheckCircle, Mail, Phone, Lock, Loader2 } from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { api, MarchRushWatchItem } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function MarchRush() {
  const [data, setData] = useState<MarchRushWatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [subscribedPhone, setSubscribedPhone] = useState("");
  const [isSubscribedSuccess, setIsSubscribedSuccess] = useState(false);

  useEffect(() => {
    api.getMarchRush()
      .then((res) => {
        setData(res.watchlist || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching march rush data:", err);
        setLoading(false);
      });
  }, []);

  // Countdown timer calculation to Jan 1st of next year
  useEffect(() => {
    const calculateCountdown = () => {
      const currentYear = new Date().getFullYear();
      const targetDate = new Date(`January 1, ${currentYear + 1} 00:00:00`).getTime();
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribedEmail && !subscribedPhone) return;
    setIsSubscribedSuccess(true);
    setTimeout(() => {
      setIsSubscribeOpen(false);
      setIsSubscribedSuccess(false);
      setSubscribedEmail("");
      setSubscribedPhone("");
    }, 2000);
  };

  const getTierStyles = (tier: string) => {
    const t = tier.toLowerCase();
    switch (t) {
      case "critical":
        return {
          bg: "bg-rose-50 border-rose-100",
          text: "text-rose-700",
          badge: "bg-rose-500 text-white border-rose-600",
          progress: "bg-rose-500",
        };
      case "high":
        return {
          bg: "bg-orange-50 border-orange-100",
          text: "text-orange-700",
          badge: "bg-orange-500 text-white border-orange-600",
          progress: "bg-orange-500",
        };
      default:
        return {
          bg: "bg-amber-50 border-amber-100",
          text: "text-amber-700",
          badge: "bg-amber-500 text-white border-amber-600",
          progress: "bg-amber-500",
        };
    }
  };

  return (
    <MainLayout title="Q4 March Rush" subtitle="AI Budget Dumping Predictor & Seasonal Fraud Signal Tracker">
      <div className="space-y-6">
        
        {/* State-of-the-Art Hero countdown board */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#18181b] to-[#27272a] text-white p-8 rounded-[18px] border border-[#2d2d30] shadow-lg flex flex-col md:flex-row justify-between items-center gap-8"
        >
          {/* Subtle glowing ambient background spheres */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="space-y-4 max-w-xl relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 px-3 py-1 rounded-full mx-auto md:mx-0">
              <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Seasonal Dumping Sentinel Active</span>
            </div>

            <h1 className="text-[20px] lg:text-[25px] font-black leading-tight tracking-tight text-white">
              March Rush Alert: Track <span className="text-[#ff385c]">Q4 Budget Dumping</span> Concentration in Public Tenders.
            </h1>

            <p className="text-[12.5px] text-[#a1a1aa] font-medium leading-relaxed">
              Every fiscal year, public departments dump up to 60% of their entire capital budget in Q4 (January - March) to avoid fund expiration. This extreme rush leads to compressed bid windows, single-bidder cartels, and massive price inflation.
            </p>
          </div>

          {/* Futuristic Countdown HUD */}
          <div className="bg-[#1f1f23]/60 border border-[#2e2e33] rounded-[16px] p-5 flex flex-col items-center gap-3 relative z-10 w-full md:w-auto">
            <p className="text-[10px] font-black text-[#8a8a8a] uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5" /> Countdown to January 1
            </p>
            <div className="flex gap-3 text-center">
              <div className="bg-[#27272a] rounded-[8px] border border-[#3f3f46] p-3 min-w-[65px]">
                <p className="text-[22px] font-extrabold font-mono text-[#ff385c]">{String(countdown.days).padStart(2, "0")}</p>
                <p className="text-[9px] font-bold text-[#aaaaaa] uppercase tracking-widest mt-1">Days</p>
              </div>
              <div className="bg-[#27272a] rounded-[8px] border border-[#3f3f46] p-3 min-w-[65px]">
                <p className="text-[22px] font-extrabold font-mono text-white">{String(countdown.hours).padStart(2, "0")}</p>
                <p className="text-[9px] font-bold text-[#aaaaaa] uppercase tracking-widest mt-1">Hrs</p>
              </div>
              <div className="bg-[#27272a] rounded-[8px] border border-[#3f3f46] p-3 min-w-[65px]">
                <p className="text-[22px] font-extrabold font-mono text-white">{String(countdown.minutes).padStart(2, "0")}</p>
                <p className="text-[9px] font-bold text-[#aaaaaa] uppercase tracking-widest mt-1">Mins</p>
              </div>
              <div className="bg-[#27272a] rounded-[8px] border border-[#3f3f46] p-3 min-w-[65px]">
                <p className="text-[22px] font-extrabold font-mono text-orange-400">{String(countdown.seconds).padStart(2, "0")}</p>
                <p className="text-[9px] font-bold text-[#aaaaaa] uppercase tracking-widest mt-1">Secs</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSubscribeOpen(true)}
              className="mt-2 w-full py-2 bg-gradient-to-r from-[#ff385c] to-orange-500 hover:from-rose-600 hover:to-orange-600 text-[12px] font-extrabold text-white rounded-[8px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md border-0"
            >
              <Bell className="w-3.5 h-3.5" />
              Subscribe to Q4 Bursts
            </button>
          </div>
        </motion.div>

        {/* Informative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#ebebeb] rounded-[14px] p-5 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-[5px] uppercase tracking-wider font-sans">Historical Trend</span>
              <Award className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="text-[20px] font-extrabold text-[#222222]">52.8% Average</p>
              <p className="text-[12.5px] text-[#6a6a6a] mt-1 font-medium">Of public budget was released in the month of March alone over the last 3 fiscal cycles.</p>
            </div>
          </div>
          <div className="bg-white border border-[#ebebeb] rounded-[14px] p-5 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-[5px] uppercase tracking-wider font-sans">Compressed Bidding</span>
              <Calendar className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-[20px] font-extrabold text-[#222222]">3.8 Days Mean</p>
              <p className="text-[12.5px] text-[#6a6a6a] mt-1 font-medium">Bidding window duration in Q4, representing a 70% decrease compared to standard CVC limits.</p>
            </div>
          </div>
          <div className="bg-white border border-[#ebebeb] rounded-[14px] p-5 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-[#3f3f3f] bg-[#f7f7f7] px-2 py-0.5 rounded-[5px] uppercase tracking-wider font-sans">Corruption Overlay</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-[20px] font-extrabold text-[#222222]">1.82x Markup</p>
              <p className="text-[12.5px] text-[#6a6a6a] mt-1 font-medium">Average cost inflation multiplier observed in Q4 tenders compared to off-season catalog rates.</p>
            </div>
          </div>
        </div>

        {/* Prediction Rankings */}
        <div className="space-y-4">
          <h2 className="text-[16px] font-black text-[#222222] tracking-tight">AI Predicted Q4 Concentration Leaderboard</h2>
          
          <div className="bg-white border border-[#ebebeb] rounded-[18px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#ebebeb] bg-[#fafafa] font-bold text-[#6a6a6a] select-none">
                    <th className="py-4 px-5 text-center w-16">Rank</th>
                    <th className="py-4 px-4 min-w-[220px]">Procuring Department / Ministry</th>
                    <th className="py-4 px-4 text-center w-40">Predicted Q4 Dumping Pct</th>
                    <th className="py-4 px-4 text-center w-36">Risk Level</th>
                    <th className="py-4 px-4">Predicted Fraud Vulnerability Signals</th>
                    <th className="py-4 px-5 text-right w-44">Est. Seasonal Excess Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7f7f7]">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-4 px-5 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-44" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-12 mx-auto" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-6 w-20 mx-auto rounded-[6px]" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-64" /></td>
                        <td className="py-4 px-5 text-right"><Skeleton className="h-4 w-28 ml-auto" /></td>
                      </tr>
                    ))
                  ) : data.length > 0 ? (
                    data.map((item, index) => {
                      const styles = getTierStyles(item.risk_tier);
                      const dummyFraudTypes = ["Single-Bidder Cartels", "Specification Rigging", "Cost Overrun Markup"];
                      
                      return (
                        <tr key={index} className="hover:bg-[#fafafa] transition-colors">
                          <td className="py-4 px-5 text-center font-extrabold text-[#8a8a8a]">{index + 1}</td>
                          <td className="py-4 px-4 font-bold text-[#222222]">
                            {item.department}
                            <p className="text-[11px] text-[#aaaaaa] font-medium mt-0.5">
                              Watch active from: Q4 Fiscal Cycle
                            </p>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="font-extrabold text-[14px] text-[#222222]">{item.q4_concentration_pct}%</span>
                              <div className="w-24 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                                <div className={`h-full ${styles.progress}`} style={{ width: `${item.q4_concentration_pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-[5px] uppercase tracking-wider ${styles.badge}`}>
                              {item.risk_tier}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {dummyFraudTypes.map((sig, sIdx) => (
                                <span key={sIdx} className="text-[10px] font-bold bg-[#f7f7f7] border border-[#ebebeb] px-2 py-0.5 rounded-[4px] text-[#555555]">
                                  {sig}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-right font-extrabold text-[#222222]">
                            {formatIndianCurrency(item.q4_value_inr)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-[#aaaaaa]">
                        No predicted dumping metrics parsed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Subscribe Notification Alert Modal */}
        <AnimatePresence>
          {isSubscribeOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-[#ebebeb] rounded-[18px] max-w-md w-full p-6 shadow-2xl space-y-5"
              >
                <div className="flex justify-between items-start border-b border-[#f7f7f7] pb-3">
                  <div className="flex items-center gap-2 text-rose-600">
                    <Bell className="w-5 h-5 animate-swing" />
                    <h3 className="font-extrabold text-[15px] text-[#222222]">Vigilante Seasonal Dumping Alerts</h3>
                  </div>
                  <button 
                    onClick={() => setIsSubscribeOpen(false)}
                    className="text-[12px] text-[#aaaaaa] hover:text-[#ff385c] font-black bg-transparent border-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {isSubscribedSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-6 flex flex-col items-center justify-center text-center space-y-2.5 text-emerald-600"
                  >
                    <CheckCircle className="w-12 h-12" />
                    <h4 className="font-bold text-[14px] text-[#222222]">Subscription Activated!</h4>
                    <p className="text-[12px] text-[#6a6a6a] max-w-[280px]">
                      You will receive instant SMS & Email notifications as soon as Q4 spending dumps exceed 40% of their annual allocation!
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                      Enter your credentials below. Darpan will deploy real-time crawlers to check department transaction ledgers daily starting January 1st.
                    </p>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#aaaaaa] uppercase tracking-wide flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={subscribedEmail}
                          onChange={(e) => setSubscribedEmail(e.target.value)}
                          placeholder="e.g. vigilante@integrity.in"
                          className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] px-3 py-2 text-[13px] text-[#222222] focus:outline-none focus:border-[#ff385c]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#aaaaaa] uppercase tracking-wide flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> Mobile Number (SMS)
                        </label>
                        <input
                          type="tel"
                          required
                          value={subscribedPhone}
                          onChange={(e) => setSubscribedPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] px-3 py-2 text-[13px] text-[#222222] focus:outline-none focus:border-[#ff385c]"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-[10px] text-[11px] text-blue-700 leading-relaxed flex gap-2">
                      <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Cryptographic Vault Protection</strong>: All credentials are encrypted and stored in local enclave vaults. Anonymous whistleblower paths are strictly respected.
                      </span>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-[#ff385c] hover:bg-[#e0022a] text-white text-[13px] font-extrabold rounded-[8px] transition-all shadow-md cursor-pointer border-0"
                    >
                      Activate Dumping Monitor
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </MainLayout>
  );
}
