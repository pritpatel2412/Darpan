"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  FileSearch,
  Building2,
  ScrollText,
  ShieldAlert,
  Bell,
  Search,
  TrendingUp,
  ChevronRight,
  Zap,
  FileText,
  X,
  Users,
  Share2,
  Flame,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { FraudTierBadge } from "@/components/ui/fraud-badge";
import { api } from "@/lib/api";

const navSections = [
  {
    label: "Intelligence",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/network", label: "Corruption Network", icon: Share2 },
      { href: "/march-rush", label: "Q4 March Rush", icon: Flame },
    ],
  },
  {
    label: "Investigation",
    items: [
      { href: "/contractors", label: "Contractors", icon: Building2 },
      { href: "/officials", label: "Officials Watch", icon: Users },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/rti", label: "RTI Tracker", icon: ScrollText },
      { href: "/report", label: "Whistleblower Vault", icon: ShieldAlert },
    ],
  },
];

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [results, setResults] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    let active = true;
    async function doSearch() {
      setIsFetching(true);
      try {
        const res = await api.globalSearch(debouncedQuery);
        if (active) {
          setResults(res.results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setIsFetching(false);
        }
      }
    }
    doSearch();
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaaaaa]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Quick search…"
          className="w-full bg-[#f7f7f7] border border-[#ebebeb] rounded-[8px] pl-9 pr-8 py-2 text-[13px] text-[#222222] placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#ff385c] focus:bg-white transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-3.5 h-3.5 text-[#aaaaaa] hover:text-[#ff385c]" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-[12px] border border-[#ebebeb] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 overflow-hidden max-h-[320px] overflow-y-auto">
          {isFetching && (
            <div className="px-4 py-3 text-[13px] text-[#aaaaaa] text-center">Searching…</div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="px-4 py-4 text-center">
              <p className="text-[13px] text-[#aaaaaa]">No results for &quot;{query}&quot;</p>
            </div>
          )}
          {!isFetching && results.length > 0 && (
            <>
              {results.filter((r) => r.type === "tender").length > 0 && (
                <>
                  <div className="px-4 py-2 bg-[#f9f9f9] border-b border-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Tenders
                    </p>
                  </div>
                  {results
                    .filter((r) => r.type === "tender")
                    .map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelect(item.href)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors text-left border-b border-[#f7f7f7] last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#222222] truncate">{item.title}</p>
                          <p className="text-[11px] text-[#aaaaaa] truncate mt-0.5">{item.subtitle}</p>
                        </div>
                        {item.fraudTier && <FraudTierBadge tier={item.fraudTier} />}
                      </button>
                    ))}
                </>
              )}
              {results.filter((r) => r.type === "contractor").length > 0 && (
                <>
                  <div className="px-4 py-2 bg-[#f9f9f9] border-b border-[#f0f0f0] border-t border-t-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> Contractors
                    </p>
                  </div>
                  {results
                    .filter((r) => r.type === "contractor")
                    .map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelect(item.href)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors text-left"
                      >
                        <Building2 className="w-4 h-4 text-[#aaaaaa] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#222222] truncate">{item.title}</p>
                          <p className="text-[11px] text-[#aaaaaa] truncate mt-0.5">{item.subtitle}</p>
                        </div>
                      </button>
                    ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const formattedTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <aside className="fixed top-0 left-0 h-full w-[260px] bg-white border-r border-[#ebebeb] flex flex-col z-50 select-none">
      <div className="px-6 py-5 border-b border-[#ebebeb]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-[10px] bg-[#ff385c] flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[17px] font-bold text-[#222222] tracking-tight">दर्पण</span>
            <span className="text-[11px] text-[#6a6a6a] font-medium tracking-wide">DARPAN</span>
          </div>
        </Link>
      </div>

      <div className="px-4 py-3 border-b border-[#ebebeb]">
        <GlobalSearch />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer group ${
                          active
                            ? "bg-[#ff385c]/10 text-[#ff385c]"
                            : "text-[#3f3f3f] hover:bg-[#f7f7f7] hover:text-[#222222]"
                        }`}
                      >
                        <item.icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            active ? "text-[#ff385c]" : "text-[#aaaaaa] group-hover:text-[#3f3f3f]"
                          }`}
                        />
                        {item.label}
                        {active && <ChevronRight className="ml-auto w-3.5 h-3.5 text-[#ff385c]" />}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-[#ebebeb] space-y-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f7f7f7] rounded-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#222222]">System Online</p>
            <p className="text-[11px] text-[#6a6a6a]">Last scan {formattedTime}</p>
          </div>
          <Zap className="w-3.5 h-3.5 text-[#aaaaaa]" />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#ebebeb] px-8 py-4 flex items-center justify-between">
      <div>
        {title && (
          <h1 className="text-[20px] font-bold text-[#222222] tracking-tight leading-none">
            {title}
          </h1>
        )}
        {subtitle && <p className="text-[13px] text-[#6a6a6a] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#6a6a6a] bg-[#f7f7f7] border border-[#ebebeb] px-3 py-1.5 rounded-full">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          Live
        </div>
        <button className="relative w-9 h-9 rounded-full bg-[#f7f7f7] border border-[#ebebeb] flex items-center justify-center hover:bg-[#ebebeb] transition-colors">
          <Bell className="w-4 h-4 text-[#6a6a6a]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff385c]" />
        </button>
      </div>
    </div>
  );
}

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-[#f9f9f9] text-[#3f3f3f] font-sans selection:bg-[#ff385c]/20 selection:text-[#222222]">
      <Sidebar />
      <div className="ml-[260px] min-h-[100dvh] flex flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
