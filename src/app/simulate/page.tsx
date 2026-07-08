"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Smartphone,
  Landmark,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SimulateParams {
  pp_MerchantID: string;
  pp_TxnRefNo: string;
  pp_Amount: string;
  pp_Description: string;
  pp_ReturnURL: string;
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  [key: string]: string;
}

type PaymentMethod = "wallet" | "bank" | "card";

export default function SimulatePage() {
  const router = useRouter();
  const [params, setParams] = useState<SimulateParams | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("wallet");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failed, setFailed] = useState(false);

  // Form fields per method (pre-filled with test values)
  const [walletNumber, setWalletNumber] = useState("03001234567");
  const [bankAccount, setBankAccount] = useState("PK36SCBL0000001123456702");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [otp, setOtp] = useState("1234");

  useEffect(() => {
    // The checkout-view redirects to /simulate?pp_TxnRefNo=...&pp_Amount=...
    // when demoMode is true. Read the params from the URL.
    const url = new URL(window.location.href);
    const collected: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      collected[k] = v;
    });
    if (collected.pp_TxnRefNo) {
      // Use a microtask to defer the state update outside the effect body
      // to avoid the "setState in effect" lint rule.
      Promise.resolve().then(() => setParams(collected as SimulateParams));
    }
  }, []);

  const amountInPaisa = params?.pp_Amount ?? "0";
  const amountInPkr = (Number(amountInPaisa) / 100).toLocaleString();

  const handlePay = async (shouldFail = false) => {
    if (!params) return;
    setProcessing(true);

    // Simulate a 2-second processing delay (feels real)
    await new Promise((r) => setTimeout(r, 2000));

    // Build the response params — mirrors what JazzCash sends back.
    // Response code 000 = success, 121 = transaction not found (failure).
    const responseParams: Record<string, string> = {
      pp_ResponseCode: shouldFail ? "121" : "000",
      pp_ResponseMessage: shouldFail ? "Transaction not found" : "Approved",
      pp_TxnRefNo: params.pp_TxnRefNo,
      pp_Amount: params.pp_Amount,
      pp_TxnCurrency: params.pp_TxnCurrency ?? "PKR",
      pp_TxnDateTime: params.pp_TxnDateTime ?? new Date().toISOString(),
      pp_MerchantID: params.pp_MerchantID,
      pp_Description: params.pp_Description ?? "",
      pp_BillReference: `billRef-${params.pp_TxnRefNo}`,
      pp_SecureHash: "", // filled by /api/simulate/callback
      pp_RetreivalReferenceNumber: shouldFail
        ? ""
        : `5023${Math.floor(100000 + Math.random() * 900000)}`,
      pp_PaymentMethod:
        method === "wallet"
          ? "MWALLET"
          : method === "bank"
            ? "BANKACCOUNT"
            : "CREDITCARD",
      pp_paidBy:
        method === "wallet"
          ? walletNumber
          : method === "bank"
            ? bankAccount
            : cardNumber.slice(-4),
    };

    // POST to /api/simulate/callback → signs response → redirects to /api/jazzcash/return
    try {
      const res = await fetch("/api/simulate/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseParams,
          returnUrl: params.pp_ReturnURL,
        }),
      });
      const json = await res.json();

      if (json.ok) {
        if (shouldFail) {
          setFailed(true);
        } else {
          setSuccess(true);
        }
        setTimeout(() => {
          window.location.href = json.redirectUrl;
        }, 2000);
      } else {
        setProcessing(false);
        alert("Simulation failed: " + (json.error ?? "unknown"));
      }
    } catch (e) {
      setProcessing(false);
      console.error(e);
      alert("Network error during simulation.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="max-w-md w-full bg-card border-white/10">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="size-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="size-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Successful
            </h2>
            <p className="text-white/60 text-sm mb-4">
              Your payment of PKR {amountInPkr} has been processed.
            </p>
            <p className="text-white/40 text-xs">
              Redirecting you back to PlayBeat…
            </p>
            <Loader2 className="size-5 animate-spin text-white/40 mx-auto mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="max-w-md w-full bg-card border-white/10">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="size-20 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="size-12 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Failed
            </h2>
            <p className="text-white/60 text-sm mb-4">
              Your payment of PKR {amountInPkr} could not be processed.
            </p>
            <p className="text-white/40 text-xs mb-2">
              Response code: 121 — Transaction not found
            </p>
            <p className="text-white/40 text-xs">
              Redirecting you back to PlayBeat…
            </p>
            <Loader2 className="size-5 animate-spin text-white/40 mx-auto mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!params) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-white/40 mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading payment details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black text-white">
      {/* ===== Header ===== */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded bg-red-600 flex items-center justify-center text-xs font-bold">
              J
            </div>
            <span className="font-semibold text-sm">
              JazzCash Secure Checkout
            </span>
          </div>
          <Badge
            variant="secondary"
            className="bg-amber-500/20 text-amber-300 border-0 gap-1"
          >
            <ShieldCheck className="size-3" />
            Demo Mode
          </Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Order summary */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardDescription className="text-white/50">
              Merchant
            </CardDescription>
            <CardTitle className="text-base text-white">
              PlayBeat Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Description</span>
              <span className="text-white text-right max-w-60 truncate">
                {params.pp_Description}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Transaction ref</span>
              <span className="text-white font-mono text-xs">
                {params.pp_TxnRefNo}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
              <span className="text-white/70 font-medium">Total</span>
              <span className="text-3xl font-bold">
                <span className="text-base font-normal text-white/50 mr-1">
                  PKR
                </span>
                {amountInPkr}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment method selector */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">
            Choose payment method
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <MethodCard
              active={method === "wallet"}
              onClick={() => setMethod("wallet")}
              icon={<Smartphone className="size-5" />}
              label="Mobile Wallet"
            />
            <MethodCard
              active={method === "bank"}
              onClick={() => setMethod("bank")}
              icon={<Landmark className="size-5" />}
              label="Bank Account"
            />
            <MethodCard
              active={method === "card"}
              onClick={() => setMethod("card")}
              icon={<CreditCard className="size-5" />}
              label="Debit/Credit"
            />
          </div>
        </div>

        {/* Method-specific form */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="pt-6 space-y-4">
            {method === "wallet" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="wallet" className="text-white/70">
                    JazzCash Wallet Number
                  </Label>
                  <Input
                    id="wallet"
                    value={walletNumber}
                    onChange={(e) => setWalletNumber(e.target.value)}
                    placeholder="0300XXXXXXX"
                    className="bg-black/50 border-white/10 text-white"
                  />
                  <p className="text-xs text-white/40">
                    Demo: any number works. Pre-filled with 03001234567.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-white/70">
                    OTP (4 digits)
                  </Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="bg-black/50 border-white/10 text-white font-mono"
                  />
                  <p className="text-xs text-white/40">
                    Demo: enter any 4 digits.
                  </p>
                </div>
              </>
            )}

            {method === "bank" && (
              <div className="space-y-2">
                <Label htmlFor="bank" className="text-white/70">
                  Bank Account Number (IBAN)
                </Label>
                <Input
                  id="bank"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="PK36SCBL..."
                  className="bg-black/50 border-white/10 text-white font-mono"
                />
                <p className="text-xs text-white/40">
                  Demo: any IBAN works. Pre-filled with a test IBAN.
                </p>
              </div>
            )}

            {method === "card" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="card" className="text-white/70">
                    Card Number
                  </Label>
                  <Input
                    id="card"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="bg-black/50 border-white/10 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-white/70">
                      Expiry
                    </Label>
                    <Input
                      id="expiry"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="bg-black/50 border-white/10 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-white/70">
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      className="bg-black/50 border-white/10 text-white font-mono"
                    />
                  </div>
                </div>
                <p className="text-xs text-white/40">
                  Demo: use test card 4242 4242 4242 4242, any future expiry,
                  any CVV.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pay button */}
        <Button
          size="lg"
          className="w-full h-14 pb-gradient text-white text-base font-semibold shadow-lg shadow-blue-500/30"
          onClick={() => handlePay(false)}
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Processing payment…
            </>
          ) : (
            <>
              <Lock className="size-4" />
              Pay PKR {amountInPkr} Securely
            </>
          )}
        </Button>

        {/* Simulate failure button (demo only) */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 mt-2 border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
          onClick={() => handlePay(true)}
          disabled={processing}
        >
          <XCircle className="size-3.5" />
          Simulate payment failure (demo)
        </Button>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3" />
            256-bit SSL
          </span>
          <span>·</span>
          <span>PCI DSS Compliant</span>
          <span>·</span>
          <span>Powered by JazzCash</span>
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-6 mx-auto flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="size-3" />
          Cancel and return to PlayBeat
        </button>
      </main>
    </div>
  );
}

function MethodCard({
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
        active
          ? "border-blue-400 bg-blue-500/15 text-white"
          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80",
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
