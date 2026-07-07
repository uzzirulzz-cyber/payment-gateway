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
              className="h-12 px-10 pb-gradient text-white hover:opacity-90 shadow-lg shadow-blue-500/30 text-base"
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
                className="text-center bg-black/60 border-white/10 backdrop-blur-sm hover:border-blue-400/40 hover:bg-black/70 transition-all"
              >
                <CardContent className="pt-8 pb-8">
                  <div className="size-12 rounded-xl pb-gradient flex items-center justify-center mx-auto mb-4">
                    <Icon className="size-6 text-white" />
                  </div>
                  <h2 className="font-semibold text-base mb-1.5 text-white">
                    {vp.title}
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed">
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
