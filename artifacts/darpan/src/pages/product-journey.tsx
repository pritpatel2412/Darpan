import { useState, useEffect } from "react";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Server,
  Fingerprint,
  LayoutDashboard,
  FileSearch,
  Building2,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  AlertOctagon,
  Code,
  Settings,
  Scale,
  Sparkles,
} from "lucide-react";

interface Step {
  title: string;
  icon: any;
  tagline: string;
  description: string;
  mvpLink: string;
  mvpLinkLabel: string;
}

const steps: Step[] = [
  {
    title: "Crawler Ingestion",
    icon: Server,
    tagline: "High-Throughput Scraping & Parsing",
    description: "DARPAN's background workers scan municipal, state, and central e-procurement portals (such as GeM) to parse tenders, bid documents, and contractor catalog structures into structured JSON.",
    mvpLink: "/sandbox",
    mvpLinkLabel: "Test Crawler in Scraper Sandbox",
  },
  {
    title: "Fraud Scoring Engine",
    icon: Fingerprint,
    tagline: "7+ Non-Contiguous Heuristic Checks",
    description: "The system runs heuristic scans (pricing gap analysis, bid clustering, win rotation concentration) and NLP similarity engines to compute an overall 0-100 fraud confidence score.",
    mvpLink: "/tenders",
    mvpLinkLabel: "Explore Tenders Feed",
  },
  {
    title: "Live Alerts Dashboard",
    icon: LayoutDashboard,
    tagline: "Real-Time Corruption Ticker",
    description: "Flagged tenders immediately stream into the central monitoring console, updating state heatmaps, department leaderboards, and total detected leakage calculations.",
    mvpLink: "/",
    mvpLinkLabel: "View Live Dashboard Stats",
  },
  {
    title: "Deep Investigation",
    icon: FileSearch,
    tagline: "High-Fidelity Evidence Packages",
    description: "Investigators open individual flagged tenders to review the specific mathematical and NLP breakdown of each signal, including contractor bid amounts and price discrepancies.",
    mvpLink: "/tenders",
    mvpLinkLabel: "Inspect Flags inside Tenders",
  },
  {
    title: "Cartel Network Graph",
    icon: Building2,
    tagline: "Contractor Collusion Profiling",
    description: "Cross-checks contractor profiles, unique CIN data, new entities, and direct department bid pairings. Generates visual network graphs to expose contractor win rotation groups.",
    mvpLink: "/network",
    mvpLinkLabel: "Render Corruption Network",
  },
  {
    title: "Legal RTI Filings",
    icon: FileCheck,
    tagline: "Automated Citizen Action & Tracker",
    description: "Converts structured evidence findings into formatted legal RTI requests directed to relevant PIOs, tracking filing status, and automatic statutory response countdowns.",
    mvpLink: "/rti-tracker",
    mvpLinkLabel: "Track RTIs in Compliance Vault",
  },
];

