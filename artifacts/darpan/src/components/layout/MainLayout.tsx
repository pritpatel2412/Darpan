import { Link, useLocation } from "wouter";
import { format } from "date-fns";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/tenders", label: "Tenders" },
    { href: "/contractors", label: "Contractors" },
    { href: "/rti-tracker", label: "RTI Tracker" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#ffffff] text-[#3f3f3f] font-sans selection:bg-[#ff385c]/20 selection:text-[#222222]">
      <header className="sticky top-0 z-50 h-[72px] bg-white border-b border-[#dddddd] flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-[22px] font-bold text-[#222222] tracking-tight group-hover:text-[#ff385c] transition-colors">दर्पण</span>
            <span className="text-[16px] font-medium text-[#6a6a6a]">Darpan</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[14px] font-medium transition-colors ${
                    isActive ? "text-[#ff385c]" : "text-[#6a6a6a] hover:text-[#222222]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[12px] font-medium text-[#6a6a6a] bg-[#f7f7f7] px-3 py-1.5 rounded-full border border-[#ebebeb]">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Last scan: {format(new Date(), "HH:mm")}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto w-full p-6 lg:p-10">
        {children}
      </main>
    </div>
  );
}
