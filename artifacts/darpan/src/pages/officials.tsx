import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { User, AlertTriangle, ShieldAlert, Award, ArrowRight, Building, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { FraudScoreBadge } from "@/components/ui/fraud-badge";
import { motion, AnimatePresence } from "framer-motion";

function OfficialCard({ official, onSelect, isSelected }: { official: any; onSelect: () => void; isSelected: boolean }) {
  const isFingerprint = official.fingerprintFlag;

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
            <span className="font-bold text-[#ff385c]">{official.flaggedCount} rigged bids</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8a8a8a] font-medium">Total Approvals Value:</span>
            <span className="font-bold text-[#222222]">{formatIndianCurrency(parseFloat(official.totalFlaggedValue))}</span>
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
  const [officials, setOfficials] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    fetch("/api/officials")
      .then((res) => res.json())
      .then((data) => {
        setOfficials(data.officials || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelectOfficial = (id: number) => {
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedTimeline(null);
      return;
    }

    setSelectedId(id);
    setTimelineLoading(true);
    fetch(`/api/officials/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedTimeline(data);
        setTimelineLoading(false);
      })
      .catch(() => setTimelineLoading(false));
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
              Procurement collusion is relational. Individuals appearing frequently across high-confidence fraud cases receive a <strong className="text-rose-600 font-bold">Fingerprint Flag</strong>. Below is the ranked list of signing authorities and technical committee members who approved the highest values in rigged contracts.
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
                    className="bg-white border border-dashed border-[#ebebeb] rounded-[14px] p-8 text-center text-[#aaaaaa] text-[13px] flex flex-col items-center justify-center h-[350px]"
                  >
                    <User className="w-12 h-12 mb-3 text-[#dddddd]" />
                    Select any government official from the watchlist to reveal their procurement approvals timeline, fraud signals, and RTI statuses.
                  </motion.div>
                ) : timelineLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-[#ebebeb] rounded-[14px] p-6 space-y-4"
                  >
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </motion.div>
                ) : selectedTimeline ? (
                  <motion.div 
                    key="timeline"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-white border border-[#ebebeb] rounded-[14px] p-6 shadow-sm space-y-5"
                  >
                    <div className="border-b border-[#f7f7f7] pb-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#ff385c]" />
                        <h3 className="font-extrabold text-[#222222] text-[14.5px]">{selectedTimeline.official.name}</h3>
                      </div>
                      <p className="text-[12px] text-[#6a6a6a] mt-1">Timeline of suspicious approval decisions</p>
                    </div>

                    <div className="relative border-l border-[#ebebeb] pl-4 ml-1 space-y-6">
                      {selectedTimeline.tenders?.map((t: any, idx: number) => (
                        <div key={t.id} className="relative space-y-2 group">
                          {/* Timeline node */}
                          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-white bg-[#ff385c] group-hover:scale-125 transition-transform" />
                          
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-[#aaaaaa]">{t.tenderId}</span>
                            <FraudScoreBadge score={t.fraudScore} />
                          </div>

                          <h4 className="font-bold text-[#222222] text-[12.5px] leading-snug line-clamp-2">
                            {t.title}
                          </h4>

                          <div className="p-2 bg-[#f7f7f7] rounded-[6px] border border-[#ebebeb]/50 text-[11px] space-y-1">
                            <div className="flex justify-between">
                              <span className="text-[#8a8a8a] font-medium">Department:</span>
                              <span className="font-bold text-[#222222]">{t.department}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#8a8a8a] font-medium">Contract Value:</span>
                              <span className="font-bold text-[#222222]">{formatIndianCurrency(t.contractValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#8a8a8a] font-medium">Official Role:</span>
                              <span className="font-mono font-bold text-rose-600 capitalize">{t.role}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#8a8a8a] font-medium">RTI Status:</span>
                              <span className={`font-semibold capitalize ${t.rtiStatus ? "text-[#10b981]" : "text-[#aaaaaa]"}`}>
                                {t.rtiStatus || "Not Filed"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedTimeline.official.fingerprintFlag && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-[10px] text-[12px] text-rose-700 font-medium flex gap-2">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[10px] text-rose-800">Escalation Required</p>
                          <p className="mt-0.5 leading-relaxed">
                            Official has approved 3+ suspicious tenders. Preemptive CVC warning is dispatched under GFR guidelines.
                          </p>
                        </div>
                      </div>
                    )}
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
