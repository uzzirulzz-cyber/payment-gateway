"use client";

import {
  Zap,
  ShieldCheck,
  Headphones,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND, VALUE_PROPS } from "@/lib/brand";

const ICONS = [Zap, ShieldCheck, Headphones];

interface LandingProps {
  onPayNow: () => void;
}

export function Landing({ onPayNow }: LandingProps) {
  return (
    <div className="space-y-20">
      {/* ===== Hero with background image ===== */}
      <section className="relative overflow-hidden rounded-3xl">
        {/* Background image */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url(/playbeat-bg.jpg)" }}
        />
        {/* Dark overlay for readability */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/60 to-black/80"
        />

        <div className="text-center max-w-3xl mx-auto pt-16 pb-20 px-4">
          {/* Logo image */}
          <img
            src="/playbeat-logo.png"
            alt="PlayBeat logo"
            className="mx-auto h-20 sm:h-24 w-auto mb-8 drop-shadow-2xl"
          />

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-white">
            {BRAND.name}
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            {BRAND.description}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="h-12 px-10 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 text-base"
              onClick={onPayNow}
            >
              Pay Now
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-xs text-white/70 flex items-center gap-1">
              <Sparkles className="size-3" />
              No account needed · Instant activation
            </p>
          </div>
        </div>
      </section>

      {/* ===== Value props ===== */}
      <section>
        <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
          {VALUE_PROPS.map((vp, i) => {
            const Icon = ICONS[i];
            return (
              <Card
                key={vp.title}
                className="text-center hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all"
              >
                <CardContent className="pt-8 pb-8">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="size-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="font-semibold text-base mb-1.5">
                    {vp.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {vp.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
