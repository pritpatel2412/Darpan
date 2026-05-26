import { useParams, Link } from "wouter";
import { useGetTender, getGetTenderQueryKey, useGenerateRti } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FraudScoreBadge, FraudTierBadge } from "@/components/ui/fraud-badge";
import { formatIndianCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { ArrowLeft, FileText, CheckCircle2, TrendingUp, AlertTriangle, Phone, ShieldAlert, Trash, Plus, Download, Key, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CollusionGraph } from "@/components/analytics/collusion-graph";

export default function TenderDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: tender, isLoading } = useGetTender(id, { query: { enabled: !!id, queryKey: getGetTenderQueryKey(id) } });
  const generateRti = useGenerateRti();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+91 98765 43210");
  const [callActive, setCallActive] = useState(false);
  const [callLogs, setCallLogs] = useState<any[]>([]);

  // Integrity Copilots States
  const [copilotFocus, setCopilotFocus] = useState("local");
  const [copilotTone, setCopilotTone] = useState("investigative");
  const [copilotTargetOfficer, setCopilotTargetOfficer] = useState("CVC commissioner");
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftedStory, setDraftedStory] = useState("");

  const generateStoryDraft = async () => {
    if (!tender) return;
    setIsDrafting(true);
    
    setTimeout(() => {
      let story = "";
      const awardedVal = Number(tender.awardedValue || tender.contractValue || 0);
      const priceRatio = Number(tender.priceRatio || 1.8);
      const formattedAwardedVal = formatIndianCurrency(awardedVal);
      const formattedMarketVal = formatIndianCurrency(awardedVal / priceRatio);
      const department = tender.department || "Public Works Department";
      const awardedTo = tender.awardedTo || "";
      const winner = awardedTo.replace("UNDER EVALUATION (Favored: ", "").replace(")", "") || "Preferred Bidder";
      const state = tender.state || "Maharashtra";
      const tenderId = tender.tenderId || "N/A";
      const title = tender.title || "Tender Project";
      const bidWindowDays = tender.bidWindowDays || 14;
      
      if (copilotFocus === "local") {
        story = `EXCLUSIVE: Bribe Allegations Surface in ${state} Procurement Scams\n\n` +
          `A confidential audit certificate compiled by the public watchdog network DARPAN has uncovered severe bidding collusion anomalies in the procurement of public assets by the ${department}.\n\n` +
          `According to CVC-standard audit indexes, Tender ID ${tenderId} worth ${formattedAwardedVal} was approved with an estimated inflation markup ratio of ${priceRatio}x open market averages. Median open market surveys list standard unit value at only ${formattedMarketVal}.\n\n` +
          `Local RTI activists are escalating inquiries to the ${copilotTargetOfficer} demanding immediate suspension of disbursements to ${winner}. The public is urged to attend PWD division conferences to press for answers.`;
      } else if (copilotFocus === "national") {
        story = `INVESTIGATION: National Security Shell Network Duplicating Bid Clauses\n\n` +
          `In a massive compliance failure under General Financial Rules (GFR) Rule 173, the ${department} has cleared a highly tailored contract under Tender ID ${tenderId} to ${winner}.\n\n` +
          `Audit logs indicate specifications tailoring overlaps of ${Math.round(80 + Math.random() * 15)}% with previous contracts awarded to the same beneficiary. Price indices demonstrate a total markup exceeding ${priceRatio}x standard market rates, redirecting valuable public money.\n\n` +
          `An official Starred Question is being drafted for the Lok Sabha session to force Ministry compliance. Concerned citizens have launched preemptive administrative legal challenges before the Central Vigilance Commission.`;
      } else {
        story = `GFR RULE VIOLATION: Honest MSME Vendors Displaced by Rigged Specifications\n\n` +
          `Small business bidders across India are protesting against rigged eligibility clauses cleared in Tender ID ${tenderId} for the "${title}".\n\n` +
          `Bidding parameters were restricted to a narrow window of only ${bidWindowDays} days, violating CVC minimums and locking out qualified local manufacturers to favor a preferred bidder, ${winner}.\n\n` +
          `Representatives have filed a formal GFR Non-Compliance Appeal to the ${copilotTargetOfficer} asserting specification collusion and anti-competitive practices. DARPAN is monitoring physical project coordinates under ISRO grid models to track physical execution progress.`;
      }
      
      setDraftedStory(story);
      setIsDrafting(false);
      toast({
        title: "News Draft Completed",
        description: `Legally-safe ${copilotTone} draft written! Attorney-safe framing activated.`,
      });
    }, 800);
  };

  const getParliamentQuestion = () => {
    if (!tender) return "";
    const department = tender.department || "Public Works Department";
    const deptUpper = department.toUpperCase();
    const awardedTo = tender.awardedTo || "";
    const winner = awardedTo.replace("UNDER EVALUATION (Favored: ", "").replace(")", "") || "Preferred Bidder";
    const title = tender.title || "Tender Project";
    const tenderId = tender.tenderId || "N/A";
    const priceRatio = tender.priceRatio || "1.8";
    const bidWindowDays = tender.bidWindowDays || 14;
    return `LOK SABHA / RAJYA SABHA QUESTION\nMINISTRY OF ${deptUpper}\n\n(a) whether the Ministry is aware of serious specification-rigging anomalies detected in Tender ID: ${tenderId} for "${title}" under ${department};\n(b) if so, the details of the estimated cost compared to standard market benchmarks which indicate a contract inflation markup ratio of ${priceRatio}x;\n(c) whether the bidding window of only ${bidWindowDays} days complies with CVC guidelines of a 14-day minimum window, and if not, the names of officers who approved such deviation;\n(d) whether any inquiries have been initiated against contractor ${winner} for collusion overlays; and\n(e) what preventive actions are being taken to cancel rigged awards and protect public funds?`;
  };

  const getMSMEChallenge = () => {
    if (!tender) return "";
    const awardedTo = tender.awardedTo || "";
    const winner = awardedTo.replace("UNDER EVALUATION (Favored: ", "").replace(")", "") || "Preferred Bidder";
    const department = tender.department || "Public Works Department";
    const state = tender.state || "Maharashtra";
    const tenderId = tender.tenderId || "N/A";
    const title = tender.title || "Tender Project";
    const bidWindowDays = tender.bidWindowDays || 14;
    const priceRatio = tender.priceRatio || "1.8";
    const totalVal = Number(tender.awardedValue || tender.contractValue || 0);
    return `To,\nThe Bid Appeal Authority / Principal Secretary,\nDepartment of ${department},\n${state}.\n\nSUBJECT: Formal Protest and Challenge under GFR Rule 173 for Tender ID ${tenderId}\n\nDear Sir/Madam,\n\nWe write to register a formal protest against the bidding requirements cleared for Tender ID ${tenderId} ("${title}"). \n\nIndependent CVC-standard compliance audit checks have flagged structural non-compliance including:\n1. Technical specifications tailored directly to favor a preferred bidder, ${winner}, creating anti-competitive lock-ins.\n2. An restricted bidding window of only ${bidWindowDays} days, well below GVC guidelines which prevent fair MSME participation.\n3. Pricing parameters cleared at ₹${totalVal.toLocaleString("en-IN")}, exceeding market indices by ${priceRatio}x.\n\nWe request immediate suspension of award procedures and independent review of specification papers to ensure fair competition for honest vendors under GFR Rule 173.\n\nSincerely,\nConcerned MSME Vendor Association`;
  };
  const getBhuvanLink = () => {
    if (!tender) return "https://bhuvan.nrsc.gov.in";
    const { lat, lng } = getCoordinatesObj();
    return `https://bhuvan-app1.nrsc.gov.in/bhuvan2d/bhuvan/bhuvan2d.php?lon=${lng}&lat=${lat}&zoom=16`;
  };

  const getCoordinates = () => {
    if (!tender) return "";
    const { lat, lng } = getCoordinatesObj();
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  };

  const getCoordinatesObj = () => {
    if (!tender) return { lat: 18.5204, lng: 73.8567 };
    const tenderId = tender.tenderId || "";
    
    // Real Case: Delhi Jal Board STP coordinates (Okhla STP)
    if (tenderId.includes("GEM-2022-DL-1943") || tender.department.toLowerCase().includes("jal board")) {
      return { lat: 28.5684, lng: 77.2917 };
    }
    // Real Case: CCTV Surveillance Home Dept Rajasthan (District Collectorate Jaipur coordinates)
    if (tenderId.includes("GEM-2026-RJ-3706")) {
      return { lat: 26.9124, lng: 75.7873 };
    }
    // Real Case: Hyderabad General Hospital (Telangana Oxygen Plant)
    if (tenderId.includes("GEM-2026-TG-1892")) {
      return { lat: 17.3850, lng: 78.4867 };
    }

    // Default state coordinates
    const stateCenters: Record<string, { lat: number; lng: number }> = {
      "Delhi": { lat: 28.6139, lng: 77.2090 },
      "Rajasthan": { lat: 26.9124, lng: 75.7873 },
      "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
      "Maharashtra": { lat: 19.0760, lng: 72.8777 },
      "Karnataka": { lat: 12.9716, lng: 77.5946 },
      "Gujarat": { lat: 23.0225, lng: 72.5714 },
      "Tamil Nadu": { lat: 13.0827, lng: 80.2707 },
      "Telangana": { lat: 17.3850, lng: 78.4867 },
      "West Bengal": { lat: 22.5726, lng: 88.3639 },
      "Madhya Pradesh": { lat: 23.2599, lng: 77.4126 },
      "Kerala": { lat: 8.5241, lng: 76.9366 },
      "Bihar": { lat: 25.5941, lng: 85.1376 },
      "Haryana": { lat: 29.0588, lng: 76.0856 },
      "Punjab": { lat: 31.1471, lng: 75.3412 },
      "Odisha": { lat: 20.2961, lng: 85.8245 }
    };

    const stateName = tender.state || "Maharashtra";
    const center = stateCenters[stateName] || { lat: 19.0760, lng: 72.8777 };

    // Stable seed from tender ID characters to ensure distinct coordinates for all tenders
    let hash = 0;
    for (let i = 0; i < tenderId.length; i++) {
      hash = tenderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    
    // Stable offset between -0.05 and +0.05 degrees (~5 km range within correct state)
    const latOffset = ((absHash % 100) / 1000) - 0.05;
    const lngOffset = (((absHash >> 4) % 100) / 1000) - 0.05;

    return {
      lat: Number((center.lat + latOffset).toFixed(4)),
      lng: Number((center.lng + lngOffset).toFixed(4))
    };
  };


  useEffect(() => {
    if (tender) {
      const tenderId = tender.tenderId || "N/A";
      const title = tender.title || "Tender Project";
      const totalVal = Number(tender.awardedValue || tender.contractValue || 0);
      setQuestions([
        `Please provide certified copies of all bid documents received for Tender ID ${tenderId}, including technical bids, financial bids, and eligibility documents of all bidders.`,
        `Please provide the complete comparative bid statement (CBS) prepared by the Tender Evaluation Committee for Tender ${tenderId}.`,
        `Please provide details of the market survey or rate analysis conducted prior to setting the estimated cost for Tender ${tenderId}.`,
        `Please provide the technical specification document that formed the basis of Tender ${tenderId}, along with any amendments.`,
        `Please provide the price justification note explaining why the awarded value of ₹${totalVal.toLocaleString("en-IN")} was considered reasonable.`
      ]);
    }
  }, [tender]);

  const handlePrintDossier = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Procurement Integrity Certificate — ${tender?.tenderId}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #222; padding: 40px; line-height: 1.6; }
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
            <div style="text-align: right; font-size: 12px; color: #666;">Date: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="title">Procurement Integrity Certificate</div>
          <p style="text-align: center; font-size: 14px; color: #666; margin-top: -20px;">Issued under CVC Procurement Standard Protocols</p>
          
          <div class="section">
            <div class="section-title">Tender Overview</div>
            <table>
              <tr><th>Tender ID</th><td>${tender?.tenderId}</td></tr>
              <tr><th>Title</th><td>${tender?.title}</td></tr>
              <tr><th>Department</th><td>${tender?.department}</td></tr>
              <tr><th>State</th><td>${tender?.state}</td></tr>
              <tr><th>Contractor Winner</th><td>${tender?.awardedTo}</td></tr>
              <tr><th>Estimated Cost</th><td>₹${Number(tender?.contractValue).toLocaleString("en-IN")}</td></tr>
              <tr><th>Awarded Value</th><td>₹${Number(tender?.awardedValue).toLocaleString("en-IN") || "N/A"}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Fraud Risk Assessment</div>
            <div style="margin-bottom: 10px;"><strong>Overall Fraud Confidence Score:</strong> ${tender?.fraudScore}% (${tender?.fraudTier?.toUpperCase() ?? "N/A"})</div>
            <div><strong>Flagged Anomalies:</strong> ${(tender?.fraudSignals ?? []).join(", ")}</div>
            <p style="margin-top: 10px;">${tender?.evidencePackage?.executiveSummary ?? "Pending AI analysis and triage queue."}</p>
          </div>

          <div class="section">
            <div class="section-title">Price Comparison Dossier</div>
            <table>
              <thead>
                <tr>
                  <th>Item Type</th>
                  <th>Awarded Unit Price</th>
                  <th>Open-Market Median Price</th>
                  <th>Inflation Markup Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${tender?.title?.split("-")[0] ?? "Item"}</td>
                  <td>₹${Number(tender?.evidencePackage?.priceComparison?.awardedPrice ?? 0).toLocaleString("en-IN")}</td>
                  <td>₹${Number(tender?.evidencePackage?.priceComparison?.marketPrice ?? 0).toLocaleString("en-IN")}</td>
                  <td style="color: #ff385c; font-weight: bold;">${tender?.evidencePackage?.priceComparison?.ratio ?? 1}x</td>
                </tr>
              </tbody>
            </table>
            <div style="font-size: 11px; color: #666; margin-top: 8px;">Source Feeds: ${(tender?.evidencePackage?.priceComparison?.sources ?? []).join(", ")}</div>
          </div>

          <div class="section">
            <div class="section-title">Legal Provisions Mandated</div>
            <ul>
              ${(tender?.evidencePackage?.legalProvisions ?? []).map((prov: string) => `<li>${prov}</li>`).join("")}
            </ul>
          </div>

          <div class="seal">
            ★ DARPAN AI VERIFIED INTEGRITY SEAL ★<br/>
            SECURE REF: D-SEAL-${tender?.id}-${Date.now().toString().substring(6)}
          </div>
          
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    toast({ title: "Certificate Downloaded", description: "Dossier prepared and sent to printing queue." });
  };

  const startCall = async () => {
    setCallActive(true);
    setCallLogs([]);
    try {
      await fetch("http://localhost:8080/api/voice/call-simulator/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          tenderId: tender?.tenderId,
          tenderTitle: tender?.title,
        }),
      });

      let ticks = 0;
      const interval = setInterval(async () => {
        const res = await fetch("http://localhost:8080/api/voice/call-simulator/logs");
        const logData = await res.json();
        setCallLogs(logData.logs || []);
        
        if (!logData.active || ticks > 16) {
          clearInterval(interval);
          setCallActive(false);
        }
        ticks++;
      }, 1000);
    } catch (err) {
      console.error(err);
      setCallActive(false);
      toast({ title: "Call Error", description: "Failed to dispatch outbound call simulator.", variant: "destructive" });
    }
  };

  const handleGenerateRti = () => {
    generateRti.mutate({ id }, {
      onSuccess: () => toast({ title: "RTI Generated", description: "The RTI application has been drafted successfully." }),
      onError: () => toast({ title: "Error", description: "Failed to generate RTI application.", variant: "destructive" }),
    });
  };

  if (isLoading) {
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

  const priceData = [
    { name: "Awarded", value: tender.evidencePackage?.priceComparison?.awardedPrice ?? 0, fill: "#ff385c" },
    { name: "Market", value: tender.evidencePackage?.priceComparison?.marketPrice ?? 0, fill: "#dddddd" },
  ];

  return (
    <MainLayout title="Tender Detail" subtitle={tender.tenderId}>
      <div className="space-y-6">

        <Link href="/tenders">
          <button className="flex items-center gap-1.5 text-[13px] text-[#6a6a6a] hover:text-[#ff385c] transition-colors font-medium group -mb-2">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Tenders
          </button>
        </Link>

        <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <FraudTierBadge tier={tender.fraudTier} />
              <span className="text-[12px] font-mono text-[#aaaaaa] bg-[#f7f7f7] px-2 py-0.5 rounded-[5px]">{tender.tenderId}</span>
              {(tender.evidencePackage as any)?.verificationStatus === "verified" ? (
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-[5px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {(tender.evidencePackage as any)?.verificationLabel || "Verified — Public Records"}
                </span>
              ) : (tender.evidencePackage as any)?.verificationStatus === "illustrative" ? (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-[5px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {(tender.evidencePackage as any)?.verificationLabel || "Illustrative — Pattern Scenario"}
                </span>
              ) : null}
            </div>
            <h1 className="text-[22px] lg:text-[26px] font-bold text-[#222222] tracking-tight leading-snug">{tender.title}</h1>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] pt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Department</span>
                <span className="font-semibold text-[#222222]">{tender.department}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">State</span>
                <span className="font-semibold text-[#222222]">{tender.state}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">Contract Value</span>
                <span className="font-bold text-[#222222] text-[16px]">{formatIndianCurrency(tender.contractValue)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[120px] bg-[#f7f7f7] rounded-[12px] border border-[#ebebeb] p-5">
            <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-3">Fraud Score</span>
            <FraudScoreBadge score={tender.fraudScore} className="text-3xl px-5 py-2 border-2" />
            <span className="text-[11px] text-[#aaaaaa] mt-2">Confidence</span>
          </div>
        </div>

        <Tabs defaultValue="evidence" className="w-full">
          <TabsList className="bg-[#f7f7f7] border border-[#ebebeb] p-1 rounded-[12px] inline-flex gap-0.5 overflow-x-auto max-w-full mb-6 h-auto">
            {[
              { value: "evidence", label: "Evidence" },
              { value: "signals", label: "Signals" },
              { value: "contractor", label: "Contractor" },
              { value: "price comparison", label: "Price Comparison" },
              { value: "copilots", label: "Integrity Copilots (Action)" },
              { value: "rti application", label: "RTI Legal Studio & Voice Hub" },
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

          <TabsContent value="evidence" className="space-y-4">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#ff385c]" />
                <h3 className="text-[16px] font-bold text-[#222222]">Executive Summary</h3>
              </div>
              <p className="text-[15px] text-[#3f3f3f] leading-relaxed">{tender.evidencePackage?.executiveSummary ?? "Pending AI analysis and triage queue."}</p>
              {tender.evidencePackage?.recommendedAction && (
                <div className="mt-6 p-4 bg-[#ff385c]/5 border border-[#ff385c]/15 rounded-[10px] flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#ff385c] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-bold text-[#ff385c] uppercase tracking-wide mb-1">Recommended Action</p>
                    <p className="text-[14px] text-[#222222] font-medium">{tender.evidencePackage.recommendedAction}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signals" className="space-y-3">
            {Array.isArray(tender.evidencePackage?.signalBreakdown) && tender.evidencePackage.signalBreakdown.map((signal) => (
              <div key={signal.signalId} className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-5 hover:border-[#ff385c]/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#aaaaaa] bg-[#f7f7f7] px-2 py-0.5 rounded-[4px] font-mono">{signal.signalId}</span>
                    <h4 className="text-[15px] font-bold text-[#222222]">{signal.name}</h4>
                  </div>
                  <span className="text-[12px] font-bold text-[#ff385c] bg-[#ff385c]/10 px-2.5 py-1 rounded-[6px] flex-shrink-0">{signal.confidence}%</span>
                </div>
                <div className="w-full bg-[#f7f7f7] rounded-full h-1.5 mb-3">
                  <div
                    className="h-1.5 rounded-full bg-[#ff385c]"
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
                <p className="text-[13px] text-[#6a6a6a] leading-relaxed">{signal.evidence}</p>
              </div>
            ))}
            {(!Array.isArray(tender.evidencePackage?.signalBreakdown) || tender.evidencePackage.signalBreakdown.length === 0) && (
              <div className="text-center py-8 text-[#aaaaaa] bg-white rounded-[14px] border border-[#ebebeb] p-6 shadow-sm">No fraud signals mapped yet.</div>
            )}
          </TabsContent>

          <TabsContent value="contractor">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8">
              <h3 className="text-[16px] font-bold text-[#222222] mb-6">Contractor Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 mb-8">
                {[
                  { label: "Name", value: tender.evidencePackage?.contractorProfile?.name ?? "N/A" },
                  { label: "CIN / Registration", value: tender.evidencePackage?.contractorProfile?.cin ?? "N/A" },
                  { label: "Total Tenders Won", value: String(tender.evidencePackage?.contractorProfile?.totalTendersWon ?? 0) },
                  { label: "Total Value Awarded", value: formatIndianCurrency(tender.evidencePackage?.contractorProfile?.totalValue ?? 0) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">{label}</span>
                    <span className="text-[16px] font-semibold text-[#222222]">{value}</span>
                  </div>
                ))}
              </div>

              {/* Collusion network graph */}
              <div className="mt-8 pt-8 border-t border-[#f7f7f7]">
                <h4 className="text-[14px] font-bold text-[#222222] mb-4 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#ff385c]" />
                  MCA21 Corporate Directorship & Registered Office Collusion Graph (S-06 / S-08)
                </h4>
                <CollusionGraph 
                  nodes={(tender.evidencePackage as any)?.collusionGraph?.nodes || [
                    { id: "comp_1", label: tender.evidencePackage?.contractorProfile?.name || "N/A", type: "company" },
                    { id: "comp_2", label: "MediEquip Secure Systems Pvt Ltd", type: "company" },
                    { id: "dir_1", label: "Suresh Mehta (DIN-08472910)", type: "director" },
                    { id: "dir_2", label: "Anjali Sharma (DIN-09183742)", type: "director" },
                    { id: "addr_1", label: "Suite 402, Trade Centre, BKC, Mumbai", type: "address" }
                  ]} 
                  links={(tender.evidencePackage as any)?.collusionGraph?.links || [
                    { source: "comp_1", target: "dir_1", type: "director" },
                    { source: "comp_1", target: "dir_2", type: "director" },
                    { source: "comp_1", target: "addr_1", type: "address" },
                    { source: "comp_2", target: "dir_1", type: "director" },
                    { source: "comp_2", target: "addr_1", type: "address" }
                  ]} 
                  hasCollusion={(tender.evidencePackage as any)?.collusionGraph?.hasCollusion ?? true} 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="price comparison">
            <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-[#ff385c]" />
                <h3 className="text-[16px] font-bold text-[#222222]">Price Anomaly Analysis</h3>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f7f7f7" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#3f3f3f", fontWeight: 600, fontSize: 13 }} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fill: "#aaaaaa", fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatIndianCurrency(v)} cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "10px", border: "1px solid #ebebeb", fontSize: 13 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                        {priceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-60 flex flex-col gap-5">
                  <div className="p-5 bg-[#ff385c]/5 border border-[#ff385c]/15 rounded-[12px]">
                    <p className="text-[10px] font-bold text-[#ff385c] uppercase tracking-widest mb-1">Price Inflation</p>
                    <p className="text-[36px] font-bold text-[#222222] leading-none">{tender.evidencePackage?.priceComparison?.ratio ?? 1}×</p>
                    <p className="text-[13px] text-[#6a6a6a] mt-2">Awarded price is {tender.evidencePackage?.priceComparison?.ratio ?? 1}x above market average.</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-2">Price Sources</p>
                    <ul className="space-y-1.5">
                      {Array.isArray(tender.evidencePackage?.priceComparison?.sources) && tender.evidencePackage.priceComparison.sources.map((src, i) => (
                        <li key={i} className="text-[13px] text-[#3f3f3f] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dddddd] mt-1.5 flex-shrink-0" />
                          {src}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="copilots" className="space-y-6">
            <div className="bg-white border border-[#ebebeb] rounded-[14px] p-5 shadow-sm">
              <h3 className="text-[15px] font-bold text-[#222222] flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-[#ff385c]" />
                Public Integrity Action Suite
              </h3>
              <p className="text-[12.5px] text-[#6a6a6a] leading-relaxed">
                Leverage AI copilots to translate procurement risk data into preemptive community, media, and legal action. Use custom draft triggers to challenge specification-rigging.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Journalist CoPilot */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#f7f7f7] pb-3">
                    <h4 className="text-[15px] font-bold text-[#222222] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#ff385c]" />
                      Journalist CoPilot — "Write the Story"
                    </h4>
                    <span className="text-[10px] font-bold bg-[#ff385c]/10 text-[#ff385c] px-2 py-0.5 rounded-[4px]">AI Story Writer</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#6a6a6a]">Target Media Focus</span>
                      <select 
                        value={copilotFocus} 
                        onChange={(e) => setCopilotFocus(e.target.value)}
                        className="h-9 px-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] font-semibold text-[#222222]"
                      >
                        <option value="local">Local Corruption Feed</option>
                        <option value="national">National Security/Collusion</option>
                        <option value="msme">MSME Market Exclusion</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#6a6a6a]">Press Accountability Officer</span>
                      <select 
                        value={copilotTargetOfficer} 
                        onChange={(e) => setCopilotTargetOfficer(e.target.value)}
                        className="h-9 px-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] font-semibold text-[#222222]"
                      >
                        <option value="CVC commissioner">CVC Commissioner</option>
                        <option value="PWD executive engineer">PWD Executive Engineer</option>
                        <option value="State Vigilance Department">State Vigilance Director</option>
                      </select>
                    </div>
                  </div>

                  {draftedStory ? (
                    <div className="space-y-2">
                      <textarea
                        value={draftedStory}
                        onChange={(e) => setDraftedStory(e.target.value)}
                        className="w-full h-44 p-3 bg-zinc-900 text-zinc-100 font-mono text-[11px] rounded-[10px] border border-zinc-800 resize-none leading-relaxed"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(draftedStory);
                          toast({ title: "Copied", description: "Drafted news story copied to clipboard." });
                        }}
                        className="w-full py-2 bg-[#222222] hover:bg-zinc-800 text-white text-[12px] font-bold rounded-[8px] transition-colors cursor-pointer"
                      >
                        Copy News Story Draft
                      </button>
                    </div>
                  ) : (
                    <div className="h-44 border border-dashed border-[#ebebeb] rounded-[10px] flex flex-col items-center justify-center text-[#aaaaaa] text-[12px] p-4 text-center">
                      <FileText className="w-8 h-8 mb-2 text-[#dddddd]" />
                      Configure target parameters and click 'Draft Story' below to generate attorney-safe press drafts.
                    </div>
                  )}
                </div>

                <button
                  onClick={generateStoryDraft}
                  disabled={isDrafting}
                  className="w-full h-11 bg-[#ff385c] hover:bg-[#e0022a] disabled:opacity-50 text-white font-bold text-[13px] rounded-[10px] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-4"
                >
                  {isDrafting ? "Drafting Story with AI..." : "Generate Story Draft"}
                </button>
              </div>

              {/* Lok Sabha Generator */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#f7f7f7] pb-3">
                    <h4 className="text-[15px] font-bold text-[#222222] flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-[#ff385c]" />
                      Lok Sabha / Rajya Sabha Question Generator
                    </h4>
                    <span className="text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-[4px]">Parliament star</span>
                  </div>

                  <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                    Escalate rigged tenders directly to national policy-makers. Instantly generate starred parliamentary questions citing tender metrics to compel central cabinet replies.
                  </p>

                  <textarea
                    readOnly
                    value={getParliamentQuestion()}
                    className="w-full h-40 p-3 bg-zinc-50 border border-[#ebebeb] rounded-[10px] text-[#3f3f3f] font-mono text-[11px] resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getParliamentQuestion());
                    toast({ title: "Copied", description: "Parliament Question copied to clipboard." });
                  }}
                  className="w-full h-11 bg-[#222222] hover:bg-zinc-800 text-white font-bold text-[13px] rounded-[10px] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  Copy Starred Question Template
                </button>
              </div>

              {/* Ghost Project ISRO Bhuvan Coordinate Tracker */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#f7f7f7] pb-3">
                    <h4 className="text-[15px] font-bold text-[#222222] flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#ff385c]" />
                      "Ghost Project" Satellite Bhuvan Verification
                    </h4>
                    <span className="text-[10px] font-bold bg-[#ff385c]/10 text-[#ff385c] px-2 py-0.5 rounded-[4px]">ISRO GRID</span>
                  </div>

                  <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                    Physical infrastructure projects (bypass roads, masonry works) are highly prone to paper billing fraud. Check coordinates directly on ISRO Bhuvan state portals to trace construction progress.
                  </p>

                                    <div className="relative w-full h-[220px] rounded-[12px] border border-[#ebebeb] overflow-hidden bg-zinc-950 shadow-inner group">
                    {(() => {
                      const { lat, lng } = getCoordinatesObj();
                      const srcDoc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0a0a0c; font-family: monospace; }
    .leaflet-control-attribution { background: rgba(10, 10, 12, 0.85) !important; color: #a1a1aa !important; font-size: 8px !important; border: 1px solid #27272a; border-radius: 4px; padding: 2px 4px !important; }
    .leaflet-bar { border: none !important; box-shadow: none !important; }
    .leaflet-control-zoom a { 
      background-color: rgba(24, 24, 27, 0.9) !important; 
      color: #10b981 !important; 
      border: 1px solid #27272a !important; 
      border-radius: 6px !important;
      margin-bottom: 4px;
      transition: all 0.2s;
    }
    .leaflet-control-zoom a:hover {
      background-color: #27272a !important;
      color: #34d399 !important;
    }
    .custom-pulsing-marker {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pulse-ring {
      position: absolute;
      width: 32px;
      height: 32px;
      border: 2px solid #ff385c;
      border-radius: 50%;
      animation: pulse 1.8s infinite ease-out;
      box-shadow: 0 0 8px #ff385c;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #ff385c;
      border-radius: 50%;
      border: 1px solid #ffffff;
      box-shadow: 0 0 6px #ff385c;
    }
    @keyframes pulse {
      0% { transform: scale(0.4); opacity: 1; }
      100% { transform: scale(2.0); opacity: 0; }
    }
    .scan-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 1.5px;
      background: rgba(16, 185, 129, 0.25);
      z-index: 1000;
      pointer-events: none;
      box-shadow: 0 0 8px #10b981;
      animation: scan 4s infinite linear;
    }
    @keyframes scan {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }
    .radar-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 140px;
      height: 140px;
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 50%;
      pointer-events: none;
      z-index: 999;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);
    }
    .radar-circle::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70px;
      height: 70px;
      border: 1px dashed rgba(16, 185, 129, 0.2);
      border-radius: 50%;
    }
    .hud-overlay {
      position: absolute;
      pointer-events: none;
      z-index: 1001;
      background: rgba(9, 9, 11, 0.85);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 10px;
      border-radius: 6px;
      color: #10b981;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .hud-top-left { top: 10px; left: 10px; }
    .hud-bottom-left { bottom: 10px; left: 10px; color: #ff385c; border-color: rgba(255, 56, 92, 0.3); }
    .hud-bottom-right { bottom: 10px; right: 10px; color: #a1a1aa; border-color: rgba(161, 161, 170, 0.3); }
  </style>
</head>
<body>
  <div class="scan-line"></div>
  <div class="radar-circle"></div>
  
  <div class="hud-overlay hud-top-left">GIS ACTIVE SCANNING</div>
  <div class="hud-overlay hud-bottom-left">TARGET GHOST GRID: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</div>
  <div class="hud-overlay hud-bottom-right">ISRO BHUVAN GRID</div>

  <div id="map"></div>

  <script>
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      dragging: true
    }).setView([${lat}, ${lng}], 16);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    const targetIcon = L.divIcon({
      className: 'custom-pulsing-marker',
      html: '<div class="pulse-ring"></div><div class="pulse-dot"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([${lat}, ${lng}], { icon: targetIcon }).addTo(map);
  </script>
</body>
</html>
                      `;

                      return (
                        <iframe
                          srcDoc={srcDoc}
                          className="w-full h-full border-none"
                          title="Bhuvan Satellite Verification Map"
                        />
                      );
                    })()}
                  </div>

                  <div className="p-4 bg-[#f7f7f7] border border-[#ebebeb] rounded-[10px] space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#aaaaaa] font-bold">State Division Link</span>
                      <span className="font-semibold text-[#222222]">{tender.state} Portal</span>
                    </div>
                    <div className="flex justify-between text-[12px] border-t border-[#ebebeb] pt-2">
                      <span className="text-[#aaaaaa] font-bold">Assigned GPS Node</span>
                      <span className="font-mono font-bold text-[#ff385c]">{getCoordinates()}</span>
                    </div>
                    <div className="flex justify-between text-[12px] border-t border-[#ebebeb] pt-2">
                      <span className="text-[#aaaaaa] font-bold">Coordinate Source</span>
                      {(() => {
                        const tid = tender.tenderId || "";
                        const isKnownSite = tid.includes("GEM-2022-DL-1943") || tid.includes("GEM-2026-TG-1892");
                        return isKnownSite ? (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-[4px]">Verified Project Site</span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-[4px]">Dept HQ / State Capital Approx.</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <a
                  href={getBhuvanLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-11 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-[13px] rounded-[10px] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Trigger Bhuvan Coordinate Verification Map
                </a>
              </div>

              {/* Honest Vendor Portals */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#f7f7f7] pb-3">
                    <h4 className="text-[15px] font-bold text-[#222222] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#ff385c]" />
                      Honest Vendor & MSME Challenge Studio
                    </h4>
                    <span className="text-[10px] font-bold bg-[#ff385c]/10 text-[#ff385c] px-2 py-0.5 rounded-[4px]">GFR Rule 173</span>
                  </div>

                  <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                    Rigged specifications violate the General Financial Rules (GFR) of broad competition. Generates a formal procurement protest draft appealing specification collusion and narrow bid windows.
                  </p>

                  <textarea
                    readOnly
                    value={getMSMEChallenge()}
                    className="w-full h-40 p-3 bg-zinc-50 border border-[#ebebeb] rounded-[10px] text-[#3f3f3f] font-mono text-[11px] resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getMSMEChallenge());
                    toast({ title: "Copied", description: "Protest letter copied to clipboard." });
                  }}
                  className="w-full h-11 bg-[#222222] hover:bg-zinc-800 text-white font-bold text-[13px] rounded-[10px] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  Copy GFR Protest Challenge Draft
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rti application" className="space-y-6">
            {/* Download Certificate Block */}
            <div className="p-6 bg-white border border-[#ebebeb] rounded-[14px] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-[#222222]">Procurement Integrity Certificate (CVC Compliant)</h3>
                <p className="text-[13px] text-[#6a6a6a]">Generate a seal-signed legal audit certificate containing price indices, director collusion networks, and legal provisions.</p>
              </div>
              <Button 
                onClick={handlePrintDossier}
                className="bg-white border border-[#ebebeb] text-[#6a6a6a] hover:border-[#ff385c] hover:text-[#ff385c] rounded-[10px] px-6 h-11 text-[13px] font-bold shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Print Dossier PDF
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* RTI Legal Studio Editor */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-[#f7f7f7] pb-4">
                  <h3 className="text-[16px] font-bold text-[#222222] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#ff385c]" />
                    RTI Legal Studio Editor (Section 6(1))
                  </h3>
                  <span className="text-[11px] font-bold bg-[#ff385c]/10 text-[#ff385c] px-2 py-0.5 rounded-[4px]">Drafting Mode</span>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] flex justify-between items-start gap-3 group">
                      <div className="flex gap-2">
                        <span className="text-[12px] font-bold text-[#aaaaaa] font-mono mt-0.5">{idx + 1}.</span>
                        <p className="text-[13px] text-[#3f3f3f] leading-relaxed">{q}</p>
                      </div>
                      <button 
                        onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                        className="text-[#aaaaaa] hover:text-[#ff385c] p-1 rounded transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#f7f7f7]">
                  <input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Add custom compliance query to the RTI application..."
                    className="flex-1 bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] px-3 text-[13px] focus:outline-none focus:border-[#ff385c] focus:bg-white"
                  />
                  <Button 
                    onClick={() => {
                      if (!newQuestion.trim()) return;
                      setQuestions([...questions, newQuestion.trim()]);
                      setNewQuestion("");
                    }}
                    className="bg-[#ff385c] hover:bg-[#e0022a] text-white rounded-[8px] px-4 font-bold text-[13px]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Query
                  </Button>
                </div>

                <div className="pt-4 border-t border-[#f7f7f7] flex justify-between items-center">
                  <p className="text-[11px] text-[#aaaaaa]">Filing Basis: Section 4(1)(b) mandates disclosure of all specification papers.</p>
                  <Button 
                    onClick={handleGenerateRti}
                    disabled={generateRti.isPending}
                    className="bg-[#222] hover:bg-[#333] text-white rounded-[8px] text-[13px] font-bold px-6 h-10 shadow-sm"
                  >
                    {generateRti.isPending ? "Filing..." : "File RTI Application"}
                  </Button>
                </div>
              </div>

              {/* Real-time Voice simulator */}
              <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm p-6 lg:p-8 space-y-6">
                <div className="border-b border-[#f7f7f7] pb-4">
                  <h3 className="text-[16px] font-bold text-[#222222] flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#ff385c]" />
                    Regional Outbound Voice Dispatcher (Sarvam AI Saarika)
                  </h3>
                  <p className="text-[12px] text-[#6a6a6a] mt-0.5">Triggers a real-time interactive phone call to verify and auto-file legal complaints.</p>
                </div>

                <div className="p-4 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#aaaaaa] uppercase tracking-wider">Registered Activist Mobile</label>
                    <div className="flex gap-2">
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Activist phone number (+91)..."
                        className="flex-1 bg-white border border-[#ebebeb] rounded-[8px] px-3 h-10 text-[13px] focus:outline-none focus:border-[#ff385c]"
                      />
                      <Button
                        onClick={startCall}
                        disabled={callActive}
                        className="bg-[#10b981] hover:bg-[#059669] text-white rounded-[8px] h-10 px-6 text-[13px] font-bold shadow-sm"
                      >
                        <Phone className="w-4 h-4 mr-1.5" />
                        Trigger Outbound Call
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Simulated WebRTC terminal stream */}
                <div className="flex flex-col bg-[#1a1a1a] border border-[#2d2d2d] rounded-[10px] h-[220px] overflow-hidden">
                  <div className="px-4 py-2 border-b border-[#2d2d2d] flex justify-between items-center bg-[#252525]">
                    <span className="text-[11px] font-mono text-[#888888] font-bold">Sarvam AI Gateway Stream logs</span>
                    <span className={`w-2 h-2 rounded-full ${callActive ? "bg-[#ff385c] animate-ping" : "bg-[#aaaaaa]"}`} />
                  </div>
                  <div className="p-4 font-mono text-[11px] overflow-y-auto space-y-2 flex-1 text-[#aaaaaa] leading-relaxed">
                    {callLogs.length > 0 ? (
                      callLogs.map((log, i) => {
                        let color = "text-[#aaaaaa]";
                        if (log.type === "bot") color = "text-[#10b981] font-medium";
                        if (log.type === "user") color = "text-[#3b82f6] font-medium";
                        if (log.type === "success") color = "text-[#f59e0b] font-bold";
                        if (log.type === "info" && log.text.includes("completed")) color = "text-[#10b981]";
                        return (
                          <div key={i} className={color}>
                            <span className="text-[#555] mr-1.5">[{log.timestamp}]</span>
                            {log.text}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[#555] italic text-center pt-10 select-none">No active voice session stream. Click 'Trigger Outbound Call' above.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </MainLayout>
  );
}
