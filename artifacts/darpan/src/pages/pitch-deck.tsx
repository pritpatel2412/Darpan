import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Cpu,
  Database,
  Layers,
  Users,
  Search,
  FileCheck,
  Building2,
  FileText,
  AlertTriangle,
  Zap,
} from "lucide-react";

const slides = [
  {
    tagline: "The Public Sector Leakage crisis",
    title: "Procurement Fraud: The Blindspot of Public Spending",
    subtitle: "Public procurement in India faces systemic leakage, collusions, and spec-tailoring. Standard reactive audits are broken.",
  },
  {
    tagline: "AI-Powered Procurement Oversight",
    title: "DARPAN (दर्पण): Real-Time Integrity & Legal Accountability",
    subtitle: "A digital mirror that crawls national/state portals, detects bid cartels in real-time, and generates citizen-led RTI applications.",
  },
  {
    tagline: "Built for Precision & High-Throughput",
    title: "Tools & Tech Stack: High-Scale Modern Architecture",
    subtitle: "A contract-first TypeScript design ensuring end-to-end synchronization from PostgreSQL to React Query hooks.",
  },
  {
    tagline: "Democratizing Democratic Vigilance",
    title: "Ideal Customer Profile: Empowering the Watchdogs",
    subtitle: "Connecting raw data-intelligence to the specific agents of accountability who enforce transparency in local spending.",
  },
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  return (
    <MainLayout
      title="Phase 1 Pitch Deck"
      subtitle={`Slide ${currentSlide + 1} of 4 — Interactive Presentation`}
    >
      <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-180px)] select-none">
        
        {/* Navigation & Progress Bar */}
        <div className="flex items-center justify-between mb-6 bg-white border border-[#ebebeb] px-6 py-3.5 rounded-[12px] shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-[#ff385c] uppercase tracking-wider bg-[#ff385c]/10 px-2.5 py-1 rounded-[6px]">
              {slides[currentSlide].tagline}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-[#ff385c] w-6"
                      : "bg-[#ebebeb] hover:bg-[#ff385c]/40"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-[#ebebeb]" />

            {/* Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className={`w-8 h-8 rounded-full border border-[#ebebeb] flex items-center justify-center transition-all ${
                  currentSlide === 0
                    ? "opacity-40 cursor-not-allowed bg-[#f7f7f7]"
                    : "bg-white hover:bg-[#f7f7f7] active:scale-95 text-[#222222]"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentSlide === slides.length - 1}
                className={`w-8 h-8 rounded-full border border-[#ebebeb] flex items-center justify-center transition-all ${
                  currentSlide === slides.length - 1
                    ? "opacity-40 cursor-not-allowed bg-[#f7f7f7]"
                    : "bg-white hover:bg-[#f7f7f7] active:scale-95 text-[#222222]"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Presentation Slide Container */}
        <div className="flex-1 bg-white border border-[#ebebeb] rounded-[20px] shadow-sm p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-500 min-h-[500px]">
          {/* Subtle Watermark Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#ebebeb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          {/* Slide Header */}
          <div className="relative z-10 space-y-2">
            <h2 className="text-[32px] font-bold text-[#222222] tracking-tight leading-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-[16px] text-[#6a6a6a] max-w-3xl leading-relaxed">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* Slide Content Visualizers */}
          <div className="relative z-10 flex-1 my-8 flex items-center justify-center">
            
            {/* Slide 1: The Problem */}
            {currentSlide === 0 && (
              <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Statistics Cards */}
                <div className="md:col-span-2 flex flex-col justify-between gap-4">
                  <div className="bg-[#ff385c]/5 border border-[#ff385c]/10 p-5 rounded-[16px] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[12px] bg-[#ff385c]/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-[#ff385c]" />
                    </div>
                    <div>
                      <h4 className="text-[24px] font-bold text-[#222222]">₹5,000 Cr+</h4>
                      <p className="text-[12px] font-medium text-[#6a6a6a] uppercase tracking-wider">Lost to Corruption Annually</p>
                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-[16px] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[12px] bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-[24px] font-bold text-[#222222]">&lt; 1%</h4>
                      <p className="text-[12px] font-medium text-[#6a6a6a] uppercase tracking-wider">Tenders Audited Reactively</p>
                    </div>
                  </div>

                  <div className="bg-[#222222]/5 border border-[#ebebeb] p-5 rounded-[16px] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[12px] bg-[#222222]/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-[#222222]" />
                    </div>
                    <div>
                      <h4 className="text-[24px] font-bold text-[#222222]">30 Days</h4>
                      <p className="text-[12px] font-medium text-[#6a6a6a] uppercase tracking-wider">Statutory RTI Deadline</p>
                    </div>
                  </div>
                </div>

                {/* Core Pain Point Descriptions */}
                <div className="md:col-span-3 space-y-4">
                  <div className="border border-[#ebebeb] p-4 rounded-[14px] hover:border-[#ff385c]/30 transition-all bg-[#f9f9f9]/50">
                    <h4 className="text-[14px] font-bold text-[#222222] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff385c]" />
                      Opaque Specifications (Spec-Tailoring)
                    </h4>
                    <p className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Departments tailor technical specifications (e.g., custom sizes, niche certifications) to fit only *one* pre-selected contractor, locking out competitive bids.
                    </p>
                  </div>

                  <div className="border border-[#ebebeb] p-4 rounded-[14px] hover:border-[#ff385c]/30 transition-all bg-[#f9f9f9]/50">
                    <h4 className="text-[14px] font-bold text-[#222222] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff385c]" />
                      Collusive Bidding & Cartel Concentrations
                    </h4>
                    <p className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Contractor circles rotate wins by submitting dummy bids within 0.5% of each other, artificially driving up prices by 25% or more over live market rates.
                    </p>
                  </div>

                  <div className="border border-[#ebebeb] p-4 rounded-[14px] hover:border-[#ff385c]/30 transition-all bg-[#f9f9f9]/50">
                    <h4 className="text-[14px] font-bold text-[#222222] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff385c]" />
                      Inability for Citizens to Challenge Opaque Contracts
                    </h4>
                    <p className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Taxpayers have the legal right to challenge corrupt tenders under the RTI Act, but compiling specific evidence and drafting legal filings is extremely high-friction.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 2: The Proposed Solution */}
            {currentSlide === 1 && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="border border-[#ebebeb] p-5 rounded-[16px] hover:border-[#ff385c]/30 hover:shadow-md transition-all flex flex-col justify-between bg-[#f9f9f9]/40 group">
                  <div className="w-10 h-10 rounded-[10px] bg-[#ff385c]/10 flex items-center justify-center text-[#ff385c] group-hover:scale-110 transition-transform">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="mt-8">
                    <h4 className="text-[15px] font-bold text-[#222222]">7-Signal Scanners</h4>
                    <p className="text-[12px] text-[#6a6a6a] mt-1.5 leading-relaxed">
                      Crawls and checks for inflated pricing, win concentrations, single bid anomalies, new entity flags, and bid amount clustering.
                    </p>
                  </div>
                </div>

                <div className="border border-[#ebebeb] p-5 rounded-[16px] hover:border-[#ff385c]/30 hover:shadow-md transition-all flex flex-col justify-between bg-[#f9f9f9]/40 group">
                  <div className="w-10 h-10 rounded-[10px] bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="mt-8">
                    <h4 className="text-[15px] font-bold text-[#222222]">Evidence Packages</h4>
                    <p className="text-[12px] text-[#6a6a6a] mt-1.5 leading-relaxed">
                      Generates high-fidelity audit folders with visual cosine similarity scores, price discrepancies, and chronological history logs.
                    </p>
                  </div>
                </div>

                <div className="border border-[#ebebeb] p-5 rounded-[16px] hover:border-[#ff385c]/30 hover:shadow-md transition-all flex flex-col justify-between bg-[#f9f9f9]/40 group">
                  <div className="w-10 h-10 rounded-[10px] bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="mt-8">
                    <h4 className="text-[15px] font-bold text-[#222222]">Auto-RTI Generator</h4>
                    <p className="text-[12px] text-[#6a6a6a] mt-1.5 leading-relaxed">
                      Converts structured fraud data into formatted legal RTI requests directed to Central/State Public Information Officers in one-click.
                    </p>
                  </div>
                </div>

                <div className="border border-[#ebebeb] p-5 rounded-[16px] hover:border-[#ff385c]/30 hover:shadow-md transition-all flex flex-col justify-between bg-[#f9f9f9]/40 group">
                  <div className="w-10 h-10 rounded-[10px] bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="mt-8">
                    <h4 className="text-[15px] font-bold text-[#222222]">Cartel Graphs</h4>
                    <p className="text-[12px] text-[#6a6a6a] mt-1.5 leading-relaxed">
                      Generates beautiful relation networks of contractors and procuring authorities, uncovering revolving doors and win patterns.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Tools & Technical Stack */}
            {currentSlide === 2 && (
              <div className="w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-[#ebebeb] p-5 rounded-[16px] bg-[#f9f9f9]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[8px] bg-[#ff385c]/10 flex items-center justify-center text-[#ff385c]">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <h4 className="text-[14px] font-bold text-[#222222]">Contract-First API</h4>
                    </div>
                    <ul className="text-[12px] text-[#6a6a6a] mt-3 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li><strong>OpenAPI Spec</strong> as the single source of truth for contracts</li>
                      <li><strong>Express 5</strong> backend server (port 8080) for robust speed</li>
                      <li><strong>Orval Codegen</strong> compiles React Query hooks and Zod validations</li>
                    </ul>
                  </div>

                  <div className="border border-[#ebebeb] p-5 rounded-[16px] bg-[#f9f9f9]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[8px] bg-[#ff385c]/10 flex items-center justify-center text-[#ff385c]">
                        <Database className="w-4 h-4" />
                      </div>
                      <h4 className="text-[14px] font-bold text-[#222222]">Robust PostgreSQL Storage</h4>
                    </div>
                    <ul className="text-[12px] text-[#6a6a6a] mt-3 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li><strong>PostgreSQL</strong> database ensuring relational integrity</li>
                      <li><strong>Drizzle ORM</strong> provides type-safe, ultra-fast queries</li>
                      <li><strong>JSONB Evidence Packages</strong> store heavy nested fraud signatures</li>
                    </ul>
                  </div>

                  <div className="border border-[#ebebeb] p-5 rounded-[16px] bg-[#f9f9f9]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[8px] bg-[#ff385c]/10 flex items-center justify-center text-[#ff385c]">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="text-[14px] font-bold text-[#222222]">Premium Airbnb Frontend</h4>
                    </div>
                    <ul className="text-[12px] text-[#6a6a6a] mt-3 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li><strong>React 18 & Vite</strong> running on port 19643 for fast HMR</li>
                      <li>Airbnb layout tokens: #ff385c primary, crisp borders</li>
                      <li><strong>TailwindCSS</strong> for fluid layouts and sleek micro-animations</li>
                    </ul>
                  </div>
                </div>

                <div className="border border-[#ebebeb] px-5 py-4 rounded-[14px] bg-[#f7f7f7] flex items-center justify-between text-[13px] text-[#6a6a6a]">
                  <span className="flex items-center gap-2 text-[#222222] font-semibold">
                    <Zap className="w-4 h-4 text-[#ff385c] animate-pulse" />
                    Detection Logic:
                  </span>
                  <span><strong>S-01 Price Inflation:</strong> Compare Tender Award against Live Market APIs</span>
                  <span><strong>S-02 NLP Similarity:</strong> Cosine String Comparison for Spec-Tailoring</span>
                  <span><strong>S-03 Win Concentration:</strong> Aggregate SQL Group-By (&gt;65% wins)</span>
                </div>
              </div>
            )}

            {/* Slide 4: ICP / Target Audience */}
            {currentSlide === 3 && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-[#ebebeb] p-5 rounded-[16px] bg-[#f9f9f9]/40 flex gap-4 hover:border-[#ff385c]/30 hover:bg-white transition-all">
                  <div className="w-10 h-10 rounded-[10px] bg-red-500/10 flex items-center justify-center text-red-600 flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#222222]">Investigative Journalists</h4>
                    <p className="text-[12px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Needs detailed, structured fraud evidence folders and automatic alerts to break exclusive public spending corruption stories backed by absolute mathematical proof.
                    </p>
                  </div>
                </div>

                <div className="border border-[#ebebeb] p-5 rounded-[16px] bg-[#f9f9f9]/40 flex gap-4 hover:border-[#ff385c]/30 hover:bg-white transition-all">
                  <div className="w-10 h-10 rounded-[10px] bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#222222]">Anti-Corruption NGOs & Activists</h4>
                    <p className="text-[12px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Requires high-scale auditing capabilities to monitor local municipal corporations and instantly draft legally sound RTI applications with bulletproof audit payloads.
                    </p>
                  </div>
                </div>

                <div className="border border-[#ebebeb] p-5 rounded-[16px] bg-[#f9f9f9]/40 flex gap-4 hover:border-[#ff385c]/30 hover:bg-white transition-all">
                  <div className="w-10 h-10 rounded-[10px] bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#222222]">Government Vigilance Officers</h4>
                    <p className="text-[12px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Seeks real-time pre-disbursement alerts of collusive bidding networks and win rotations to block state disbursement *before* corrupt contracts are executed.
                    </p>
                  </div>
                </div>

                <div className="border border-[#ebebeb] p-5 rounded-[16px] bg-[#f9f9f9]/40 flex gap-4 hover:border-[#ff385c]/30 hover:bg-white transition-all">
                  <div className="w-10 h-10 rounded-[10px] bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#222222]">Active Taxpayers & Citizens</h4>
                    <p className="text-[12px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Desires a simplified, zero-friction path to hold local authorities accountable, requiring simple tools to generate legal filings and track statutory deadlines.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Slide Footer */}
          <div className="relative z-10 pt-6 border-t border-[#ebebeb] flex items-center justify-between text-[12px] text-[#aaaaaa]">
            <span className="font-semibold tracking-wide text-[#888888] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#ff385c]" />
              DARPAN: Mirror of Integrity
            </span>
            <div className="flex items-center gap-4">
              <span>Use Left/Right arrow keys to navigate</span>
              <span>Slide {currentSlide + 1} of 4</span>
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="mt-6 text-center">
          <a
            href="/product-journey"
            className="inline-flex items-center gap-2 bg-[#ff385c] text-white px-6 py-3 rounded-[12px] text-[14px] font-bold hover:bg-[#ff385c]/95 active:scale-95 transition-all shadow-sm"
          >
            Explore the Interactive Product Journey
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </MainLayout>
  );
}
