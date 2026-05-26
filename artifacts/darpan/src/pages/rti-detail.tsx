import { useParams, Link } from "wouter";
import { useGetRti, getGetRtiQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ScrollText, CheckCircle, Send, MessageSquare, Copy, Download, Check, Calendar, Hash, Building2, ExternalLink } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  drafted: { color: "text-[#6a6a6a]", bg: "bg-[#f7f7f7]", icon: ScrollText, label: "Drafted" },
  submitted: { color: "text-blue-700", bg: "bg-blue-50", icon: Send, label: "Submitted" },
  responded: { color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle, label: "Responded" },
  appealed: { color: "text-orange-700", bg: "bg-orange-50", icon: MessageSquare, label: "Appealed" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 text-[12px] text-[#6a6a6a] hover:text-[#ff385c] transition-colors border border-[#ebebeb] hover:border-[#ff385c]/30 px-2.5 py-1.5 rounded-[7px] bg-white">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function RtiDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: rti, isLoading } = useGetRti(id, {
    query: { enabled: !!id, queryKey: getGetRtiQueryKey(id) },
  });
  const { toast } = useToast();

  const [isFilingOpen, setIsFilingOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rti && !receiptNumber) {
      const deptCode = rti.department.slice(0, 5).toUpperCase().replace(/[^A-Z]/g, "");
      const year = new Date().getFullYear();
      const num = Math.floor(10000 + Math.random() * 90000);
      setReceiptNumber(`${deptCode}/R/${year}/${num}`);
    }
  }, [rti, receiptNumber]);

  const confirmFiling = async () => {
    if (!receiptNumber.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/rtis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "submitted",
          confirmationNumber: receiptNumber.trim(),
          filingDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update RTI filing");
      }

      toast({
        title: "RTI Filing Confirmed",
        description: `Official registration number ${receiptNumber} has been saved to the audit ledger!`,
      });
      setIsFilingOpen(false);
      window.location.reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Could not update the auditing ledger. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!rti) return;
    const content = [
      `RTI APPLICATION`,
      `===============`,
      ``,
      `To: ${rti.pioName || `Public Information Officer, ${rti.department}`}`,
      `Address: ${rti.pioAddress || `${rti.department}, India`}`,
      ``,
      `Reference: ${rti.confirmationNumber || "Pending"}`,
      `Filing Date: ${rti.filingDate ? format(new Date(rti.filingDate), "dd MMMM yyyy") : "Not yet filed"}`,
      ``,
      `SUBJECT: Application for information under Section 6(1) of the RTI Act, 2005`,
      `Regarding: ${rti.tenderTitle}`,
      ``,
      `Legal Basis:`,
      rti.legalBasis,
      ``,
      `Evidence Summary:`,
      rti.evidenceSummary,
      ``,
      `INFORMATION SOUGHT:`,
      ``,
      ...(rti.questions || []).map((q, i) => [`${i + 1}. ${q}`, ``]).flat(),
      ``,
      `Applicant requests the above information at the earliest, within 30 days as per Section 7(1) of the RTI Act, 2005.`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RTI_${rti.tenderId}_${rti.confirmationNumber || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "RTI application saved as text file." });
  };

  if (isLoading) {
    return (
      <MainLayout title="RTI Application">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-[14px]" />
          <Skeleton className="h-96 w-full rounded-[14px]" />
        </div>
      </MainLayout>
    );
  }

  if (!rti) {
    return (
      <MainLayout title="RTI Application">
        <div className="text-center py-20 text-[#aaaaaa]">RTI application not found.</div>
      </MainLayout>
    );
  }

  const cfg = STATUS_CONFIG[rti.status] ?? STATUS_CONFIG.drafted;
  const daysLeft = rti.responseDeadline ? differenceInDays(new Date(rti.responseDeadline), new Date()) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  return (
    <MainLayout title="RTI Application" subtitle={rti.confirmationNumber ?? "Draft"}>
      <div className="space-y-6">

        <Link href="/rti-tracker">
          <button className="flex items-center gap-1.5 text-[13px] text-[#6a6a6a] hover:text-[#ff385c] transition-colors font-medium group -mb-2">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to RTI Tracker
          </button>
        </Link>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold ${cfg.bg} ${cfg.color}`}>
                  <cfg.icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </span>
                {rti.confirmationNumber && (
                  <span className="text-[12px] font-mono text-[#6a6a6a] bg-[#f7f7f7] border border-[#ebebeb] px-2.5 py-1.5 rounded-[6px]">
                    {rti.confirmationNumber}
                  </span>
                )}
              </div>
              <h1 className="text-[20px] font-bold text-[#222222] tracking-tight leading-snug">{rti.tenderTitle}</h1>
              <div className="flex flex-wrap gap-4 text-[13px]">
                <div className="flex items-center gap-1.5 text-[#6a6a6a]">
                  <Building2 className="w-3.5 h-3.5" />
                  {rti.department}
                </div>
                <div className="flex items-center gap-1.5 text-[#6a6a6a]">
                  <Hash className="w-3.5 h-3.5" />
                  {rti.tenderId}
                </div>
                {rti.filingDate && (
                  <div className="flex items-center gap-1.5 text-[#6a6a6a]">
                    <Calendar className="w-3.5 h-3.5" />
                    Filed {format(new Date(rti.filingDate), "dd MMM yyyy")}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 self-start">
              {rti.status === "drafted" && (
                <button 
                  onClick={() => setIsFilingOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff385c] hover:bg-[#e0022a] text-white rounded-[10px] text-[13px] font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Submit Filing Receipt
                </button>
              )}
              <button 
                onClick={handleDownload} 
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#ebebeb] hover:border-[#ff385c]/30 hover:text-[#ff385c] text-[#6a6a6a] rounded-[10px] text-[13px] font-semibold transition-colors bg-white cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Draft
              </button>
            </div>
          </div>

          {rti.responseDeadline && (
            <div className={`mt-6 p-3 rounded-[10px] border flex items-center gap-3 ${isOverdue ? "bg-[#ff385c]/5 border-[#ff385c]/20" : "bg-[#f7f7f7] border-[#ebebeb]"}`}>
              <Calendar className={`w-4 h-4 flex-shrink-0 ${isOverdue ? "text-[#ff385c]" : "text-[#aaaaaa]"}`} />
              <div>
                <p className={`text-[13px] font-semibold ${isOverdue ? "text-[#ff385c]" : "text-[#222222]"}`}>
                  Response deadline: {format(new Date(rti.responseDeadline), "dd MMMM yyyy")}
                </p>
                <p className={`text-[12px] ${isOverdue ? "text-[#ff385c]" : "text-[#aaaaaa]"}`}>
                  {isOverdue ? `${Math.abs(daysLeft!)}d overdue — escalate to First Appellate Authority` : `${daysLeft} days remaining`}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f7f7f7] flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#222222]">Legal Basis</h2>
            <CopyButton text={rti.legalBasis || ""} />
          </div>
          <div className="px-6 py-5">
            <p className="text-[14px] text-[#3f3f3f] leading-relaxed">{rti.legalBasis}</p>
          </div>
        </div>

        {rti.evidenceSummary && (
          <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f7f7f7] flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#222222]">Evidence Summary</h2>
              <CopyButton text={rti.evidenceSummary} />
            </div>
            <div className="px-6 py-5">
              <p className="text-[14px] text-[#3f3f3f] leading-relaxed">{rti.evidenceSummary}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f7f7f7] flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#222222]">Questions ({rti.questions?.length ?? 0})</h2>
              <p className="text-[12px] text-[#aaaaaa] mt-0.5">Information sought under Section 6(1) RTI Act, 2005</p>
            </div>
            <CopyButton text={(rti.questions ?? []).map((q, i) => `${i + 1}. ${q}`).join("\n\n")} />
          </div>
          <div className="divide-y divide-[#f7f7f7]">
            {(rti.questions ?? []).map((q, i) => (
              <div key={i} className="px-6 py-4 flex gap-4">
                <span className="w-6 h-6 rounded-full bg-[#ff385c]/10 text-[#ff385c] text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[14px] text-[#3f3f3f] leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </div>

        {rti.pioName && (
          <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-3">Addressed To</h3>
            <p className="text-[14px] font-semibold text-[#222222]">{rti.pioName}</p>
            {rti.pioAddress && <p className="text-[13px] text-[#6a6a6a] mt-0.5">{rti.pioAddress}</p>}
          </div>
        )}

      </div>

      {/* Interactive RTI Filing Modal */}
      {isFilingOpen && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[18px] border border-[#ebebeb] shadow-xl max-w-lg w-full overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#f7f7f7] bg-[#f7f7f7] flex justify-between items-center">
              <h3 className="text-[15px] font-extrabold text-[#222222] flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#ff385c]" />
                Complete Official RTI Filing
              </h3>
              <button onClick={() => setIsFilingOpen(false)} className="text-[12px] text-[#aaaaaa] hover:text-[#ff385c] font-black cursor-pointer">Close</button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-[12.5px] text-[#6a6a6a] leading-relaxed">
                Follow these simple steps to file officially on the government portal:
              </p>

              <div className="space-y-3.5 text-[12.5px]">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 text-[#222222] text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-bold text-[#222222]">Open RTI Online Portal</p>
                    <p className="text-[#6a6a6a]">
                      Click here to open{" "}
                      <a href="https://rtionline.gov.in" target="_blank" rel="noreferrer" className="text-[#ff385c] font-bold hover:underline inline-flex items-center gap-0.5">
                        rtionline.gov.in <ExternalLink className="w-3 h-3" />
                      </a>{" "}
                      and log in as a citizen.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 text-[#222222] text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-bold text-[#222222]">Copy & Paste Questions</p>
                    <p className="text-[#6a6a6a]">Select the target department, copy the questions from the section behind, and paste them into the RTI form.</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 text-[#222222] text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-bold text-[#222222]">Confirm Registration Details</p>
                    <p className="text-[#6a6a6a]">Pay the ₹10 fee and enter the registration number you receive below to save it in Darpan's auditing ledger.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-[#f7f7f7]">
                <label className="text-[12.5px] font-bold text-[#222222]">RTI Registration/Receipt Number</label>
                <input 
                  type="text"
                  placeholder="e.g. MOHUA/R/E/26/01293"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full h-11 px-3 bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] text-[13px] font-mono font-bold text-[#222222] focus:bg-white focus:border-[#ff385c]/40 outline-none transition-all"
                />
              </div>

              <button 
                onClick={confirmFiling}
                disabled={isSubmitting || !receiptNumber.trim()}
                className="w-full h-11 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold text-[13px] rounded-[10px] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSubmitting ? "Updating Ledger..." : "Confirm & Save Filing"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
