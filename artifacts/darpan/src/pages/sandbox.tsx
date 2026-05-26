import { MainLayout } from "@/components/layout/MainLayout";
import { SelfHealingPanel } from "@/components/layout/self-healing-panel";

export default function Sandbox() {
  return (
    <MainLayout
      title="Scraper Control Center"
      subtitle="Simulation suite for demonstrating autonomous self-healing capabilities on portal scrapers"
    >
      <div className="space-y-6">
        <div className="bg-[#ff385c]/5 border border-[#ff385c]/10 p-5 rounded-[14px]">
          <h2 className="text-[14px] font-bold text-[#ff385c] mb-1">Hackathon Evaluation Guide</h2>
          <p className="text-[13px] text-[#222222] leading-relaxed">
            Portal scrapers frequently break due to DOM changes. Click <strong>Break Scraper</strong> to simulate a layout change on the GeM portal (reducing extraction rate to 33%). Then click <strong>Heal Scraper</strong> to dispatch the Codex AI Agent, which automatically analyzes the broken DOM and writes, compiles, tests, and deploys a healed Javascript parser!
          </p>
        </div>

        <SelfHealingPanel />
      </div>
    </MainLayout>
  );
}
