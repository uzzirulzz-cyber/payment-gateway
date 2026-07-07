=== JazzCash for WooCommerce ===
Contributors: playbeatdigital
Tags: jazzcash, woocommerce, payment gateway, pakistan, mobile wallet
Requires at least: 6.2
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Accept JazzCash Mobile Wallet, Bank Account, and Debit/Credit Card payments in your WooCommerce store.

== Description ==

**JazzCash for WooCommerce** lets you accept payments in your WooCommerce store via JazzCash — Pakistan's leading payment gateway.

Customers are redirected to JazzCash secure checkout where they can pay via:
* Mobile Wallets (JazzCash Wallet, Easypaisa)
* Bank Account (Internet Banking, Direct Debit)
* Debit / Credit Card (Visa, Mastercard, UnionPay)

After payment, JazzCash redirects them back to your store with a signed callback. The plugin verifies the SHA-256 secure hash and updates the order status automatically.

**Key features**
* Sandbox + Production modes (toggle in settings).
* SHA-256 signed initiate requests + hash-verified callbacks.
* Auto-submits to JazzCash from a clean receipt page.
* Works with both the classic checkout and the Cart & Checkout blocks.
* Stores raw JazzCash response on the order for forensics.
* Debug logging to WooCommerce > Status > Logs.

== Installation ==

1. Upload the `woocommerce-jazzcash` folder to `/wp-content/plugins/`.
2. Activate **JazzCash for WooCommerce** from the Plugins screen.
3. Go to WooCommerce → Settings → Payments → JazzCash → Manage.
4. Tick "Enable JazzCash", enter your Merchant ID, Password, and Integrity Salt (from JazzCash sandbox or production account).
5. Tick "Sandbox mode" for testing, untick for live payments.
6. Save changes.

== Frequently Asked Questions ==

= Where do I get my Merchant ID, Password, and Integrity Salt? =

Log in to your JazzCash Merchant Account at https://sandbox.jazzcash.com.pk (sandbox) or https://payments.jazzcash.com.pk (production). They're under Account → Merchant Profile → API Credentials.

= I see "insufficient merchant information" on the JazzCash page. What's wrong? =

This is a JazzCash-side error — your merchant account hasn't been fully provisioned. Email merchantsupport@jazz.com.pk with your Merchant ID and ask them to (a) confirm the account is active, (b) provide your assigned `pp_BankID` and `pp_ProductID`, and (c) confirm which `pp_TxnType` values are enabled (MWALLET, CREDIT_CARD, etc.).

= How do I switch from sandbox to live? =

Untick "Sandbox mode" in the gateway settings and replace your sandbox credentials with your production credentials.

== Changelog ==

= 1.0.0 =
* Initial release.
* SHA-256 signed initiate + verified callback.
* Sandbox + Production modes.
* Classic checkout + Cart & Checkout block support.
