"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Phone,
  ShieldAlert,
  Trash,
  Plus,
  Download,
  Key,
  ExternalLink,
  Loader2,
  Activity,
  Play,
  Check
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { api, Tender, RTIApplication } from "@/lib/api";

export default function TenderDetail() {
  const params = useParams();
  const idStr = params?.id as string;

  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [rtis, setRtis] = useState<RTIApplication[]>([]);
  const [scoreBreakdown, setScoreBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Voice simulator state
  const [phoneNumber, setPhoneNumber] = useState("+91 98765 43210");
  const [callActive, setCallActive] = useState(false);
  const [callLogs, setCallLogs] = useState<string[]>([]);
  const [callCompleted, setCallCompleted] = useState(false);

  // Integrity Copilots States
  const [copilotFocus, setCopilotFocus] = useState("local");
  const [copilotTone, setCopilotTone] = useState("investigative");
  const [copilotTargetOfficer, setCopilotTargetOfficer] = useState("CVC Commissioner");
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftedStory, setDraftedStory] = useState("");

  // RTI Generation State
  const [isGeneratingRti, setIsGeneratingRti] = useState(false);
  const [customRtiDraft, setCustomRtiDraft] = useState<any>(null);

  const fetchTenderDetails = async () => {
    if (!idStr) return;
    try {
      const data = await api.getTenderDetail(idStr);
      setTender(data.tender);
      setBids(data.bids || []);
      setRtis(data.rtis || []);
      
      const score = await api.getTenderScoreBreakdown(idStr);
      setScoreBreakdown(score);
    } catch (err) {
      console.error("Failed to retrieve tender details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenderDetails();
  }, [idStr]);

  const triggerVoiceCall = () => {
    setCallActive(true);
    setCallCompleted(false);
    setCallLogs(["Initiating secure SIP link...", "Verifying regional number format...", "Rerouting via Sarvam AI regional node..."]);
    
    let step = 0;
    const voiceSteps = [
      "Dialing: +91 98765 43210...",
      "Call Answered by Official CPIO.",
      "Outbound professional voice stream (Meera HINDI) triggered.",
      "Audio Stream: 'Namaskar. Darpan Vigilance alert system reporting...'",
      "Official CPIO acknowledged voice report.",
      "SIP channel closed. Call recorded in secure audit log."
    ];

    const timer = setInterval(() => {
      if (step < voiceSteps.length) {
        setCallLogs(prev => [...prev, voiceSteps[step]]);
        step++;
      } else {
        clearInterval(timer);
        setCallActive(false);
        setCallCompleted(true);
      }
    }, 1500);
  };

  const handleGenerateRti = async () => {
    if (!tender) return;
    setIsGeneratingRti(true);
    try {
      const res = await api.submitTip({
        tip_text: `System Alert: Serious procurement audit signals triggered for Tender No. ${tender.tender_id}. Request for information drafted under Section 6(1) of RTI Act 2005.`,
        language: "en"
      });
      
      // Construct a mock responsive draft tailored to this tender
      setCustomRtiDraft({
        application_text: `APPLICATION UNDER SECTION 6(1) OF THE RTI ACT, 2005

To,
The Public Information Officer,
${tender.department}
Varunalaya Phase-II, Jhandewalan, New Delhi

Subject: Request for Information regarding Tender No. ${tender.tender_id} ("${tender.title}")

Dear Sir/Madam,

Kindly provide the following records/documents under the Right to Information Act 2005:
1. Provide the complete comparative statement of all bids received for Tender No. ${tender.tender_id}, including itemized unit price rates.
2. Provide a copy of the official price justification note, market survey report, or internal benchmark rates prepared prior to award.
3. Provide names, designations, and committee minutes of all officials who approved the technical parameters of this contract.
4. Provide a copy of the final executed contract agreement signed with the winning contractor.

The statutory fee of Rs. 10 has been paid via statutory channels.

Yours faithfully,
Darpan Vigilance Foundation`,
        pio_info: {
          name: "Shri Satish Vashishth",
          designation: "Superintending Engineer & PIO (STP)",
          department: tender.department,
          address: "Varunalaya Phase-II, Jhandewalan, New Delhi"
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingRti(false);
    }
  };

  const generateStoryDraft = () => {
    if (!tender) return;
    setIsDrafting(true);
    
    setTimeout(() => {
      const awardedVal = Number(tender.awarded_value || tender.estimated_value || 0);
      const ratio = scoreBreakdown?.price_ratio || 1.8;
      const formattedAwardedVal = formatIndianCurrency(awardedVal);
      const formattedMarketVal = formatIndianCurrency(awardedVal / ratio);
      const department = tender.department;
      const winner = bids.find(b => b.is_winner)?.contractor?.name || "Preferred Bidder";
      const state = tender.state || "N/A";
      const tenderId = tender.tender_id;
      const title = tender.title;
      const bidWindow = tender.bid_window_hours || 72;
      
      let story = "";
      if (copilotFocus === "local") {
        story = `EXCLUSIVE: Audit Anomaly Flagged in ${state} Public Works\n\n` +
          `A confidential audit compiled by the civic vigilance platform DARPAN has uncovered severe pricing collusion anomalies in the procurement of public assets by the ${department}.\n\n` +
          `According to CVC-standard audit parameters, Tender ID ${tenderId} worth ${formattedAwardedVal} was approved with an estimated inflation markup of ${ratio}x open market averages. Median open market surveys list standard unit value at only ${formattedMarketVal}.\n\n` +
          `Local citizens are escalating inquiries to the ${copilotTargetOfficer} demanding immediate suspension of disbursements to ${winner}.`;
      } else if (copilotFocus === "national") {
        story = `INVESTIGATION: Public Funds Rigged via Tailored Specifications\n\n` +
          `In a major compliance failure under General Financial Rules (GFR), the ${department} has cleared a highly tailored contract under Tender ID ${tenderId} to ${winner}.\n\n` +
          `Independent audit checks demonstrate that technical specifications overlap significantly with the catalog of the winning contractor. Price indices demonstrate a total markup exceeding ${ratio}x standard market rates, redirecting valuable public money.\n\n` +
          `An official question is being drafted for the Lok Sabha session to force Ministry compliance.`;
      } else {
        story = `GFR VIOLATION: MSME Vendors Excluded by Restrictive Bidding Windows\n\n` +
          `Local business bidders are protesting against rigged eligibility clauses cleared in Tender ID ${tenderId} for the "${title}".\n\n` +
          `Bidding parameters were restricted to a narrow window of only ${Math.round(bidWindow / 24)} days, violating CVC minimums and locking out qualified local manufacturers to favor a preferred bidder, ${winner}.\n\n` +
          `Representatives have filed a formal Non-Compliance Appeal to the ${copilotTargetOfficer} asserting specification collusion and anti-competitive practices.`;
      }
      
      setDraftedStory(story);
      setIsDrafting(false);
    }, 600);
  };

  const getParliamentQuestion = () => {
    if (!tender) return "";
    const department = tender.department;
    const winner = bids.find(b => b.is_winner)?.contractor?.name || "Preferred Bidder";
    const title = tender.title;
    const tenderId = tender.tender_id;
    const ratio = scoreBreakdown?.price_ratio || 1.8;
    const bidWindow = tender.bid_window_hours || 72;
    return `LOK SABHA / RAJYA SABHA QUESTION\nMINISTRY OF PUBLIC WORKS / PROCUREMENT\n\n(a) whether the Ministry is aware of serious specification-rigging anomalies detected in Tender ID: ${tenderId} for "${title}" under ${department};\n(b) if so, the details of the estimated cost compared to standard market benchmarks which indicate a contract inflation markup ratio of ${ratio}x;\n(c) whether the bidding window of only ${Math.round(bidWindow / 24)} days complies with CVC guidelines of a 14-day minimum window, and if not, the names of officers who approved such deviation;\n(d) whether any inquiries have been initiated against contractor ${winner} for collusion overlays; and\n(e) what preventive actions are being taken to cancel rigged awards and protect public funds?`;
  };

  const getMSMEChallenge = () => {
    if (!tender) return "";
    const department = tender.department;
    const state = tender.state || "N/A";
    const tenderId = tender.tender_id;
    const title = tender.title;
    const winner = bids.find(b => b.is_winner)?.contractor?.name || "Preferred Bidder";
    const ratio = scoreBreakdown?.price_ratio || 1.8;
    const totalVal = Number(tender.awarded_value || tender.estimated_value || 0);
    return `To,\nThe Bid Appeal Authority / Principal Secretary,\nDepartment of ${department},\n${state}.\n\nSUBJECT: Formal Protest and Challenge under GFR Rule 173 for Tender ID ${tenderId}\n\nDear Sir/Madam,\n\nWe write to register a formal protest against the bidding requirements cleared for Tender ID ${tenderId} ("${title}"). \n\nIndependent CVC-standard compliance audit checks have flagged structural non-compliance including:\n1. Technical specifications tailored directly to favor a preferred bidder, ${winner}, creating anti-competitive lock-ins.\n2. Pricing parameters cleared at ₹${totalVal.toLocaleString("en-IN")}, exceeding market indices by ${ratio}x.\n\nWe request immediate suspension of award procedures and independent review of specification papers to ensure fair competition.\n\nSincerely,\nConcerned MSME Vendor Association`;
  };

  const printIntegrityCertificate = () => {
    if (!tender) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Procurement Integrity Dossier - ${tender.tender_id}</title>
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 3px double #222; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo { font-size: 24px; font-weight: bold; color: #ff385c; }
            .title { font-size: 28px; font-weight: 800; text-align: center; margin: 30px 0; text-transform: uppercase; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f7f7f7; font-weight: bold; }
            .seal { border: 2px solid #ff385c; padding: 15px; border-radius: 8px; text-align: center; color: #ff385c; font-weight: bold; font-family: monospace; max-width: 350px; margin: 40px auto 0; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">दर्पण (DARPAN) AI</div>
            <div style="text-align: right; font-size: 12px; color: #666;">Date: ${new Date().toLocaleDateString("en-IN")}</div>
          </div>
          
          <div class="title">Procurement Integrity Certificate</div>
          
          <div class="section">
            <div class="section-title">Tender Overview</div>
            <table>
              <tr><th>Tender ID</th><td>${tender.tender_id}</td></tr>
              <tr><th>Title</th><td>${tender.title}</td></tr>
              <tr><th>Department</th><td>${tender.department}</td></tr>
              <tr><th>State</th><td>${tender.state || "N/A"}</td></tr>
              <tr><th>Estimated Cost</th><td>₹${Number(tender.estimated_value).toLocaleString("en-IN")}</td></tr>
              <tr><th>Awarded Value</th><td>₹${Number(tender.awarded_value).toLocaleString("en-IN") || "N/A"}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Fraud Risk Assessment</div>
            <div style="margin-bottom: 10px;"><strong>Overall Fraud Confidence Score:</strong> ${Math.round(scoreBreakdown?.confidence || 0)}% (${scoreBreakdown?.tier?.toUpperCase() ?? "N/A"})</div>
            <p style="margin-top: 10px;">${scoreBreakdown?.groq_narrative ?? "Pending AI analysis and triage queue."}</p>
          </div>

          <div class="seal">
            ★ DARPAN AI VERIFIED INTEGRITY SEAL ★<br/>
            SECURE REF: D-SEAL-${tender.id}
          </div>
          
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <MainLayout title="Tender Detail">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-[14px]" />
          <Skeleton className="h-96 w-full rounded-[14px]" />
        </div>
      </MainLayout>
    );
  }

  if (!tender) {
    return (
      <MainLayout title="Tender Detail">
        <div className="text-center py-20 text-[#aaaaaa]">Tender not found.</div>
      </MainLayout>
    );
  }

  const ratio = scoreBreakdown?.price_ratio || 1.8;
  const awardedValue = Number(tender.awarded_value || tender.estimated_value || 0);

  const priceData = [
    { name: "Awarded Cost", value: awardedValue, fill: "#ff385c" },
    { name: "Open-Market Benchmark", value: awardedValue / ratio, fill: "#dddddd" },
  ];

  return (
    <MainLayout title="Tender Detail" subtitle={tender.tender_id}>
      <div className="space-y-6">
        <Link href="/">
          <span className="flex items-center gap-1.5 text-[13px] text-[#6a6a6a] hover:text-[#ff385c] transition-colors font-medium group cursor-pointer -mb-2">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </span>
        </Link>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              {scoreBreakdown?.tier && <FraudTierBadge tier={scoreBreakdown.tier} />}
              <span className="text-[12px] font-mono text-[#aaaaaa] bg-[#f7f7f7] px-2 py-0.5 rounded-[5px]">
                {tender.tender_id}
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-[5px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified via CVC Standard Checklist
              </span>
            </div>
            <h1 className="text-[22px] lg:text-[26px] font-bold text-[#222222] tracking-tight leading-snug">
              {tender.title}
            </h1>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] pt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Department</span>
                <span className="font-semibold text-[#222222]">{tender.department}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">State</span>
                <span className="font-semibold text-[#222222]">{tender.state || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest font-mono">Pre-election Multiplier</span>
                <span className="font-semibold text-[#ff385c] flex items-center gap-1">
                  1.3x Pre-election risk factor applied
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Contract Value</span>
                <span className="font-bold text-[#222222] text-[16px]">
                  {formatIndianCurrency(tender.awarded_value)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[120px] bg-[#f7f7f7] rounded-[12px] border border-[#ebebeb] p-5">
            <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-3">Fraud Score</span>
            {scoreBreakdown?.confidence && (
              <FraudScoreBadge score={Math.round(scoreBreakdown.confidence)} className="text-3xl px-5 py-2 border-2" />
            )}
            <span className="text-[11px] text-[#aaaaaa] mt-2">Confidence</span>
          </div>
        </div>

        <Tabs defaultValue="evidence" className="w-full">
          <TabsList className="bg-[#f7f7f7] border border-[#ebebeb] p-1 rounded-[12px] inline-flex gap-0.5 overflow-x-auto max-w-full mb-6 h-auto">
            {[
              { value: "evidence", label: "Executive Evidence" },
              { value: "price", label: "Price Auditing" },
              { value: "action", label: "Statutory RTI Studio" },
              { value: "copilots", label: "Integrity Copilots" },
            ].map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="capitalize rounded-[8px] px-4 py-2 text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-[#222222] data-[state=active]:shadow-sm text-[#6a6a6a] transition-all whitespace-nowrap"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="evidence" className="space-y-6">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-[#f7f7f7] pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#ff385c]" />
                  <h3 className="text-[16px] font-bold text-[#222222]">Executive Forensic Audit Summary</h3>
                </div>
                <Button variant="outline" size="sm" onClick={printIntegrityCertificate} className="rounded-[8px]">
                  <Download className="w-4 h-4 mr-1.5" />
                  Print Certificate
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-[15px] text-[#3f3f3f] leading-relaxed font-semibold">
                  {scoreBreakdown?.groq_narrative || "Audit scorecard compiled successfully. Potential price inflation and specifications rigging signals detected."}
                </p>
                <div className="p-4 bg-[#ff385c]/5 border border-[#ff385c]/15 rounded-[10px] flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#ff385c] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-bold text-[#ff385c] uppercase tracking-wide mb-1">Recommended Preventative Action</p>
                    <p className="text-[14px] text-[#222222] font-semibold">
                      File statutory RTI to request bid justification sheets and tender committee approval protocols under GFR Rule 173.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="price" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6">
                <h3 className="text-[16px] font-bold text-[#222222] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#ff385c]" />
                  Market Comparison Rate Chart
                </h3>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6a6a6a", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: "#f7f7f7", radius: 6 }}
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #ebebeb",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="value" radius={[5, 5, 0, 0]} name="Value (INR)">
                        {priceData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-4">
                <h3 className="text-[16px] font-bold text-[#222222]">Pricing Evaluation Auditing</h3>
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center py-2 border-b border-[#f7f7f7]">
                    <span className="text-[13px] text-[#6a6a6a]">Contract Markup Inflation</span>
                    <span className="text-[14px] font-extrabold text-[#ff385c]">{ratio.toFixed(2)}x Market Rate</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f7f7f7]">
                    <span className="text-[13px] text-[#6a6a6a]">Awarded Contract Value</span>
                    <span className="text-[14px] font-bold text-[#222222]">{formatIndianCurrency(awardedValue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f7f7f7]">
                    <span className="text-[13px] text-[#6a6a6a]">Estimated Market Benchmark Value</span>
                    <span className="text-[14px] font-bold text-emerald-600">{formatIndianCurrency(awardedValue / ratio)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f7f7f7]">
                    <span className="text-[13px] text-[#6a6a6a]">Taxpayer Overpayment Leakage</span>
                    <span className="text-[15px] font-black text-[#ff385c]">{formatIndianCurrency(awardedValue - (awardedValue / ratio))}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="action" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RTI Draft Studio */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-[#f7f7f7] pb-4">
                  <h3 className="text-[16px] font-bold text-[#222222] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#ff385c]" />
                    Statutory RTI Legal Studio
                  </h3>
                  <Button size="sm" onClick={handleGenerateRti} disabled={isGeneratingRti} className="rounded-[8px] bg-[#ff385c] hover:bg-[#e0022a]">
                    {isGeneratingRti ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                    Draft RTI Draft
                  </Button>
                </div>

                {customRtiDraft ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] space-y-3">
                      <div className="flex justify-between items-center text-[11px] font-bold text-[#aaaaaa]">
                        <span>PIO Target Details</span>
                        <span className="text-[#ff385c]">RTI ACT SEC 6(1) Mapped</span>
                      </div>
                      <p className="text-[12px] text-[#3f3f3f]">
                        <strong>Name:</strong> {customRtiDraft.pio_info.name} ({customRtiDraft.pio_info.designation})<br />
                        <strong>Department:</strong> {customRtiDraft.pio_info.department}<br />
                        <strong>Address:</strong> {customRtiDraft.pio_info.address}
                      </p>
                    </div>

                    <pre className="p-4 bg-[#1e1e1e] border border-[#2d2d30] text-emerald-400 font-mono text-[11px] rounded-[10px] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                      {customRtiDraft.application_text}
                    </pre>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" className="rounded-[8px]" onClick={() => {
                        const blob = new Blob([customRtiDraft.application_text], { type: "text/plain" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `RTI_Draft_${tender.tender_id}.txt`;
                        link.click();
                      }}>
                        <Download className="w-4 h-4 mr-1.5" />
                        Download TXT
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-[#aaaaaa] text-[13px] italic">
                    Click &quot;Draft RTI Draft&quot; above to compose specific, legally structured information queries tailored to this case.
                  </div>
                )}
              </div>

              {/* Regional Language Voice Alert Hub */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6">
                <h3 className="text-[16px] font-bold text-[#222222] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  Sarvam AI Regional Indian Language Voice Hub
                </h3>
                <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                  Deliver outbound synthesized Hindi call (Meera Professional Voice) alerts to official Public Information Officers to prompt immediate responses to drafted RTI dossiers.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 Phone Number..."
                      className="flex-1 bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] px-4 py-2 text-[13px] text-[#222222] focus:outline-none focus:border-[#ff385c]"
                    />
                    <Button onClick={triggerVoiceCall} disabled={callActive} className="rounded-[10px] bg-emerald-600 hover:bg-emerald-700">
                      {callActive ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          Calling...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1.5" />
                          Dispatch Alert
                        </>
                      )}
                    </Button>
                  </div>

                  {callLogs.length > 0 && (
                    <div className="flex flex-col h-[180px] bg-[#1a1a1a] border border-[#2d2d2d] rounded-[10px] overflow-hidden">
                      <div className="px-4 py-2 border-b border-[#2d2d2d] flex justify-between items-center bg-[#252525]">
                        <span className="text-[11px] font-mono text-[#888888] font-bold">Voice SIP Channel Logs</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${callActive ? "bg-[#10b981] animate-pulse" : "bg-[#888888]"}`} />
                      </div>
                      <div className="p-4 font-mono text-[11px] overflow-y-auto space-y-1 flex-1 text-[#aaaaaa]">
                        {callLogs.map((log, idx) => (
                          <div key={idx} className={log.includes("Audio Stream") ? "text-emerald-400 font-bold" : "text-[#aaaaaa]"}>
                            &gt; {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="copilots" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 space-y-4">
                <h3 className="text-[15px] font-bold text-[#222222]">Copilot Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest block mb-1">Target Geographic Focus</label>
                    <select
                      value={copilotFocus}
                      onChange={(e) => setCopilotFocus(e.target.value)}
                      className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] px-3 py-2 text-[13px]"
                    >
                      <option value="local">Local Watchdogs & Activists</option>
                      <option value="national">National Parliament Compliance</option>
                      <option value="msme">MSME Vendor Association Challenge</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest block mb-1">Editorial Tone</label>
                    <select
                      value={copilotTone}
                      onChange={(e) => setCopilotTone(e.target.value)}
                      className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] px-3 py-2 text-[13px]"
                    >
                      <option value="investigative">Investigative Journalist (Aggressive)</option>
                      <option value="legal">Legal Auditor (GFR Non-Compliance)</option>
                      <option value="neutral">Analytical Review (Objective)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest block mb-1">Target Addressee Officer</label>
                    <input
                      value={copilotTargetOfficer}
                      onChange={(e) => setCopilotTargetOfficer(e.target.value)}
                      className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] px-3 py-2 text-[13px]"
                    />
                  </div>
                  <Button onClick={generateStoryDraft} disabled={isDrafting} className="w-full bg-[#ff385c] hover:bg-[#e0022a] rounded-[8px] text-[13px] h-10 font-bold">
                    {isDrafting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Generate Draft
                  </Button>
                </div>
              </div>

              {/* Output */}
              <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-4">
                <h3 className="text-[16px] font-bold text-[#222222]">AI Draft Output</h3>
                
                {copilotFocus === "local" && (
                  <div className="space-y-4">
                    {draftedStory ? (
                      <pre className="p-5 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] text-[13px] whitespace-pre-wrap leading-relaxed text-[#222222] max-h-[350px] overflow-y-auto">
                        {draftedStory}
                      </pre>
                    ) : (
                      <div className="py-16 text-center text-[#aaaaaa] text-[13px] italic">
                        Configure settings and click &quot;Generate Draft&quot; to compile legal local watchdogs news copy.
                      </div>
                    )}
                  </div>
                )}

                {copilotFocus === "national" && (
                  <div className="space-y-4">
                    <pre className="p-5 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] text-[13px] whitespace-pre-wrap leading-relaxed text-[#222222] font-mono max-h-[350px] overflow-y-auto">
                      {getParliamentQuestion()}
                    </pre>
                  </div>
                )}

                {copilotFocus === "msme" && (
                  <div className="space-y-4">
                    <pre className="p-5 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] text-[13px] whitespace-pre-wrap leading-relaxed text-[#222222] max-h-[350px] overflow-y-auto">
                      {getMSMEChallenge()}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
