"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Search,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  ExternalLink,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  txnRefNo: string;
  amount: number;
  description: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  responseCode: string | null;
  responseMessage: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  receiptSentAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  paid: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    icon: <CheckCircle2 className="size-3" />,
  },
  refunded: {
    label: "Refunded",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    icon: <RotateCcw className="size-3" />,
  },
  failed: {
    label: "Failed",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    icon: <XCircle className="size-3" />,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    icon: <Clock className="size-3" />,
  },
};

export function RefundsView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      // Fetch paid + refunded orders (candidates for refund management)
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/orders?${params.toString()}&limit=100`);
      const json = await res.json();
      if (json.ok) {
        // Filter to only paid + refunded on the client
        const filtered = (json.data as Order[]).filter(
          (o) => o.status === "paid" || o.status === "refunded",
        );
        setOrders(filtered);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/orders/${refundTarget.txnRefNo}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason || undefined }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Order ${refundTarget.txnRefNo} refunded.`);
        setRefundTarget(null);
        setRefundReason("");
        load(true);
      } else {
        toast.error(json.error ?? "Failed to refund order");
      }
    } catch {
      toast.error("Network error while processing refund");
    } finally {
      setRefunding(false);
    }
  };

  const paidCount = orders.filter((o) => o.status === "paid").length;
  const refundedCount = orders.filter((o) => o.status === "refunded").length;
  const refundableTotal = orders
    .filter((o) => o.status === "paid")
    .reduce((s, o) => s + o.amount, 0);
  const refundedTotal = orders
    .filter((o) => o.status === "refunded")
    .reduce((s, o) => s + o.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black/60 border-white/10">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-white/50">Refundable</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{paidCount}</p>
            <p className="text-xs text-white/40 mt-1">Paid orders eligible</p>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-white/10">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-white/50">Refunded</p>
            <p className="text-2xl font-bold text-violet-400 mt-1">{refundedCount}</p>
            <p className="text-xs text-white/40 mt-1">Already processed</p>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-white/10">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-white/50">Refundable amount</p>
            <p className="text-2xl font-bold text-white mt-1">
              ₨ {refundableTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-white/10">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-white/50">Refunded amount</p>
            <p className="text-2xl font-bold text-white mt-1">
              ₨ {refundedTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-black/60 border-white/10">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl text-white">Refund Management</CardTitle>
              <CardDescription className="text-white/50">
                Refund paid orders or review previously refunded transactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-full sm:w-48 bg-black/50 border-white/10 text-white"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => load(true)}
                disabled={refreshing}
                className="border-white/10 text-white/70 hover:bg-white/10"
              >
                {refreshing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">Reference</TableHead>
                  <TableHead className="text-white/50">Description</TableHead>
                  <TableHead className="text-white/50">Customer</TableHead>
                  <TableHead className="text-white/50 text-right">Amount</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                  <TableHead className="text-white/50">Receipt</TableHead>
                  <TableHead className="text-white/50 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={7}
                      className="text-center text-sm text-white/40 py-12"
                    >
                      No paid or refunded orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => {
                    const meta = STATUS_META[o.status] ?? STATUS_META.pending;
                    return (
                      <TableRow
                        key={o.id}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <TableCell>
                          <div className="font-mono text-xs text-white">
                            {o.txnRefNo}
                          </div>
                          {o.transactionId && (
                            <div className="font-mono text-[10px] text-white/40">
                              txn: {o.transactionId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell
                          className="max-w-40 truncate text-white/80"
                          title={o.description}
                        >
                          {o.description}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-white">{o.customerName ?? "—"}</div>
                          <div className="text-xs text-white/40">
                            {o.customerEmail ?? ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-white">
                          ₨ {o.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("gap-1 font-medium border-0", meta.className)}
                          >
                            {meta.icon}
                            {meta.label}
                          </Badge>
                          {o.refundedAt && (
                            <div className="text-[10px] text-white/40 mt-0.5">
                              {formatDate(o.refundedAt)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {o.receiptSentAt ? (
                              <Badge
                                variant="outline"
                                className="gap-1 border-emerald-500/30 text-emerald-300 text-[10px]"
                              >
                                <Mail className="size-2.5" />
                                Sent
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-white/30">—</span>
                            )}
                            <a
                              href={`/api/orders/${o.txnRefNo}/receipt`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-white/50 hover:text-white"
                            >
                              <Receipt className="size-3.5" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {o.status === "paid" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 gap-1"
                              onClick={() => setRefundTarget(o)}
                            >
                              <RotateCcw className="size-3" />
                              Refund
                            </Button>
                          ) : (
                            <span className="text-xs text-white/30">
                              {o.refundReason ?? "—"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Refund confirmation dialog */}
      <Dialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <RotateCcw className="size-5 text-violet-400" />
              Process refund
            </DialogTitle>
            <DialogDescription className="text-white/60">
              This will mark the order as refunded. The customer will not be
              notified automatically in demo mode.
            </DialogDescription>
          </DialogHeader>

          {refundTarget && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-black/50 border border-white/10 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Reference</span>
                  <span className="font-mono text-white text-xs">
                    {refundTarget.txnRefNo}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Description</span>
                  <span className="text-white text-right max-w-48 truncate">
                    {refundTarget.description}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Customer</span>
                  <span className="text-white">
                    {refundTarget.customerName ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                  <span className="text-white/70 font-medium">Refund amount</span>
                  <span className="text-xl font-bold text-violet-400">
                    ₨ {refundTarget.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-white/70">
                  Reason (optional)
                </Label>
                <Textarea
                  id="reason"
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer request, duplicate charge, etc."
                  className="bg-black/50 border-white/10 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundTarget(null)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={refunding}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {refunding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Confirm refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
