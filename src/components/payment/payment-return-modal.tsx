"use client";

import { useEffect, useState, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Order {
  txnRefNo: string;
  amount: number;
  description: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  responseMessage: string | null;
  customerName: string | null;
  customerEmail: string | null;
  transactionId: string | null;
}

export function PaymentReturnModal() {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [polling, setPolling] = useState(false);
  const [urlStatus, setUrlStatus] = useState<string>("");
  const [txnRefNo, setTxnRefNo] = useState<string>("");
  const stopRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("payment") !== "return") return;
    const ref = url.searchParams.get("txnRefNo") ?? "";
    const status = url.searchParams.get("status") ?? "pending";
    if (!ref) return;

    setTxnRefNo(ref);
    setUrlStatus(status);
    setOpen(true);

    // Clean URL so the modal doesn't re-open on refresh
    url.searchParams.delete("payment");
    url.searchParams.delete("txnRefNo");
    url.searchParams.delete("status");
    window.history.replaceState({}, "", url.toString());

    // Start polling for the latest status
    stopRef.current = false;
    let attempts = 0;
    const poll = async () => {
      setPolling(true);
      while (!stopRef.current && attempts < 30) {
        attempts++;
        try {
          const res = await fetch(`/api/orders/${ref}`);
          const json = await res.json();
          if (json.ok) {
            const o = json.data as Order;
            setOrder(o);
            if (o.status !== "pending") {
              break;
            }
          }
        } catch {
          /* ignore transient errors */
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      setPolling(false);
    };
    poll();

    return () => {
      stopRef.current = true;
    };
  }, []);

  const effectiveStatus = order?.status ?? urlStatus ?? "pending";
  const isPaid = effectiveStatus === "paid";
  const isFailed =
    effectiveStatus === "failed" || effectiveStatus === "cancelled";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isPaid
              ? "Payment Successful"
              : isFailed
                ? "Payment Failed"
                : "Confirming Payment…"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Transaction reference{" "}
            <span className="font-mono text-foreground">{txnRefNo}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 gap-4">
          <div
            className={
              "size-20 rounded-full flex items-center justify-center " +
              (isPaid
                ? "bg-emerald-100 dark:bg-emerald-950"
                : isFailed
                  ? "bg-rose-100 dark:bg-rose-950"
                  : "bg-amber-100 dark:bg-amber-950")
            }
          >
            {isPaid ? (
              <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-400" />
            ) : isFailed ? (
              <XCircle className="size-12 text-rose-600 dark:text-rose-400" />
            ) : (
              <Loader2 className="size-12 text-amber-600 dark:text-amber-400 animate-spin" />
            )}
          </div>

          {order && (
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  ₨ {order.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="text-right max-w-60 truncate">
                  {order.description}
                </span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{order.customerName}</span>
                </div>
              )}
              {order.transactionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">JazzCash txn</span>
                  <span className="font-mono text-xs">
                    {order.transactionId}
                  </span>
                </div>
              )}
              {order.responseMessage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Message</span>
                  <span>{order.responseMessage}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="secondary"
                  className={
                    isPaid
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : isFailed
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  }
                >
                  {effectiveStatus}
                </Badge>
              </div>
            </div>
          )}

          {!order && (
            <p className="text-sm text-muted-foreground text-center">
              Looking up your transaction…
            </p>
          )}

          {polling && order?.status === "pending" && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              Still confirming with JazzCash…
            </p>
          )}

          <Button
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => setOpen(false)}
          >
            <ArrowRight className="size-4" />
            {isPaid ? "Done" : isFailed ? "Close" : "Dismiss"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
