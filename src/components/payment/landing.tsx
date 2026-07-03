"use client";

import {
  Zap,
  ShieldCheck,
  Headphones,
  ArrowRight,
  Sparkles,
  Music2,
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
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        {/* Glow background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute top-[-10%] left-[20%] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute top-[20%] right-[10%] h-80 w-80 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[40%] h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
        </div>

        <div className="text-center max-w-3xl mx-auto pt-10 pb-4">
          {/* Brand mark */}
          <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 shadow-lg shadow-violet-500/20 mb-8">
            <Music2 className="size-10 text-white" />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            PlayBeat
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {BRAND.description}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="h-12 px-10 bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:from-violet-700 hover:to-pink-600 shadow-lg shadow-violet-500/20 text-base"
              onClick={onPayNow}
            >
              Pay Now
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
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
                className="text-center hover:border-violet-300 dark:hover:border-violet-800 hover:shadow-md transition-all"
              >
                <CardContent className="pt-8 pb-8">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-950/50 dark:to-pink-950/50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="size-6 text-violet-600 dark:text-violet-400" />
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
