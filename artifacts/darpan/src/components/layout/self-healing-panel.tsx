import { useState, useEffect } from "react";
import { Terminal, RefreshCw, AlertTriangle, ShieldCheck, Play, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SelfHealingPanel() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/sandbox/status");
      const data = await res.json();
      setStatus(data);
      if (data.healingLogs) {
        setLogs(data.healingLogs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBreak = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:8080/api/sandbox/break", { method: "POST" });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHeal = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:8080/api/sandbox/heal", { method: "POST" });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!status) return null;

  return (
    <div className="bg-white rounded-[14px] border border-[#ebebeb] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#f7f7f7] flex justify-between items-center bg-[#fdfdfd]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#ff385c]" />
          <h3 className="text-[15px] font-bold text-[#222222]">Codex Self-Healing Scraper Sandbox</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#aaaaaa]">Pipeline State:</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wider ${status.isScraperBroken ? "bg-[#ff385c]/10 text-[#ff385c]" : "bg-[#10b981]/10 text-[#10b981]"}`}>
            {status.isScraperBroken ? "Degraded" : "Optimal"}
          </span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-5 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] space-y-4">
            <h4 className="text-[14px] font-bold text-[#222222] flex items-center gap-1.5">
              Control Panel & Metrics
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-[#ebebeb] rounded-[8px]">
                <p className="text-[11px] text-[#aaaaaa] uppercase tracking-wider mb-1">Extraction Rate</p>
                <p className={`text-[32px] font-black leading-none ${status.isScraperBroken ? "text-[#ff385c]" : "text-[#10b981]"}`}>
                  {status.extractionRate}%
                </p>
              </div>
              <div className="p-4 bg-white border border-[#ebebeb] rounded-[8px]">
                <p className="text-[11px] text-[#aaaaaa] uppercase tracking-wider mb-1">Active Parser</p>
                <p className="text-[14px] font-bold text-[#222222] leading-none mt-2 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-[#aaaaaa]" />
                  v1.4.1-gem
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleBreak}
                disabled={status.isScraperBroken || loading}
                className="flex-1 rounded-[8px] text-[13px] font-semibold h-10 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Break Scraper
              </Button>
              <Button
                onClick={handleHeal}
                disabled={!status.isScraperBroken || loading}
                className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white rounded-[8px] text-[13px] font-semibold h-10 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Heal Scraper
              </Button>
            </div>
          </div>

          <div className="flex flex-col h-[200px] bg-[#1a1a1a] border border-[#2d2d2d] rounded-[10px] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#2d2d2d] flex justify-between items-center bg-[#252525]">
              <span className="text-[11px] font-mono text-[#888888] font-bold">Autonomous Agent Console logs</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
            </div>
            <div className="p-4 font-mono text-[11px] overflow-y-auto space-y-1.5 flex-1 select-none text-[#aaaaaa]">
              {logs.length > 0 ? (
                logs.map((log, i) => {
                  let color = "text-[#888888]";
                  if (log.includes("ALERT") || log.includes("ERROR")) color = "text-[#ff385c] font-bold";
                  if (log.includes("SUCCESS")) color = "text-[#10b981] font-bold";
                  if (log.includes("WARNING")) color = "text-[#f59e0b]";
                  if (log.includes("ACTION")) color = "text-[#3b82f6]";
                  return (
                    <div key={i} className={`${color} leading-relaxed`}>
                      {log}
                    </div>
                  );
                })
              ) : (
                <div className="text-[#666666] italic text-center pt-8">No terminal logs recorded yet. Click 'Break Scraper' to begin.</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-[#1e1e1e] border border-[#2d2d2d] rounded-[10px] overflow-hidden h-[360px]">
          <div className="px-4 py-2.5 border-b border-[#2d2d2d] flex justify-between items-center bg-[#252525]">
            <span className="text-[11px] font-mono text-[#888888] font-bold flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-[#aaaaaa]" />
              Active Scraper Parser Javascript Code
            </span>
          </div>
          <pre className="p-4 font-mono text-[11px] overflow-auto flex-1 select-all text-[#10b981] bg-[#1a1a1a] leading-relaxed">
            {status.activeScraperCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
