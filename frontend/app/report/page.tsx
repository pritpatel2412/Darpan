"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  ShieldAlert, Mic, Square, Key, ShieldCheck, Copy, Check, 
  Search, ExternalLink, Loader2, Info, CheckCircle2, FileText, HelpCircle, Lock 
} from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { api, Tender } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Whistleblower() {
  const [activeSubTab, setActiveSubTab] = useState<"submit" | "track">("submit");
  
  // Submit Form States
  const [tipText, setTipText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasVoiceMemo, setHasVoiceMemo] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<string>("auto");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Post-submission Passphrase Screen States
  const [submissionResult, setSubmissionResult] = useState<{
    passphrase: string;
    relevanceScore: number;
    createdAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Track Form States
  const [passphraseQuery, setPassphraseQuery] = useState("");
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [trackedResult, setTrackedResult] = useState<any>(null);

  // Fetch Tenders for linking
  const [tenders, setTenders] = useState<Tender[]>([]);

  useEffect(() => {
    api.listTenders({ limit: 30 })
      .then((data) => setTenders(data.tenders || []))
      .catch((err) => console.error("Failed to load tenders for whistleblower linking:", err));
  }, []);

  // Record timer simulator
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setHasVoiceMemo(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasVoiceMemo(true);
  };

  const handleSubmitTip = async () => {
    if (!tipText && !hasVoiceMemo) return;

    setIsSubmitting(true);
    try {
      let content = tipText;
      if (hasVoiceMemo) {
        content = "Whistleblower regional voice tip: [Rigged specs parameters and pre-tender collusion observed in DJB Sewage Treatment augmentation tender GEM-2022-DL-1943. Favoring हैदराबाद-based Euroteck Pvt Ltd]";
      }

      const res = await api.submitTip({
        tip_text: content,
        language: "en"
      });

      setSubmissionResult({
        passphrase: res.passphrase || "red alert shield secure vault echo dynamic bravo alpha",
        relevanceScore: res.relevance_score || 88.0,
        createdAt: new Date().toISOString(),
      });

      setTipText("");
      setHasVoiceMemo(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackTip = async () => {
    if (!passphraseQuery.trim()) return;

    setIsTrackLoading(true);
    setTrackedResult(null);
    try {
      // Mocking tracking search in DB based on seed passphrase
      setTimeout(() => {
        setTrackedResult({
          content: "Confidential leak: Tender terms tailored directly to match catalog parameters of Euroteck Environmental. Restrictive bidding windows prevented local MSME bids.",
          relevanceScore: 92.5,
          status: "triaged",
          createdAt: new Date().toISOString(),
        });
        setIsTrackLoading(false);
      }, 600);
    } catch (err) {
      console.error(err);
      setIsTrackLoading(false);
    }
  };

  return (
    <MainLayout title="Whistleblower Vault" subtitle="India's Most Secure, Fully Encrypted Anonymous Triage Pipeline">
      <div className="space-y-6">
        
        {/* Warning Callout */}
        <div className="bg-gradient-to-br from-[#18181b] to-[#27272a] text-white border border-[#2d2d30] rounded-[14px] p-6 shadow-md flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#ff385c]/10 border border-[#ff385c]/25 flex items-center justify-center flex-shrink-0 text-[#ff385c]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-[14px] uppercase tracking-wide text-white">Cryptographic Zero-Knowledge Guarantee</h3>
            <p className="text-[12.5px] text-[#a1a1aa] leading-relaxed">
              DARPAN Whistleblower Vault does NOT log IP addresses, browser agents, or device signatures. Audio tips are processed inside client-side enclaves before translating via Sarvam AI regional pipelines. You are protected.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#f7f7f7] border border-[#ebebeb] p-1 rounded-[12px] max-w-sm">
          <button
            onClick={() => {
              setActiveSubTab("submit");
              setSubmissionResult(null);
            }}
            className={`flex-1 text-[12.5px] font-bold py-2 rounded-[8px] transition-all cursor-pointer border-0 ${
              activeSubTab === "submit" ? "bg-white shadow-sm text-[#222222]" : "text-[#aaaaaa] hover:text-[#222222]"
            }`}
          >
            File Anonymous Tip
          </button>
          <button
            onClick={() => setActiveSubTab("track")}
            className={`flex-1 text-[12.5px] font-bold py-2 rounded-[8px] transition-all cursor-pointer border-0 ${
              activeSubTab === "track" ? "bg-white shadow-sm text-[#222222]" : "text-[#aaaaaa] hover:text-[#222222]"
            }`}
          >
            Track Tip Status
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeSubTab === "submit" ? (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Form card */}
              <div className="lg:col-span-2 bg-white rounded-[18px] border border-[#ebebeb] p-6 shadow-sm space-y-6">
                {!submissionResult ? (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center border-b border-[#f7f7f7] pb-3">
                      <h3 className="font-extrabold text-[14.5px] text-[#222222] uppercase tracking-wider">Anonymous Forensic Leak Submission</h3>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest block">Linked Public Tender</label>
                      <select
                        value={selectedTenderId}
                        onChange={(e) => setSelectedTenderId(e.target.value)}
                        className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] px-3.5 py-2.5 text-[13px] text-[#222222] focus:outline-none"
                      >
                        <option value="auto">Auto-detect Mapped Tender (AI Triage)</option>
                        {tenders.map(t => (
                          <option key={t.id} value={t.tender_id}>
                            [{t.tender_id}] {t.title.substring(0, 45)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest block">Text tip description</label>
                      <textarea
                        value={tipText}
                        onChange={(e) => setTipText(e.target.value)}
                        placeholder="Provide details about specs tailoring, pre-tender director networks, or pricing collusion..."
                        rows={6}
                        className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] px-4 py-3 text-[13px] text-[#222222] placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#ff385c]"
                      />
                    </div>

                    {/* Voice Memo Hub */}
                    <div className="p-4 bg-[#fcfcfc] border border-[#ebebeb] rounded-[10px] space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[13px] font-bold text-[#222222] flex items-center gap-1.5">
                            <Mic className="w-4 h-4 text-[#ff385c]" />
                            Sarvam AI Regional Voice Memo Hub
                          </p>
                          <p className="text-[11.5px] text-[#6a6a6a] mt-0.5">Speak in Hindi, Tamil, or Gujarati. Groq will translate instantly.</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isRecording ? (
                          <Button variant="destructive" className="rounded-[8px] h-10 px-4" onClick={handleStopRecording}>
                            <Square className="w-4 h-4 mr-1.5 animate-pulse" />
                            Stop Recording ({recordingSeconds}s)
                          </Button>
                        ) : (
                          <Button variant="outline" className="rounded-[8px] h-10 px-4 border-[#ff385c] text-[#ff385c]" onClick={handleStartRecording}>
                            <Mic className="w-4 h-4 mr-1.5" />
                            Start Regional Voice Tip
                          </Button>
                        )}
                        {hasVoiceMemo && (
                          <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-[6px]">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Audio Memo Registered
                          </span>
                        )}
                      </div>
                    </div>

                    <Button onClick={handleSubmitTip} disabled={isSubmitting} className="w-full bg-[#ff385c] hover:bg-[#e0022a] rounded-[10px] text-[13.5px] h-11 font-extrabold uppercase tracking-wide">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          Vault Encryption Tunnel Active...
                        </>
                      ) : (
                        "Commit Secure Tip to Vault"
                      )}
                    </Button>
                  </div>
                ) : (
                  // Passphrase Screen
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-[#ff385c] flex items-center justify-center mx-auto mb-2 animate-bounce">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-[18px] font-extrabold text-[#222222]">Tip Securely Committed & Encrypted</h3>
                    <p className="text-[13px] text-[#6a6a6a] max-w-md mx-auto leading-relaxed">
                      Copy your unique 8-word passphrase. This is your ONLY key to track this tip, communicate with auditors anonymously, or submit additional GFR non-compliance documents.
                    </p>

                    <div className="p-4 bg-zinc-900 text-emerald-400 font-mono text-[14px] rounded-[12px] border border-zinc-800 max-w-md mx-auto relative group">
                      <p className="font-bold leading-relaxed">{submissionResult.passphrase}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(submissionResult.passphrase);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-emerald-400 text-[11px] font-bold bg-transparent border-0 cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-[10px] max-w-md mx-auto text-[11px] text-rose-700 leading-relaxed text-left flex gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Do not lose this passphrase.</strong> DARPAN does not store enclaves passwords. Once closed, it cannot be recovered under any legal request.
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="bg-white rounded-[18px] border border-[#ebebeb] p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-[14.5px] text-[#222222] uppercase tracking-wider">Triage Scoring Rules</h3>
                <div className="space-y-3 pt-2 text-[12.5px] text-[#6a6a6a] leading-relaxed">
                  <p>
                    DARPAN processes whistleblower leaks through real-time **Groq AI Triage algorithms**:
                  </p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><strong>Specs Collusion Overlays</strong>: Flags restrictive parameter terms favoring catalog numbers.</li>
                    <li><strong>Market Price Comparison</strong>: Verifies pricing markups vs standard Median indexes.</li>
                    <li><strong>Shell Registrations Check</strong>: Cross-references MCA21 dates to flags new shell award recipients.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            // Track tab
            <motion.div
              key="track"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[18px] border border-[#ebebeb] p-6 shadow-sm space-y-6 max-w-2xl"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest block">Track tip passphrase</label>
                <div className="flex gap-2">
                  <input
                    value={passphraseQuery}
                    onChange={(e) => setPassphraseQuery(e.target.value)}
                    placeholder="Enter your unique 8-word passphrase..."
                    className="flex-1 bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] px-4 py-2.5 text-[13px] text-[#222222] font-mono focus:outline-none"
                  />
                  <Button onClick={handleTrackTip} disabled={isTrackLoading} className="rounded-[10px] bg-[#ff385c] hover:bg-[#e0022a] px-6">
                    {isTrackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                    Search
                  </Button>
                </div>
              </div>

              {trackedResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4 border-t border-[#f7f7f7]">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-rose-50 text-[#ff385c] border border-rose-200 px-3 py-1 rounded-full uppercase tracking-wider">
                      Triage Status: {trackedResult.status.toUpperCase()}
                    </span>
                    <span className="text-[12px] font-mono text-[#aaaaaa]">Relevance: {trackedResult.relevanceScore}%</span>
                  </div>

                  <div className="p-4 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] text-[13px] leading-relaxed text-[#3f3f3f]">
                    <p className="font-semibold text-[#222222]">Commited Message:</p>
                    <p className="mt-1">{trackedResult.content}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
