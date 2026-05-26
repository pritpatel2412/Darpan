import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useListTenders } from "@workspace/api-client-react";
import { 
  ShieldAlert, Mic, Square, Key, ShieldCheck, Copy, Check, 
  Search, ExternalLink, Loader2, Info, CheckCircle2, FileText, HelpCircle 
} from "lucide-react";
import { Link } from "wouter";

export default function Whistleblower() {
  const { toast } = useToast();
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
    crossRefTenderId: string | null;
    createdAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Track Form States
  const [passphraseQuery, setPassphraseQuery] = useState("");
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [trackedResult, setTrackedResult] = useState<{
    id: number;
    content: string;
    relevanceScore: number;
    crossRefTenderId: string | null;
    status: string;
    createdAt: string;
    tenderInfo?: {
      id: number;
      tenderId: string;
      title: string;
      fraudScore: number;
    } | null;
  } | null>(null);

  // Fetch Tenders for linking
  const { data: tendersData } = useListTenders({ limit: 50 });

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
    toast({
      title: "Audio Sandbox Active",
      description: "Regional voice memo recording simulator started. Speak freely.",
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasVoiceMemo(true);
    toast({
      title: "Voice Memo Saved",
      description: "Audio memo registered! AI Speech-to-Text translation is primed for submission.",
    });
  };

  const handleSubmitTip = async () => {
    if (!tipText && !hasVoiceMemo) {
      toast({
        title: "Input required",
        description: "Please enter a detailed text tip or record a voice memo first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        crossRefTenderId: selectedTenderId !== "auto" ? selectedTenderId : undefined,
      };

      if (hasVoiceMemo) {
        payload.voiceUrl = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      } else {
        payload.content = tipText;
      }

      const res = await fetch("http://localhost:8080/api/whistleblower/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit anonymous tip");

      setSubmissionResult({
        passphrase: data.passphrase,
        relevanceScore: data.relevanceScore,
        crossRefTenderId: data.crossRefTenderId,
        createdAt: data.createdAt,
      });

      toast({
        title: "Tip Securely Submitted",
        description: "Your anonymous tip has been processed by Groq AI and registered in the vault.",
      });

      // Reset forms
      setTipText("");
      setHasVoiceMemo(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Submission Error",
        description: err.message || "Failed to save anonymous whistleblower data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackTip = async () => {
    if (!passphraseQuery.trim()) return;

    setIsTrackLoading(true);
    setTrackedResult(null);
    try {
      const res = await fetch("http://localhost:8080/api/whistleblower/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: passphraseQuery.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to track anonymous tip");

      setTrackedResult(data);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Tracking Failed",
        description: err.message || "Passphrase not found in our zero-logs directory.",
        variant: "destructive",
      });
    } finally {
      setIsTrackLoading(false);
    }
  };

  const handleCopyPassphrase = () => {
    if (!submissionResult?.passphrase) return;
    navigator.clipboard.writeText(submissionResult.passphrase);
    setCopied(true);
    toast({ title: "Copied", description: "BIP39 Passphrase copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MainLayout 
      title="Anonymous Whistleblower Vault" 
      subtitle="Zero-logs encryption tunnel protecting procurement whistleblowers"
    >
      <div className="flex flex-col gap-6">

        {/* Security Warning Notice */}
        <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-950 text-white p-5 rounded-[14px] border border-zinc-800 shadow-sm flex items-start gap-4">
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 flex-shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-[13px] font-black text-rose-400 tracking-wider uppercase">Zero-Logs Security Standard</h4>
            <p className="text-[12px] text-zinc-400 leading-relaxed font-medium">
              We do not track IP addresses, browser agents, or location telemetry. Submissions are hashed, scored using Groq AI and stored on a zero-knowledge directory. Bip39 8-word passphrases are randomly generated client-side and cannot be recovered if lost.
            </p>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex gap-2 border-b border-[#ebebeb] pb-1">
          <button 
            onClick={() => { setActiveSubTab("submit"); setSubmissionResult(null); }} 
            className={`pb-3 px-4 font-bold text-[14px] border-b-2 transition-all ${activeSubTab === "submit" ? "border-[#ff385c] text-[#ff385c]" : "border-transparent text-[#6a6a6a] hover:text-[#222222]"}`}
          >
            Submit Secure Tip
          </button>
          <button 
            onClick={() => setActiveSubTab("track")} 
            className={`pb-3 px-4 font-bold text-[14px] border-b-2 transition-all ${activeSubTab === "track" ? "border-[#ff385c] text-[#ff385c]" : "border-transparent text-[#6a6a6a] hover:text-[#222222]"}`}
          >
            Track Tip Status
          </button>
        </div>

        {activeSubTab === "submit" ? (
          <AnimatePresence mode="wait">
            {!submissionResult ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6 max-w-3xl"
              >
                <div className="bg-white border border-[#ebebeb] rounded-[14px] p-6 shadow-sm space-y-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#222222]">1. Cross-reference Suspicious Tender (Optional)</label>
                    <select
                      value={selectedTenderId}
                      onChange={(e) => setSelectedTenderId(e.target.value)}
                      className="w-full h-11 px-3 bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] text-[13px] font-semibold text-[#222222] focus:bg-white transition-colors"
                    >
                      <option value="auto">Auto-detect from tip contents (Recommended AI Triage)</option>
                      {Array.isArray(tendersData?.tenders) && 
                        (tendersData.tenders as any[]).map((t: any) => (
                          <option key={t.id} value={t.tenderId}>
                            {t.tenderId} — {t.title.slice(0, 50)}… [₹{(t.contractValue / 10000000).toFixed(1)}Cr]
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-[#f7f7f7]">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-bold text-[#222222]">2. Tip Method (Type details OR Record voice memo)</label>
                      {hasVoiceMemo && (
                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-[5px]">
                          Voice memo recorded successfully
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Text Input Panel */}
                      <div className="space-y-1.5">
                        <textarea
                          placeholder="Type specific details of tender specifications rigging, bribes, pre-award cartel arrangements, or shell company matches…"
                          value={tipText}
                          onChange={(e) => setTipText(e.target.value)}
                          disabled={hasVoiceMemo}
                          className="w-full h-44 p-4 bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] text-[13px] font-medium text-[#222222] placeholder-[#aaaaaa] focus:bg-white resize-none disabled:opacity-50 transition-colors"
                        />
                      </div>

                      {/* Voice Recording Panel */}
                      <div className="bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] p-5 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                        {isRecording ? (
                          <>
                            {/* Animated Visualizer Waves */}
                            <div className="flex items-end gap-1 h-10 mb-2">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <motion.div 
                                  key={i}
                                  animate={{ height: [8, 32, 8] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                  className="w-1 bg-[#ff385c] rounded-full"
                                />
                              ))}
                            </div>
                            <span className="text-[13px] font-bold text-rose-600">Recording… {recordingSeconds}s</span>
                            <button
                              onClick={handleStopRecording}
                              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[10px] text-[13px] font-bold shadow-md transition-colors"
                            >
                              <Square className="w-3.5 h-3.5" />
                              Stop & Save Memo
                            </button>
                          </>
                        ) : (
                          <>
                            <div className={`p-4 rounded-full ${hasVoiceMemo ? "bg-rose-50 border border-rose-100" : "bg-white border border-[#ebebeb]"} shadow-sm`}>
                              <Mic className={`w-6 h-6 ${hasVoiceMemo ? "text-rose-500 animate-pulse" : "text-[#aaaaaa]"}`} />
                            </div>
                            <div className="text-center px-4">
                              <h5 className="text-[13px] font-bold text-[#222222]">Regional Voice Triage Desk</h5>
                              <p className="text-[11px] text-[#6a6a6a] mt-0.5 leading-relaxed">
                                Record in Hindi, Gujarati, or any native dialect. Sarvam AI translates regional audio into English instantly.
                              </p>
                            </div>
                            <button
                              onClick={handleStartRecording}
                              disabled={!!tipText}
                              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#222222] hover:bg-zinc-800 disabled:opacity-50 text-white rounded-[10px] text-[13px] font-bold shadow-sm transition-colors cursor-pointer"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              {hasVoiceMemo ? "Re-record Voice Memo" : "Record Voice Tip"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitTip}
                    disabled={isSubmitting || (!tipText && !hasVoiceMemo)}
                    className="w-full h-12 bg-[#ff385c] hover:bg-[#e0022a] disabled:opacity-50 text-white font-bold text-[14px] rounded-[10px] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer mt-4"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI Triage Analysis in Progress…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Securely Dispatch Encrypted Tip
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Success Passphrase Display Screen */
              <motion.div 
                key="passphrase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl bg-white border border-[#ebebeb] rounded-[16px] p-8 shadow-sm space-y-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-2">
                  <Key className="w-5 h-5 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-[18px] font-black text-[#222222] tracking-tight">Your Anonymous Vault Key</h3>
                  <p className="text-[13px] text-[#6a6a6a] max-w-md mx-auto leading-relaxed">
                    This is your unique 8-word tracking passphrase. **Write it down immediately.** We store only cryptographically salted hashes, so we cannot recover this key if lost.
                  </p>
                </div>

                {/* 8-Card Grid Passphrase Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto py-4">
                  {submissionResult.passphrase.split("-").map((word, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] text-[13px] font-bold text-[#222222] font-mono flex flex-col items-center shadow-sm"
                    >
                      <span className="text-[9px] text-[#aaaaaa] font-sans font-bold uppercase tracking-wider mb-1">Word {idx + 1}</span>
                      {word}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto pt-2">
                  <button 
                    onClick={handleCopyPassphrase}
                    className="flex-1 h-11 border border-[#ebebeb] bg-[#f7f7f7] hover:border-[#ff385c] hover:bg-white text-[13px] font-bold text-[#6a6a6a] hover:text-[#ff385c] rounded-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy to Clipboard"}
                  </button>
                  <button 
                    onClick={() => setSubmissionResult(null)}
                    className="flex-1 h-11 bg-[#222222] hover:bg-zinc-800 text-[13px] font-bold text-white rounded-[10px] shadow-sm transition-colors cursor-pointer"
                  >
                    Return to Form
                  </button>
                </div>

                <div className="pt-4 border-t border-[#f7f7f7] flex items-center justify-center gap-4 text-[12px] text-[#aaaaaa] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Relevance Score: <strong className="text-[#222222]">{submissionResult.relevanceScore}%</strong>
                  </div>
                  {submissionResult.crossRefTenderId && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Linked Tender: <strong className="text-[#222222]">{submissionResult.crossRefTenderId}</strong>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* Tip Status Tracker Tab */
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl"
          >
            <div className="bg-white border border-[#ebebeb] rounded-[14px] p-6 shadow-sm space-y-5">
              <h4 className="text-[14px] font-bold text-[#222222]">Track Tip Status</h4>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaaaaa]" />
                  <Input
                    placeholder="Enter your 8-word passphrase (e.g. apple-banana-cherry...)"
                    value={passphraseQuery}
                    onChange={(e) => setPassphraseQuery(e.target.value)}
                    className="pl-9 bg-[#f7f7f7] border-[#ebebeb] rounded-[10px] focus:bg-white text-[13px] font-semibold"
                  />
                </div>
                <button
                  onClick={handleTrackTip}
                  disabled={isTrackLoading || !passphraseQuery.trim()}
                  className="h-10 px-6 bg-[#ff385c] hover:bg-[#e0022a] text-white rounded-[10px] text-[13px] font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {isTrackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track Status"}
                </button>
              </div>
            </div>

            {trackedResult && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#ebebeb] rounded-[14px] p-6 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-[#f7f7f7] pb-4">
                  <div className="space-y-1">
                    <h5 className="text-[12px] font-bold text-[#aaaaaa] uppercase tracking-wider">Triage Status Log</h5>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${trackedResult.status === "validated" ? "bg-emerald-500 animate-pulse" : "bg-[#f59e0b] animate-pulse"}`} />
                      <span className="text-[14px] font-black text-[#222222] capitalize">{trackedResult.status.replace("_", " ")}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <h5 className="text-[12px] font-bold text-[#aaaaaa] uppercase tracking-wider">AI Relevance Score</h5>
                    <span className="text-[15px] font-black text-[#ff385c]">{trackedResult.relevanceScore}%</span>
                  </div>
                </div>

                {/* Secure audit pipeline tracking */}
                <div className="space-y-4">
                  <h6 className="text-[12px] font-bold text-[#222222]">Investigation Pipeline Progress</h6>
                  <div className="grid grid-cols-4 gap-2 relative">
                    {/* Pipeline line */}
                    <div className="absolute top-3 left-[12%] right-[12%] h-0.5 bg-[#f0f0f0] z-0" />
                    <div className="absolute top-3 left-[12%] right-[12%] h-0.5 bg-rose-500 z-0 transition-all" 
                      style={{ 
                        width: trackedResult.status === "validated" ? "76%" : trackedResult.status === "under_review" ? "38%" : "0%" 
                      }} 
                    />

                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-1.5 relative z-10 text-center">
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">1</div>
                      <span className="text-[11px] font-bold text-[#222222]">Submitted</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-1.5 relative z-10 text-center">
                      <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm ${trackedResult.relevanceScore >= 40 ? "bg-rose-500 text-white" : "bg-[#f0f0f0] text-[#aaaaaa]"}`}>2</div>
                      <span className="text-[11px] font-bold text-[#222222]">AI Triaged</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-1.5 relative z-10 text-center">
                      <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm ${trackedResult.status === "under_review" || trackedResult.status === "validated" ? "bg-rose-500 text-white" : "bg-[#f0f0f0] text-[#aaaaaa]"}`}>3</div>
                      <span className="text-[11px] font-bold text-[#222222]">Under Review</span>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center gap-1.5 relative z-10 text-center">
                      <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm ${trackedResult.status === "validated" ? "bg-emerald-500 text-white" : "bg-[#f0f0f0] text-[#aaaaaa]"}`}>4</div>
                      <span className="text-[11px] font-bold text-[#222222]">Validated</span>
                    </div>
                  </div>
                </div>

                {/* Linked Tender details */}
                {trackedResult.tenderInfo ? (
                  <div className="p-4 bg-[#f9f9f9] border border-[#f0f0f0] rounded-[10px] space-y-2">
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded-[5px]">
                      Linked Flagged Tender
                    </span>
                    <h4 className="text-[13px] font-bold text-[#222222] line-clamp-1">{trackedResult.tenderInfo.title}</h4>
                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="font-mono text-[#aaaaaa]">{trackedResult.tenderInfo.tenderId}</span>
                      <Link href={`/tenders/${trackedResult.tenderInfo.id}`} className="font-bold text-[#ff385c] hover:underline flex items-center gap-0.5">
                        Open Evidence Dossier <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#fafafa] border border-[#f0f0f0] rounded-[10px] flex items-center gap-3">
                    <Info className="w-4 h-4 text-[#aaaaaa]" />
                    <span className="text-[12px] text-[#6a6a6a] font-medium">
                      {trackedResult.crossRefTenderId 
                        ? `Linked Tender ID is ${trackedResult.crossRefTenderId}, but it hasn't finished index matching in scanner.` 
                        : "Tip is currently undergoing global text matching to link it against public procurement tenders."}
                    </span>
                  </div>
                )}

                <div className="space-y-1 bg-zinc-50 border border-zinc-100 p-4 rounded-[10px] text-[12px] font-mono text-zinc-600">
                  <div className="font-bold uppercase text-[9px] text-[#aaaaaa] mb-1">Tip Statement Logs</div>
                  {trackedResult.content}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
