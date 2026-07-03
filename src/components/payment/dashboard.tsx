"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
    totalCancelled: number;
    totalRefunded: number;
    successRate: number;
  };
  trend: { date: string; amount: number }[];
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  accent: "emerald" | "amber" | "rose" | "violet" | "slate";
  loading: boolean;
}) {
  const accents: Record<string, string> = {
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    slate:
      "bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {sublabel && (
              <p className="text-xs text-muted-foreground">{sublabel}</p>
            )}
          </div>
          <div
            className={cn(
              "size-10 rounded-lg flex items-center justify-center",
              accents[accent],
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatPKR(n: number): string {
  return "₨ " + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function Dashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/orders/stats");
        const json = await res.json();
        if (!cancelled && json.ok) setData(json.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={summary ? formatPKR(summary.totalRevenue) : "—"}
          sublabel="From successful payments"
          icon={<TrendingUp className="size-5" />}
          accent="emerald"
          loading={loading}
        />
        <StatCard
          label="Successful"
          value={summary ? String(summary.totalPaid) : "—"}
          sublabel={
            summary ? `${summary.successRate}% success rate` : undefined
          }
          icon={<CheckCircle2 className="size-5" />}
          accent="emerald"
          loading={loading}
        />
        <StatCard
          label="Pending"
          value={summary ? String(summary.totalPending) : "—"}
          sublabel="Awaiting customer action"
          icon={<Clock className="size-5" />}
          accent="amber"
          loading={loading}
        />
        <StatCard
          label="Failed"
          value={summary ? String(summary.totalFailed) : "—"}
          sublabel="Cancelled & refunded excluded"
          icon={<XCircle className="size-5" />}
          accent="rose"
          loading={loading}
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Revenue Trend</CardTitle>
              <CardDescription>
                Last 14 days · paid transactions only
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="size-3" />
              {data?.trend
                ? formatPKR(
                    data.trend.reduce((s, d) => s + d.amount, 0),
                  )
                : "—"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-72">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.trend ?? []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#10b981"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="#10b981"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.4}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDay}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    labelFormatter={(l) => formatDay(String(l))}
                    formatter={(v: number) => [formatPKR(v), "Revenue"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Status Breakdown</CardTitle>
          <CardDescription>Distribution of all transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {(
                [
                  ["paid", "Paid", "emerald", summary?.totalPaid],
                  ["pending", "Pending", "amber", summary?.totalPending],
                  ["failed", "Failed", "rose", summary?.totalFailed],
                  ["cancelled", "Cancelled", "slate", summary?.totalCancelled],
                  ["refunded", "Refunded", "violet", summary?.totalRefunded],
                ] as const
              ).map(([key, label, accent, count]) => {
                const total = summary?.totalOrders ?? 0;
                const pct =
                  total === 0 ? 0 : Math.round(((count ?? 0) / total) * 100);
                const barColor: Record<string, string> = {
                  emerald: "bg-emerald-500",
                  amber: "bg-amber-500",
                  rose: "bg-rose-500",
                  slate: "bg-slate-500",
                  violet: "bg-violet-500",
                };
                return (
                  <div
                    key={key}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm text-muted-foreground">
                        {count ?? 0}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          barColor[accent],
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
