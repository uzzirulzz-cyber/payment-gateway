"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ArrowLeft,
  Smartphone,
  Landmark,
  CreditCard,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CART_ITEMS,
  PAYMENT_METHODS,
  HOW_IT_WORKS,
  cartTotal,
  cartDescription,
} from "@/lib/brand";

const schema = z.object({
  customerName: z
    .string()
    .min(2, "Please enter your full name")
    .max(80, "Name is too long"),
  customerEmail: z
    .string()
    .email("Please enter a valid email address")
    .max(120, "Email is too long"),
});

type FormValues = z.infer<typeof schema>;

const PAYMENT_ICONS = [Smartphone, Landmark, CreditCard];

export function CheckoutView({ onBack }: { onBack: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", customerEmail: "" },
  });

  const total = cartTotal();
  const description = cartDescription();

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/jazzcash/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          description,
          customerName: values.customerName,
          customerEmail: values.customerEmail,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Failed to initiate payment");
        setSubmitting(false);
        return;
      }

      // Submit hidden form to JazzCash — this navigates the browser away.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = json.formAction;
      for (const [k, v] of Object.entries(json.params as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      toast.error("Network error while initiating payment");
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ===== Header ===== */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <img
          src="/playbeat-logo.png"
          alt="PlayBeat"
          className="h-9 w-auto"
        />
        <h1 className="text-lg font-semibold">Secure Checkout</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-5 gap-6">
        {/* ===== LEFT: Order summary + payment methods ===== */}
        <div className="lg:col-span-3 space-y-6">
          {/* Order summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
              <CardDescription>
                Review your items before paying
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {CART_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-2"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-sm whitespace-nowrap">
                    PKR {(item.unitPrice * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-semibold">Total</span>
                <span className="text-2xl font-bold">
                  <span className="text-base font-normal text-muted-foreground mr-1">
                    PKR
                  </span>
                  {total.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Accepted payment methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accepted Payment Methods</CardTitle>
              <CardDescription>
                Choose your preferred method on JazzCash's secure page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {PAYMENT_METHODS.map((cat, i) => {
                  const Icon = PAYMENT_ICONS[i];
                  return (
                    <div
                      key={cat.title}
                      className="rounded-lg border bg-card/50 p-4 space-y-2"
                    >
                      <div className="size-9 rounded-md bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 flex items-center justify-center">
                        <Icon className="size-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-medium">{cat.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat.methods}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                All payments secured & processed by JazzCash
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ===== RIGHT: Your details + how it works + pay button ===== */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Details</CardTitle>
              <CardDescription>
                Enter your info to continue to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input
                  id="customerName"
                  placeholder="Ahmed Raza"
                  autoComplete="name"
                  {...register("customerName")}
                />
                {errors.customerName && (
                  <p className="text-xs text-destructive">
                    {errors.customerName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("customerEmail")}
                />
                {errors.customerEmail && (
                  <p className="text-xs text-destructive">
                    {errors.customerEmail.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {HOW_IT_WORKS.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="size-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground pt-0.5">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Redirecting to JazzCash…
                </>
              ) : (
                <>
                  Pay Now — PKR {total.toLocaleString()}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our terms of service. Payments
              processed by JazzCash.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
