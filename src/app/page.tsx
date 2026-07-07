"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  History,
  Music2,
  Sparkles,
  Database,
  Loader2,
  Home as HomeIcon,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Landing } from "@/components/payment/landing";
import { CheckoutView } from "@/components/payment/checkout-view";
import { PaymentHistory } from "@/components/payment/payment-history";
import { Dashboard } from "@/components/payment/dashboard";
import { PaymentReturnModal } from "@/components/payment/payment-return-modal";
import { WooCommerceSection } from "@/components/payment/woocommerce-section";
import { BRAND } from "@/lib/brand";

type View = "landing" | "checkout" | "history" | "dashboard" | "woocommerce";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [seeding, setSeeding] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);

  // Check if there's any data; offer to seed if not (only relevant on dashboard).
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50/40 via-background to-background dark:from-violet-950/10">
      {/* ===== Top banner (matches reference) ===== */}
      <div className="bg-gradient-to-r from-violet-700 to-pink-600 text-white text-center text-xs py-1.5 px-4">
        {BRAND.legalName.toUpperCase()}
      </div>

      {/* ===== Header ===== */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView("landing")}
            className="flex items-center gap-2.5 group"
          >
            <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
              <Music2 className="size-5" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-semibold leading-tight">
                {BRAND.name}
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Powered by JazzCash · Sandbox
              </p>
            </div>
          </button>

          <nav className="flex items-center gap-1">
            <NavButton
              active={view === "landing"}
              onClick={() => setView("landing")}
              icon={<HomeIcon className="size-3.5" />}
              label="Home"
            />
            <NavButton
              active={view === "woocommerce"}
              onClick={() => setView("woocommerce")}
              icon={<Package className="size-3.5" />}
              label="WooCommerce"
            />
            <NavButton
              active={view === "history"}
              onClick={() => setView("history")}
              icon={<History className="size-3.5" />}
              label="History"
            />
            <NavButton
              active={view === "dashboard"}
              onClick={() => setView("dashboard")}
              icon={<LayoutDashboard className="size-3.5" />}
              label="Dashboard"
            />
          </nav>
        </div>
      </header>

      {/* ===== Main content ===== */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        {view === "landing" && (
          <Landing onPayNow={() => setView("checkout")} />
        )}

        {view === "checkout" && (
          <CheckoutView onBack={() => setView("landing")} />
        )}

        {view === "woocommerce" && <WooCommerceSection />}

        {view === "history" && <PaymentHistory />}

        {view === "dashboard" && (
          <>
            {hasData === false && (
              <div className="mb-6 rounded-lg border border-dashed border-violet-300 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                    <Database className="size-4 text-violet-700 dark:text-violet-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      No transactions yet — want some sample data?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seeds 25 fake orders across the last 14 days so the
                      dashboard has something to show.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={seedData}
                  disabled={seeding}
                  className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/50"
                >
                  {seeding ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Seed sample data
                </Button>
              </div>
            )}
            <Dashboard />
          </>
        )}
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t bg-background/80 backdrop-blur-md mt-12">
        <div className="container mx-auto max-w-6xl px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">{BRAND.footer}</p>
        </div>
      </footer>

      {/* Auto-opens when redirected back from JazzCash */}
      <PaymentReturnModal />
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
      className="gap-1.5"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
