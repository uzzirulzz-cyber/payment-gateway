"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  History,
  Sparkles,
  Database,
  Loader2,
  Home as HomeIcon,
  Package,
  Settings,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Landing } from "@/components/payment/landing";
import { CheckoutView } from "@/components/payment/checkout-view";
import { PaymentHistory } from "@/components/payment/payment-history";
import { Dashboard } from "@/components/payment/dashboard";
import { PaymentReturnModal } from "@/components/payment/payment-return-modal";
import { WooCommerceSection } from "@/components/payment/woocommerce-section";
import { RefundsView } from "@/components/payment/refunds-view";
import { BRAND } from "@/lib/brand";
import { useTheme } from "@/lib/use-theme";

type View = "landing" | "checkout" | "history" | "dashboard" | "woocommerce" | "refunds";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [seeding, setSeeding] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const { theme, loading: themeLoading, restore } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/orders?limit=1");
        const json = await res.json();
        if (json.ok) setHasData((json.total ?? 0) > 0);
      } catch {
        setHasData(null);
      }
    })();
  }, []);

  const seedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed?count=25", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        toast.success(json.message);
        setHasData(true);
      } else {
        toast.error(json.error ?? "Failed to seed data");
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);
    if (result.ok) {
      toast.success("Theme restored to default.");
      setSettingsOpen(false);
    } else {
      toast.error("Failed to restore theme.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pb-gradient text-white text-center text-xs py-1.5 px-4 font-medium tracking-wider">
        {BRAND.legalName.toUpperCase()}
      </div>

      <header className="border-b border-white/10 bg-black/70 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView("landing")}
            className="flex items-center gap-2.5 group"
          >
            <img
              src={theme.logoUrl}
              alt="PlayBeat"
              className="h-9 w-auto"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/playbeat-logo.png";
              }}
            />
            <div className="text-left">
              <h1 className="text-base font-semibold leading-tight text-white">
                {BRAND.name}
              </h1>
              <p className="text-[11px] text-white/60 leading-tight">
                Powered by JazzCash · Live
              </p>
            </div>
          </button>

          <nav className="flex items-center gap-1">
            <NavButton active={view === "landing"} onClick={() => setView("landing")} icon={<HomeIcon className="size-3.5" />} label="Home" />
            <NavButton active={view === "woocommerce"} onClick={() => setView("woocommerce")} icon={<Package className="size-3.5" />} label="WooCommerce" />
            <NavButton active={view === "history"} onClick={() => setView("history")} icon={<History className="size-3.5" />} label="History" />
            <NavButton active={view === "refunds"} onClick={() => setView("refunds")} icon={<RotateCcw className="size-3.5" />} label="Refunds" />
            <NavButton active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<LayoutDashboard className="size-3.5" />} label="Dashboard" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="text-white/70 hover:text-white hover:bg-white/10"
              title="Theme settings"
            >
              <Settings className="size-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        {view === "landing" && <Landing onPayNow={() => setView("checkout")} />}
        {view === "checkout" && <CheckoutView onBack={() => setView("landing")} />}
        {view === "woocommerce" && <WooCommerceSection />}
        {view === "history" && <PaymentHistory />}
        {view === "refunds" && <RefundsView />}
        {view === "dashboard" && (
          <>
            {hasData === false && (
              <div className="mb-6 rounded-lg border border-dashed border-blue-400/40 bg-blue-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Database className="size-4 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">No transactions yet — want some sample data?</p>
                    <p className="text-xs text-white/60">Seeds 25 fake orders across the last 14 days.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={seedData} disabled={seeding} className="border-blue-400/40 text-blue-200 hover:bg-blue-500/20">
                  {seeding ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  Seed sample data
                </Button>
              </div>
            )}
            <Dashboard />
          </>
        )}
      </main>

      <footer className="border-t border-white/10 bg-black/70 backdrop-blur-md mt-12">
        <div className="container mx-auto max-w-6xl px-4 py-6 text-center">
          <p className="text-xs text-white/50">{BRAND.footer}</p>
        </div>
      </footer>

      <PaymentReturnModal />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Theme settings</DialogTitle>
            <DialogDescription className="text-white/60">
              The active theme is loaded from the database. Restore to reset to the factory default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Preset</span>
              <Badge variant="secondary" className={theme.preset === "default" ? "bg-blue-500/20 text-blue-200" : "bg-amber-500/20 text-amber-200"}>
                {theme.preset}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Name</span>
              <span className="text-white font-medium">{theme.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Logo</span>
              <img src={theme.logoUrl} alt="logo" className="h-6 w-auto" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Accent gradient</span>
              <div className="flex items-center gap-1">
                <span className="size-4 rounded" style={{ backgroundColor: theme.accentFrom }} />
                <span className="text-white/40 text-xs">→</span>
                <span className="size-4 rounded" style={{ backgroundColor: theme.accentTo }} />
              </div>
            </div>
            {themeLoading && (
              <p className="text-xs text-white/40 flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" />
                Loading theme from database…
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-white/20 text-white hover:bg-white/10">Close</Button>
            <Button onClick={handleRestore} disabled={restoring || theme.preset === "default"} className="pb-gradient text-white">
              {restoring ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Restore to default
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      className={
        active
          ? "gap-1.5 bg-white/15 text-white hover:bg-white/20"
          : "gap-1.5 text-white/70 hover:text-white hover:bg-white/10"
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