export default function ProductJourney() {
  const [activeStep, setActiveStep] = useState(0);

  // Step 1 Simulation: Logging Terminal
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => {
    if (activeStep !== 0) return;
    setLogs([
      "READY: scraper-sandbox-worker active",
      "SYSTEM: listening on e-procurement GeM hooks...",
      "FETCH: GET gem.gov.in/tenders/latest -> status 200",
      "PARSER: Ingested tender ID: GEM/2026/B/881273 - Municipal Health Supplies",
    ]);

    const interval = setInterval(() => {
      const mockStatements = [
        "PARSER: Extracted contractor list: [Vardhman Traders, Krishna Agency, Sai Surgical]",
        "NLP: Extracted technical specification payload (1.2KB)",
        "DB: Inserted raw tender record into postgres.public.tenders (14ms)",
        "ENG: Dispatching fraud-scorer queues for tender GEM/2026/B/881273",
        "S-01: Calculated price discrepancy: awarded at ₹84.3L vs market ₹42.1L (+100.2%)",
        "S-02: Spec-Tailoring similarity check complete: matching ratio 84.1%",
        "S-03: Vardhman win concentration in health department is 72.4% (Critical)",
        "ENG: Scoring completed. Weighted index: 88/100 (Tier: CRITICAL)",
        "ALERT: Streamed GEM/2026/B/881273 to Dashboard Live Ticker",
      ];
      setLogs((prev) => {
        const next = [...prev, mockStatements[Math.floor(Math.random() * mockStatements.length)]];
        if (next.length > 8) next.shift();
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [activeStep]);

  // Step 2 Simulation: Interactive Real-Time Scorer
  const [awardedPrice, setAwardedPrice] = useState(7500000);
  const [marketPrice, setMarketPrice] = useState(4000000);
  const [winRatio, setWinRatio] = useState(45);
  const [specMatch, setSpecMatch] = useState(40);

  const calculateInteractiveScore = () => {
    const s1PriceGap = Math.max(0, ((awardedPrice - marketPrice) / marketPrice) * 100);
    const s1Contribution = Math.min(25, (s1PriceGap / 100) * 25);
    const s2Contribution = (specMatch / 100) * 20;
    const s3Contribution = winRatio > 65 ? 20 : (winRatio / 65) * 10;
    const rawScore = s1Contribution + s2Contribution + s3Contribution + 20; // baseline signals
    return Math.round(Math.min(100, rawScore));
  };

  const interactiveScore = calculateInteractiveScore();
  const interactiveTier = interactiveScore >= 80 ? "CRITICAL" : interactiveScore >= 60 ? "HIGH" : interactiveScore >= 40 ? "MEDIUM" : "LOW";

  return (
    <MainLayout
      title="Product Journey & User Flow"
      subtitle="Interactive step-by-step walkthrough of the DARPAN system pipeline"
    >
      <div className="max-w-6xl mx-auto space-y-8 select-none">
        
        {/* Step Navigation Pipeline */}
        <div className="bg-white border border-[#ebebeb] p-6 rounded-[20px] shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ebebeb_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCurrent = index === activeStep;
              const isPassed = index < activeStep;
              
              return (
                <div key={index} className="flex-1 flex items-center">
                  <button
                    onClick={() => setActiveStep(index)}
                    className="flex flex-col items-center group text-center focus:outline-none flex-1"
                  >
                    <div
                      className={`w-11 h-11 rounded-[12px] flex items-center justify-center transition-all ${
                        isCurrent
                          ? "bg-[#ff385c] text-white shadow-md scale-105"
                          : isPassed
                          ? "bg-[#ff385c]/10 text-[#ff385c]"
                          : "bg-[#f7f7f7] border border-[#ebebeb] text-[#aaaaaa]"
                      }`}
                    >
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <span
                      className={`text-[12px] font-bold mt-2 transition-colors ${
                        isCurrent
                          ? "text-[#ff385c]"
                          : isPassed
                          ? "text-[#222222]"
                          : "text-[#aaaaaa] group-hover:text-[#6a6a6a]"
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>

                  {index < steps.length - 1 && (
                    <div className="w-full h-0.5 max-w-[40px] md:max-w-[70px] self-start mt-5 mx-2 bg-[#ebebeb] relative">
                      <div
                        className="absolute h-full bg-[#ff385c] transition-all duration-500"
                        style={{ width: isPassed ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Presentation Sandbox */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left panel - Content */}
          <div className="md:col-span-2 flex flex-col justify-between bg-white border border-[#ebebeb] p-8 rounded-[20px] shadow-2xs">
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff385c] bg-[#ff385c]/10 px-2.5 py-1 rounded-[6px]">
                Step {activeStep + 1} of 6
              </span>
              <h3 className="text-[24px] font-bold text-[#222222] tracking-tight leading-tight">
                {steps[activeStep].tagline}
              </h3>
              <p className="text-[14px] text-[#6a6a6a] leading-relaxed">
                {steps[activeStep].description}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#ebebeb] space-y-4">
              <div className="flex items-center gap-2 text-[13px] text-[#aaaaaa]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Fully functional Phase 1 MVP</span>
              </div>
              <Link href={steps[activeStep].mvpLink}>
                <div className="w-full flex items-center justify-between bg-[#f7f7f7] hover:bg-[#ff385c]/5 hover:text-[#ff385c] border border-[#ebebeb] px-4 py-3.5 rounded-[12px] text-[13px] font-bold transition-all text-[#222222] cursor-pointer shadow-2xs">
                  {steps[activeStep].mvpLinkLabel}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </div>

          {/* Right panel - Dynamic Simulator */}
          <div className="md:col-span-3 bg-white border border-[#ebebeb] p-8 rounded-[20px] shadow-sm flex flex-col justify-between min-h-[400px]">
            
            {/* Step 1: Crawler Simulator */}
            {activeStep === 0 && (
              <div className="w-full flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4 mb-4">
                  <h4 className="text-[13px] font-bold text-[#222222] flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#ff385c]" /> Scraper Terminal Ingestion
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-[#6a6a6a] uppercase">Scanning Live</span>
                  </div>
                </div>

                <div className="flex-1 bg-[#1a1a1a] p-4 rounded-[12px] font-mono text-[11px] text-[#00ff66] space-y-2 overflow-y-auto min-h-[220px]">
                  {logs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-[#6a6a6a]">{index + 1}.</span>
                      <span className={log.startsWith("ALERT") ? "text-[#ff385c] font-bold" : log.startsWith("ENG") ? "text-amber-400" : ""}>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Scoring Adjuster Simulator */}
            {activeStep === 1 && (
              <div className="w-full flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4 mb-6">
                  <h4 className="text-[13px] font-bold text-[#222222] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#ff385c]" /> Parameter Sandbox Engine
                  </h4>
                  <span className="text-[11px] font-bold text-[#6a6a6a] uppercase">Real-Time Scoring Adjuster</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    {/* Price Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-[#6a6a6a]">Awarded Bid (S-01)</span>
                        <span className="text-[#222222]">₹{(awardedPrice / 100000).toFixed(1)}L</span>
                      </div>
                      <input
                        type="range"
                        min="4000000"
                        max="12000000"
                        step="250000"
                        value={awardedPrice}
                        onChange={(e) => setAwardedPrice(Number(e.target.value))}
                        className="w-full h-1 bg-[#ebebeb] rounded-lg appearance-none cursor-pointer accent-[#ff385c]"
                      />
                    </div>

                    {/* Spec Match Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-[#6a6a6a]">Spec-Tailoring NLP (S-02)</span>
                        <span className="text-[#222222]">{specMatch}% Matches Catalog</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={specMatch}
                        onChange={(e) => setSpecMatch(Number(e.target.value))}
                        className="w-full h-1 bg-[#ebebeb] rounded-lg appearance-none cursor-pointer accent-[#ff385c]"
                      />
                    </div>

                    {/* Win Concentration */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-[#6a6a6a]">Contractor Win Ratio (S-03)</span>
                        <span className="text-[#222222]">{winRatio}% Wins In Dept</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={winRatio}
                        onChange={(e) => setWinRatio(Number(e.target.value))}
                        className="w-full h-1 bg-[#ebebeb] rounded-lg appearance-none cursor-pointer accent-[#ff385c]"
                      />
                    </div>
                  </div>

                  {/* Visual Output Card */}
                  <div className="border border-[#ebebeb] p-5 rounded-[16px] bg-[#f9f9f9]/80 text-center flex flex-col justify-center items-center h-48">
                    <span className="text-[11px] font-bold text-[#aaaaaa] uppercase tracking-wider">Calculated Fraud Score</span>
                    <div className="text-[54px] font-bold text-[#222222] tracking-tight leading-none my-2 flex items-baseline justify-center">
                      {interactiveScore}
                      <span className="text-[14px] text-[#6a6a6a] font-normal">/100</span>
                    </div>
                    <span
                      className={`text-[12px] font-bold px-3 py-1 rounded-full ${
                        interactiveTier === "CRITICAL"
                          ? "bg-red-500/10 text-red-600"
                          : interactiveTier === "HIGH"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      {interactiveTier} RISK TIER
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Alerts Feed Simulator */}
            {activeStep === 2 && (
              <div className="w-full flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4 mb-4">
                  <h4 className="text-[13px] font-bold text-[#222222] flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-[#ff385c]" /> Live Dashboard Feed
                  </h4>
                  <span className="text-[11px] font-bold text-[#6a6a6a] uppercase">Real-Time Influx</span>
                </div>

                <div className="space-y-3">
                  <div className="border border-red-500/20 bg-red-500/5 p-3 rounded-[12px] flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-red-500/10 flex items-center justify-center text-red-600">
                        <AlertOctagon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#222222]">Municipal Road Asphalt Repair</p>
                        <p className="text-[10px] text-[#6a6a6a]">Tender Value: ₹1.24 Cr | Score: 92/100</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded">CRITICAL</span>
                  </div>

                  <div className="border border-amber-500/20 bg-amber-500/5 p-3 rounded-[12px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <AlertOctagon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#222222]">Water Filtration Plant Maintenance</p>
                        <p className="text-[10px] text-[#6a6a6a]">Tender Value: ₹84.5L | Score: 68/100</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded">HIGH</span>
                  </div>

                  <div className="border border-[#ebebeb] bg-[#f9f9f9]/50 p-3 rounded-[12px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <AlertOctagon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#222222]">Street Light LED Supply</p>
                        <p className="text-[10px] text-[#6a6a6a]">Tender Value: ₹22.1L | Score: 44/100</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded">MEDIUM</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Evidence Simulator */}
            {activeStep === 3 && (
              <div className="w-full flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4 mb-4">
                  <h4 className="text-[13px] font-bold text-[#222222] flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-[#ff385c]" /> Evidence Package visualizer
                  </h4>
                  <span className="text-[11px] font-bold text-[#6a6a6a] uppercase">Tender Audit Folder</span>
                </div>

                <div className="space-y-4">
                  {/* Price Discrepancy Graph */}
                  <div className="space-y-1.5 border border-[#ebebeb] p-3 rounded-[12px]">
                    <span className="text-[10px] font-bold text-[#6a6a6a] uppercase">S-01 Price discrepancy Gap</span>
                    <div className="space-y-2 mt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold">Awarded Price (Krishna Agency)</span>
                          <span className="font-bold text-[#ff385c]">₹84,30,000</span>
                        </div>
                        <div className="w-full bg-[#f0f0f0] h-3.5 rounded-full overflow-hidden">
                          <div className="bg-[#ff385c] h-full" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold">Prevailing Live Market Average</span>
                          <span className="font-bold text-emerald-600">₹42,10,000</span>
                        </div>
                        <div className="w-full bg-[#f0f0f0] h-3.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: "50%" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spec Match cosine block */}
                  <div className="border border-[#ebebeb] p-3 rounded-[12px] flex items-center justify-between bg-[#f9f9f9]">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#6a6a6a] uppercase">S-02 NLP Spec-Tailoring similarity</span>
                      <p className="text-[12px] text-[#222222] font-semibold">Tender Specs overlap Contractor Catalog by <strong>84.1%</strong></p>
                    </div>
                    <span className="text-[12px] font-bold text-white bg-[#ff385c] px-3 py-1.5 rounded-[8px]">84.1% Cosine</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Contractor Cartel Simulator */}
            {activeStep === 4 && (
              <div className="w-full flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4 mb-4">
                  <h4 className="text-[13px] font-bold text-[#222222] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#ff385c]" /> Contractor watch profiling
                  </h4>
                  <span className="text-[11px] font-bold text-[#6a6a6a] uppercase">Cartel Networking Map</span>
                </div>

                <div className="border border-[#ebebeb] p-4 rounded-[16px] bg-[#f9f9f9]/80 space-y-3.5">
                  <div className="flex justify-between items-center pb-2 border-b border-[#ebebeb]">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#222222]">Vardhman Traders Pvt Ltd</h4>
                      <p className="text-[10px] text-[#6a6a6a]">CIN: U74999MH2023PTC40291 | Registered <span className="font-semibold text-[#ff385c]">45 Days ago</span></p>
                    </div>
                    <span className="text-[11px] font-bold bg-[#ff385c]/10 text-[#ff385c] px-2.5 py-1 rounded-[6px]">88/100 Risk</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white border border-[#ebebeb] p-2.5 rounded-[12px]">
                      <span className="text-[10px] font-semibold text-[#6a6a6a] uppercase">Tenders Won</span>
                      <p className="text-[18px] font-bold text-[#222222] mt-0.5">14 / 18</p>
                    </div>
                    <div className="bg-white border border-[#ebebeb] p-2.5 rounded-[12px]">
                      <span className="text-[10px] font-semibold text-[#6a6a6a] uppercase">Win Ratio</span>
                      <p className="text-[18px] font-bold text-[#ff385c] mt-0.5">77.7%</p>
                    </div>
                    <div className="bg-white border border-[#ebebeb] p-2.5 rounded-[12px]">
                      <span className="text-[10px] font-semibold text-[#6a6a6a] uppercase">Linked Entities</span>
                      <p className="text-[18px] font-bold text-[#222222] mt-0.5">3 Shells</p>
                    </div>
                  </div>

                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-[10px] text-[11px] text-[#6a6a6a] leading-relaxed">
                    <strong className="text-red-600 block mb-0.5">🚨 Cartel Lock Signal Detected:</strong>
                    Submits bids jointly with dummy entities *Krishna Agency* and *Sai Surgical* to satisfy minimum bidder thresholds (3 bidders) while maintaining total price monopoly.
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Automated RTI Simulator */}
            {activeStep === 5 && (
              <div className="w-full flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4 mb-4">
                  <h4 className="text-[13px] font-bold text-[#222222] flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#ff385c]" /> Auto-generated RTI application
                  </h4>
                  <span className="text-[11px] font-bold text-[#6a6a6a] uppercase">Legal Accountability Draft</span>
                </div>

                <div className="flex-1 border border-[#ebebeb] rounded-[12px] p-4 bg-[#f9f9f9] text-[11px] text-[#3f3f3f] font-sans h-44 overflow-y-auto space-y-3 shadow-inner relative">
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#ff385c]/10 text-[#ff385c] px-2 py-0.5 rounded text-[9px] font-bold">
                    <Scale className="w-3 h-3" /> legal Formatted
                  </div>
                  <div>
                    <strong className="block text-[#222222]">To: The Public Information Officer (PIO)</strong>
                    <span className="text-[#6a6a6a]">Municipal Corporation of Mumbai (Health Department)</span>
                  </div>
                  <div className="border-t border-[#ebebeb] pt-2">
                    <strong>Subject: Request for Information under Section 6(1) of RTI Act, 2005</strong>
                  </div>
                  <p className="leading-relaxed">
                    With reference to <strong>Tender GEM/2026/B/881273 (Municipal Health Supplies)</strong> awarded on 2026-05-15:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                    <li>What was the estimated internal budget and market price benchmark calculations before award?</li>
                    <li>Please provide copies of the technical evaluation reports identifying spec-matches for contractor Vardhman Traders.</li>
                    <li>Provide documentation explaining the criteria to award to a vendor registered less than 60 days before filing.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Action Bar inside Simulator */}
            <div className="mt-6 pt-4 border-t border-[#ebebeb] flex items-center justify-between">
              <button
                onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : prev))}
                disabled={activeStep === 0}
                className={`text-[12px] font-semibold ${
                  activeStep === 0 ? "opacity-30 cursor-not-allowed text-[#aaaaaa]" : "text-[#6a6a6a] hover:text-[#222222]"
                }`}
              >
                Previous Step
              </button>

              <button
                onClick={() => setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))}
                className="flex items-center gap-1.5 bg-[#ff385c] text-white px-4 py-2 rounded-[10px] text-[12px] font-bold hover:bg-[#ff385c]/95 active:scale-95 transition-all shadow-sm"
              >
                {activeStep === steps.length - 1 ? "Start Journey Over" : "Continue Flow"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  );
}
