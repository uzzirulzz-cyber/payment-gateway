"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Filter,
} from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

interface Order {
  id: string;
  txnRefNo: string;
  amount: number;
  description: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: OrderStatus;
  responseCode: string | null;
  responseMessage: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  paid: {
    label: "Paid",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    icon: <CheckCircle2 className="size-3" />,
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    icon: <Clock className="size-3" />,
  },
  failed: {
    label: "Failed",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    icon: <XCircle className="size-3" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: <XCircle className="size-3" />,
  },
  refunded: {
    label: "Refunded",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    icon: <RotateCcw className="size-3" />,
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaymentHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (json.ok) setOrders(json.data as Order[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250); // debounce
    return () => clearTimeout(t);
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Payment History</CardTitle>
            <CardDescription>
              {orders.length} transaction{orders.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search ref, email, name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <Filter className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => load(true)}
              disabled={refreshing}
              title="Refresh"
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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground py-12"
                  >
                    No transactions found. Try clearing filters or create a new
                    payment.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const meta = STATUS_META[o.status];
                  return (
                    <TableRow key={o.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-mono text-xs">{o.txnRefNo}</div>
                        {o.transactionId && (
                          <div className="font-mono text-[10px] text-muted-foreground">
                            txn: {o.transactionId}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-48 truncate" title={o.description}>
                        {o.description}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{o.customerName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {o.customerEmail ?? ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₨ {o.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("gap-1 font-medium", meta.className)}
                        >
                          {meta.icon}
                          {meta.label}
                        </Badge>
                        {o.responseMessage && o.status !== "paid" && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {o.responseMessage}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(o.createdAt)}
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
  );
}
