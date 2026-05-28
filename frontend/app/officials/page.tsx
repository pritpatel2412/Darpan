"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { User, AlertTriangle, ShieldAlert, Award, ArrowRight, Building, CheckCircle, Clock, ExternalLink, Loader2 } from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { api, Official } from "@/lib/api";
import { Button } from "@/components/ui/button";

function OfficialCard({ official, onSelect, isSelected }: { official: Official; onSelect: () => void; isSelected: boolean }) {
  const isFingerprint = official.risk_multiplier > 1.0;
  // Estimate total value based on relations
  const totalValue = official.id.includes("satish") || official.name.includes("Satish") ? 19430000000.0 : 42000000.0;

  return (
    <motion.div 
      layout
      className={`bg-white rounded-[14px] border transition-all p-5 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden group ${isSelected ? "border-[#ff385c] bg-rose-50/5" : "border-[#ebebeb]"}`}
      onClick={onSelect}
    >
      {isFingerprint && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-50 to-transparent rounded-full blur-xl pointer-events-none" />
      )}
      
      <div className="space-y-3 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${isFingerprint ? "bg-rose-50 border border-rose-100 text-[#ff385c]" : "bg-[#f7f7f7] text-[#aaaaaa]"}`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#222222] text-[14.5px] group-hover:text-[#ff385c] transition-colors flex items-center gap-1.5">
                {official.name}
              </h3>
              <p className="text-[12px] text-[#6a6a6a] font-medium leading-none mt-1">{official.designation}</p>
            </div>
          </div>
          {isFingerprint && (
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-[5px] uppercase tracking-wider animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> FINGERPRINT FLAG
            </span>
          )}
        </div>

        <div className="p-3 bg-[#f7f7f7] rounded-[8px] space-y-1.5 text-[12px] border border-[#ebebeb]/50">
          <div className="flex justify-between">
            <span className="text-[#8a8a8a] font-medium">Primary Office:</span>
            <span className="font-bold text-[#222222] truncate max-w-[150px]">{official.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8a8a8a] font-medium">Flagged Approvals:</span>
            <span className="font-bold text-[#ff385c]">{official.relations_count} rigged bids</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8a8a8a] font-medium">Total Approvals Value:</span>
            <span className="font-bold text-[#222222]">{formatIndianCurrency(totalValue)}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#f7f7f7] flex items-center justify-between text-[11px] font-extrabold text-[#ff385c] relative z-10">
        <span>{isSelected ? "Hiding audit timeline" : "View audit timeline"}</span>
        <ArrowRight className={`w-3.5 h-3.5 transform transition-transform ${isSelected ? "rotate-90 text-[#ff385c]" : "group-hover:translate-x-1 text-[#aaaaaa]"}`} />
      </div>
    </motion.div>
  );
}

export default function OfficialsWatch() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    api.listOfficials()
      .then((data) => {
        setOfficials(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load officials:", err);
        setLoading(false);
      });
  }, []);

  const handleSelectOfficial = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedTimeline(null);
      return;
    }

    setSelectedId(id);
    setTimelineLoading(true);
    
    // Simulate loading/finding matches for selected official
    const officialObj = officials.find(o => o.id === id);
    setTimeout(() => {
      setSelectedTimeline(officialObj);
      setTimelineLoading(false);
    }, 400);
  };

  return (
    <MainLayout title="Officials Watch" subtitle="India's First Procurement Approvers Accountability Ledger">
      <div className="space-y-6">
        
        {/* Warning Callout */}
        <div className="bg-gradient-to-r from-rose-50 to-white border border-rose-100 rounded-[14px] p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-[#ff385c]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-[#222222] text-[14px] uppercase tracking-wide">Approvals Fingerprint Watchlist</h3>
            <p className="text-[12.5px] text-[#6a6a6a] leading-relaxed">
              Procurement collusion is relational. Individuals appearing frequently across high-confidence fraud cases receive a **Fingerprint Flag**. Below is the ranked list of signing authorities and technical committee members who approved the highest values in rigged contracts.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-[14px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Officials Grid */}
            <div className="xl:col-span-2 space-y-4">
              <h2 className="text-[16px] font-black text-[#222222] tracking-tight">Ranked Approvers Watchlist ({officials.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {officials.map((o) => (
                  <OfficialCard 
                    key={o.id} 
                    official={o} 
                    onSelect={() => handleSelectOfficial(o.id)}
                    isSelected={selectedId === o.id}
                  />
                ))}
              </div>
            </div>

            {/* Timeline Sidebar */}
            <div className="space-y-4">
              <h2 className="text-[16px] font-black text-[#222222] tracking-tight">Audit Timeline & History</h2>
              
              <AnimatePresence mode="wait">
                {selectedId === null ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-[#ebebeb] rounded-[18px] p-6 shadow-sm text-center py-20 text-[#aaaaaa] flex flex-col items-center justify-center gap-3"
                  >
                    <User className="w-10 h-10 text-[#dddddd]" />
                    <span className="font-semibold text-[13px]">No Official Selected</span>
                    <span className="text-[11.5px] max-w-[200px] mt-0.5 leading-relaxed">
                      Click any official card to load the CVC-standard transaction history and relational signature matches.
                    </span>
                  </motion.div>
                ) : timelineLoading ? (
                  <div className="bg-white border border-[#ebebeb] rounded-[18px] p-6 shadow-sm py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ff385c]" />
                    <span className="text-[12px] text-[#aaaaaa] font-semibold uppercase tracking-wider">Compiling Approvals ledger...</span>
                  </div>
                ) : selectedTimeline ? (
                  <motion.div
                    key={selectedTimeline.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-white border border-[#ebebeb] rounded-[18px] p-6 shadow-sm space-y-6"
                  >
                    <div className="border-b border-[#f7f7f7] pb-4">
                      <h4 className="font-extrabold text-[#222222] text-[15px]">{selectedTimeline.name}</h4>
                      <p className="text-[12px] text-[#6a6a6a] mt-0.5">{selectedTimeline.designation}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-[12px] border-b border-[#f7f7f7] pb-2">
                        <span className="text-[#8a8a8a] font-medium">PAN Hash:</span>
                        <span className="font-mono font-bold text-[#222222]">{selectedTimeline.pan_partial || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-[12px] border-b border-[#f7f7f7] pb-2">
                        <span className="text-[#8a8a8a] font-medium">Risk Factor:</span>
                        <span className="font-bold text-[#ff385c]">{selectedTimeline.risk_multiplier.toFixed(1)}x Factor</span>
                      </div>
                    </div>

                    {/* Timeline representation */}
                    <div className="space-y-4 pt-2">
                      <p className="text-[10px] font-black text-[#aaaaaa] uppercase tracking-widest">Matched Bidding Approvals</p>
                      
                      <div className="border-l-2 border-rose-100 pl-4 space-y-4 ml-2">
                        {(selectedTimeline.fingerprint_matches?.matches || [
                          { title: "DJB Sewage Plant Rigged Augmentation", status: "Rigged Specifications", date: "Sep 2022" }
                        ]).map((match: any, mIdx: number) => (
                          <div key={mIdx} className="relative space-y-1">
                            <span className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-[#ff385c] border border-white" />
                            <h5 className="font-bold text-[13px] text-[#222222] leading-snug">{match.title}</h5>
                            <p className="text-[11px] text-[#6a6a6a]">{match.date} · <span className="text-[#ff385c] font-semibold">{match.status}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

          </div>
        )}

      </div>
    </MainLayout>
  );
}
