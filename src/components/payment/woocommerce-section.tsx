"use client";

import { useState } from "react";
import {
  Download,
  Package,
  Code2,
  ShoppingCart,
  Shield,
  Zap,
  Check,
  Copy,
  CheckCircle2,
  FileCode,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PLUGIN_FILES = [
  {
    path: "jazzcash-woocommerce.php",
    desc: "Main plugin bootstrap. Registers the gateway, adds settings link, requires WooCommerce.",
    lines: 75,
  },
  {
    path: "includes/class-wc-gateway-jazzcash.php",
    desc: "The core gateway class. Extends WC_Payment_Gateway — signing, receipt page, callback handler, admin settings.",
    lines: 310,
  },
  {
    path: "includes/class-wc-gateway-jazzcash-blocks.php",
    desc: "Cart & Checkout block support. Registers the payment method with WooCommerce Blocks.",
    lines: 80,
  },
  {
    path: "assets/js/blocks.js",
    desc: "JS handler that renders the JazzCash option inside the block-based checkout.",
    lines: 30,
  },
  {
    path: "uninstall.php",
    desc: "Cleans up plugin options when uninstalled (not deactivated).",
    lines: 18,
  },
  {
    path: "readme.txt",
    desc: "WordPress.org-style readme with installation + FAQ.",
    lines: 75,
  },
];

const INSTALL_STEPS = [
  {
    title: "Download the plugin",
    body: "Click the download button above to get the latest zip (v1.0.0, ~10 KB).",
  },
  {
    title: "Install in WordPress",
    body: "WP Admin → Plugins → Add New → Upload Plugin → choose the zip → Install Now → Activate.",
  },
  {
    title: "Open gateway settings",
    body: "WooCommerce → Settings → Payments → JazzCash → Manage.",
  },
  {
    title: "Enter your credentials",
    body: "Paste your Merchant ID, Password, and Integrity Salt (from sandbox.jazzcash.com.pk or payments.jazzcash.com.pk).",
  },
  {
    title: "Pick sandbox or live",
    body: "Tick 'Sandbox mode' for testing, untick to receive real payments. Save changes.",
  },
  {
    title: "Test a checkout",
    body: "Add a product to cart, go to checkout, select JazzCash, complete payment. Verify the order updates to Processing or Failed.",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "SHA-256 signed",
    body: "Every checkout request is signed with your Integrity Salt. Callbacks are hash-verified before orders are marked paid.",
  },
  {
    icon: Zap,
    title: "Sandbox + Live",
    body: "One-click toggle between sandbox and production. No code changes needed to go live.",
  },
  {
    icon: ShoppingCart,
    title: "Block + Classic",
    body: "Works with both the classic WooCommerce checkout and the new Cart & Checkout blocks.",
  },
  {
    icon: FileCode,
    title: "Clean code",
    body: "Extends WC_Payment_Gateway following WooCommerce conventions. No external dependencies, no Composer.",
  },
];

const SAMPLE_CODE = `<?php
// Compute pp_SecureHash — same algorithm as the Next.js app
protected function compute_secure_hash( $params, $salt = null ) {
    $salt = null === $salt ? $this->integrity_salt : $salt;

    $keys = array_keys( $params );
    sort( $keys );
    $keys = array_diff( $keys, array( 'pp_SecureHash' ) );

    $values = array_map( function ( $k ) use ( $params ) {
        return isset( $params[ $k ] ) ? $params[ $k ] : '';
    }, $keys );

    $string = $salt . '&' . implode( '&', $values );
    return strtoupper( hash( 'sha256', $string ) );
}`;

export function WooCommerceSection() {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Slight delay so the loading state is visible.
      await new Promise((r) => setTimeout(r, 600));
      window.open("/woocommerce-jazzcash.zip", "_blank");
      toast.success("Plugin zip download started.");
    } catch {
      toast.error("Download failed — please retry.");
    } finally {
      setDownloading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_CODE);
      setCopied(true);
      toast.success("Code snippet copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access denied.");
    }
  };

  return (
    <div className="space-y-12">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute top-[-10%] left-[20%] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute top-[20%] right-[10%] h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        </div>

        <div className="text-center max-w-3xl mx-auto pt-6">
          <Badge
            variant="secondary"
            className="mb-5 gap-1.5 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900"
          >
            <Package className="size-3" />
            WooCommerce Plugin · v1.0.0
          </Badge>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Add JazzCash payments to your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              WooCommerce store
            </span>
          </h1>

          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            A drop-in WordPress plugin that adds JazzCash as a payment method
            to any WooCommerce store. Mobile Wallet, Bank Account, or
            Debit/Credit Card — signed with the same SHA-256 logic as our
            hosted gateway.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download plugin (.zip, ~10 KB)
            </Button>
            <a
              href="https://github.com/uzzirulzz-cyber/payment-gateway/tree/main/public/woocommerce-jazzcash"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" variant="outline" className="h-12 px-6">
                <Code2 className="size-4" />
                View source on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                className="hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all"
              >
                <CardContent className="pt-6">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 flex items-center justify-center mb-4">
                    <Icon className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ===== Installation ===== */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="mb-3">
            Installation
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            Live in under 5 minutes.
          </h2>
          <p className="mt-3 text-muted-foreground">
            No code changes to your theme. Upload, activate, paste credentials.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {INSTALL_STEPS.map((step, i) => (
            <Card key={step.title} className="relative">
              <CardContent className="pt-6">
                <div className="absolute top-4 right-4 size-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-base mb-1.5 pr-10">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== File structure ===== */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Plugin contents</CardTitle>
            <CardDescription>
              6 files · 588 lines of code · no external dependencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PLUGIN_FILES.map((f) => (
                <div
                  key={f.path}
                  className="flex items-start gap-3 rounded-lg border bg-card/50 p-3 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                >
                  <FileCode className="size-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <code className="text-sm font-mono text-foreground break-all">
                        {f.path}
                      </code>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {f.lines} lines
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== Code preview ===== */}
      <section>
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Code2 className="size-5 text-blue-600 dark:text-blue-400" />
                  How signing works
                </CardTitle>
                <CardDescription>
                  Same SHA-256 algorithm as our hosted gateway — keeps both
                  integrations in sync.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 text-slate-100 p-4 text-xs leading-relaxed font-mono">
              <code>{SAMPLE_CODE}</code>
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              >
                <Check className="size-3" />
                WC_Payment_Gateway
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              >
                <Check className="size-3" />
                SHA-256 signed
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              >
                <Check className="size-3" />
                hash_equals() verify
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              >
                <Check className="size-3" />
                Block editor ready
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== CTA ===== */}
      <section>
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-600 to-blue-600 text-white">
          <CardContent className="pt-10 pb-10 px-8 sm:px-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Ready to accept JazzCash on your store?
            </h2>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Download the plugin, install it on any WordPress site with
              WooCommerce 6.2+ and PHP 7.4+, and you're live in minutes.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-8 bg-white text-blue-700 hover:bg-white/90"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download plugin
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
