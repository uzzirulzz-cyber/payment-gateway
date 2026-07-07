<?php
/**
 * JazzCash Payment Gateway class.
 *
 * Extends WC_Payment_Gateway to provide JazzCash Mobile Wallet / Card / Bank
 * payments. Mirrors the same SHA-256 signing logic used by the PlayBeat
 * Digital Next.js app, so callbacks can be verified identically.
 *
 * @package JazzCashWooCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
        exit;
}

/**
 * WC_Gateway_JazzCash
 */
class WC_Gateway_JazzCash extends WC_Payment_Gateway {

        /**
         * Unique gateway ID.
         */
        const ID = 'jazzcash';

        /**
         * Sandbox toggle (yes/no).
         *
         * @var string
         */
        public $sandbox;

        /**
         * JazzCash Merchant ID (pp_MerchantID).
         *
         * @var string
         */
        public $merchant_id;

        /**
         * JazzCash Password (pp_Password).
         *
         * @var string
         */
        public $password;

        /**
         * JazzCash Integrity Salt (used for HMAC-style hash).
         *
         * @var string
         */
        public $integrity_salt;

        /**
         * Return URL JazzCash POSTs the callback to.
         *
         * @var string
         */
        public $return_url;

        /**
         * Constructor.
         */
        public function __construct() {
                $this->id                 = self::ID;
                $this->icon               = JCWC_PLUGIN_URL . 'assets/images/jazzcash-logo.svg';
                $this->has_fields         = false;
                $this->method_title       = __( 'JazzCash', 'jazzcash-woocommerce' );
                $this->method_description = __( 'Accept payments via JazzCash Mobile Wallet, Bank Account, or Debit/Credit Card. Customers are redirected to JazzCash secure checkout.', 'jazzcash-woocommerce' );

                // Load settings.
                $this->init_form_fields();
                $this->init_settings();

                // User-set variables.
                $this->title         = $this->get_option( 'title' );
                $this->description   = $this->get_option( 'description' );
                $this->sandbox       = $this->get_option( 'sandbox', 'yes' );
                $this->merchant_id   = $this->get_option( 'merchant_id' );
                $this->password      = $this->get_option( 'password' );
                $this->integrity_salt = $this->get_option( 'integrity_salt' );
                $this->return_url    = $this->get_option( 'return_url', WC()->api_request_url( 'jazzcash_callback' ) );

                // Hooks.
                add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
                add_action( 'woocommerce_api_jazzcash_callback', array( $this, 'handle_callback' ) );
                add_action( 'woocommerce_receipt_' . $this->id, array( $this, 'render_receipt_page' ) );

                // Block editor support.
                add_action( 'woocommerce_blocks_loaded', array( $this, 'register_block_support' ) );
        }

        /**
         * Admin form fields.
         */
        public function init_form_fields() {
                $this->form_fields = array(
                        'enabled' => array(
                                'title'   => __( 'Enable/Disable', 'jazzcash-woocommerce' ),
                                'type'    => 'checkbox',
                                'label'   => __( 'Enable JazzCash', 'jazzcash-woocommerce' ),
                                'default' => 'no',
                        ),
                        'title' => array(
                                'title'       => __( 'Title', 'jazzcash-woocommerce' ),
                                'type'        => 'text',
                                'description' => __( 'Payment method title shown to customers at checkout.', 'jazzcash-woocommerce' ),
                                'default'     => __( 'JazzCash', 'jazzcash-woocommerce' ),
                                'desc_tip'    => true,
                        ),
                        'description' => array(
                                'title'       => __( 'Description', 'jazzcash-woocommerce' ),
                                'type'        => 'textarea',
                                'description' => __( 'Payment method description shown at checkout.', 'jazzcash-woocommerce' ),
                                'default'     => __( 'Pay securely via JazzCash Mobile Wallet, Bank Account, or Debit/Credit Card.', 'jazzcash-woocommerce' ),
                                'desc_tip'    => true,
                        ),
                        'sandbox' => array(
                                'title'       => __( 'Sandbox mode', 'jazzcash-woocommerce' ),
                                'type'        => 'checkbox',
                                'label'       => __( 'Use JazzCash sandbox (test mode)', 'jazzcash-woocommerce' ),
                                'description' => __( 'Tick for sandbox. Untick to receive live payments.', 'jazzcash-woocommerce' ),
                                'default'     => 'yes',
                                'desc_tip'    => true,
                        ),
                        'merchant_id' => array(
                                'title'       => __( 'Merchant ID', 'jazzcash-woocommerce' ),
                                'type'        => 'text',
                                'description' => __( 'Your JazzCash Merchant ID (pp_MerchantID).', 'jazzcash-woocommerce' ),
                                'default'     => '',
                                'desc_tip'    => true,
                        ),
                        'password' => array(
                                'title'       => __( 'Password', 'jazzcash-woocommerce' ),
                                'type'        => 'password',
                                'description' => __( 'Your JazzCash Password (pp_Password).', 'jazzcash-woocommerce' ),
                                'default'     => '',
                                'desc_tip'    => true,
                        ),
                        'integrity_salt' => array(
                                'title'       => __( 'Integrity Salt', 'jazzcash-woocommerce' ),
                                'type'        => 'password',
                                'description' => __( 'Your JazzCash Integrity Salt (used to compute pp_SecureHash).', 'jazzcash-woocommerce' ),
                                'default'     => '',
                                'desc_tip'    => true,
                        ),
                        'return_url' => array(
                                'title'       => __( 'Return URL', 'jazzcash-woocommerce' ),
                                'type'        => 'text',
                                'description' => __( 'JazzCash POSTs the payment callback here. Leave blank to use the default WooCommerce API endpoint.', 'jazzcash-woocommerce' ),
                                'default'     => '',
                                'placeholder' => WC()->api_request_url( 'jazzcash_callback' ),
                                'desc_tip'    => true,
                        ),
                        'debug' => array(
                                'title'       => __( 'Debug log', 'jazzcash-woocommerce' ),
                                'type'        => 'checkbox',
                                'label'       => __( 'Log request/response details to WooCommerce > Status > Logs', 'jazzcash-woocommerce' ),
                                'default'     => 'no',
                                'desc_tip'    => true,
                        ),
                );
        }

        /**
         * Process payment: redirect customer to the receipt page which builds
         * and auto-submits the signed JazzCash form.
         *
         * @param int $order_id Order ID.
         * @return array
         */
        public function process_payment( $order_id ) {
                $order = wc_get_order( $order_id );

                // Mark as pending (awaiting JazzCash payment).
                $order->update_status( 'pending', __( 'Awaiting JazzCash payment', 'jazzcash-woocommerce' ) );

                // Reduce stock.
                wc_reduce_stock_levels( $order_id );

                // Empty cart.
                WC()->cart->empty_cart();

                // Redirect to receipt page which renders the auto-submit form.
                return array(
                        'result'   => 'success',
                        'redirect' => $order->get_checkout_payment_url( true ),
                );
        }

        /**
         * Render the receipt page: builds signed form and auto-submits to JazzCash.
         *
         * @param int $order_id Order ID.
         */
        public function render_receipt_page( $order_id ) {
                $order = wc_get_order( $order_id );

                if ( ! $order ) {
                        return;
                }

                $params      = $this->build_payment_params( $order );
                $form_action = $this->get_form_action();

                if ( 'yes' === $this->get_option( 'debug' ) ) {
                        $this->log( 'Initiate request: ' . wp_json_encode( $params ) );
                }

                echo '<h2>' . esc_html__( 'Redirecting to JazzCash…', 'jazzcash-woocommerce' ) . '</h2>';
                echo '<p>' . esc_html__( 'Please wait while we redirect you to JazzCash secure checkout.', 'jazzcash-woocommerce' ) . '</p>';

                echo '<form id="jazzcash-redirect-form" method="POST" action="' . esc_url( $form_action ) . '">';
                foreach ( $params as $key => $value ) {
                        echo '<input type="hidden" name="' . esc_attr( $key ) . '" value="' . esc_attr( $value ) . '" />';
                }
                echo '<noscript><button type="submit">' . esc_html__( 'Continue to JazzCash', 'jazzcash-woocommerce' ) . '</button></noscript>';
                echo '</form>';
                echo '<script>document.getElementById("jazzcash-redirect-form").submit();</script>';
        }

        /**
         * Build all signed JazzCash params for an order.
         *
         * @param WC_Order $order Order object.
         * @return array
         */
        protected function build_payment_params( $order ) {
                $txn_ref_no = 'T' . time() . wp_rand( 100000, 999999 );

                // Store txn ref on the order so we can match it on callback.
                $order->update_meta_data( '_jazzcash_txn_ref_no', $txn_ref_no );
                $order->save();

                $amount_paisa = str_pad( (string) round( $order->get_total() * 100 ), 10, '0', STR_PAD_LEFT );
                $datetime     = gmdate( 'YmdHis' );
                $expiry       = gmdate( 'YmdHis', time() + 3600 );

                $params = array(
                        'pp_Version'           => '1.1',
                        'pp_TxnType'           => 'MWALLET',
                        'pp_Language'          => 'EN',
                        'pp_MerchantID'        => $this->merchant_id,
                        'pp_SubMerchantID'     => '',
                        'pp_Password'          => $this->password,
                        'pp_BankID'            => 'TBANK',
                        'pp_ProductID'         => 'RETL',
                        'pp_TxnRefNo'          => $txn_ref_no,
                        'pp_Amount'            => $amount_paisa,
                        'pp_TxnCurrency'       => 'PKR',
                        'pp_TxnDateTime'       => $datetime,
                        'pp_BillReference'     => 'billRef-' . $txn_ref_no,
                        'pp_Description'       => $this->build_description( $order ),
                        'pp_TxnExpiryDateTime' => $expiry,
                        'pp_ReturnURL'         => $this->return_url,
                        'ppmpf_1'              => $order->get_billing_email(),
                        'ppmpf_2'              => $order->get_billing_phone(),
                        'ppmpf_3'              => '',
                        'ppmpf_4'              => '',
                        'ppmpf_5'              => '',
                        'pp_SecureHash'        => '',
                );

                $params['pp_SecureHash'] = $this->compute_secure_hash( $params );

                return $params;
        }

        /**
         * Build a description from the order.
         *
         * JazzCash pp_Description is capped at 60 chars.
         *
         * @param WC_Order $order Order.
         * @return string
         */
        protected function build_description( $order ) {
                $desc = sprintf(
                        /* translators: 1: order number */
                        __( 'Order #%1$s', 'jazzcash-woocommerce' ),
                        $order->get_order_number()
                );
                return substr( $desc, 0, 60 );
        }

        /**
         * Compute pp_SecureHash using SHA-256 over `salt&val1&val2&...`.
         *
         * Keys are sorted alphabetically, excluding pp_SecureHash itself.
         *
         * @param array  $params Params.
         * @param string $salt   Integrity salt (defaults to $this->integrity_salt).
         * @return string  Uppercase hex.
         */
        protected function compute_secure_hash( $params, $salt = null ) {
                $salt = null === $salt ? $this->integrity_salt : $salt;

                $keys = array_keys( $params );
                sort( $keys );
                $keys = array_diff( $keys, array( 'pp_SecureHash' ) );

                $values = array_map(
                        function ( $k ) use ( $params ) {
                                return isset( $params[ $k ] ) ? $params[ $k ] : '';
                        },
                        $keys
                );

                $string = $salt . '&' . implode( '&', $values );
                return strtoupper( hash( 'sha256', $string ) );
        }

        /**
         * Verify a callback's secure hash.
         *
         * @param array $params Response params.
         * @return bool
         */
        protected function verify_secure_hash( $params ) {
                if ( empty( $params['pp_SecureHash'] ) ) {
                        return false;
                }
                $received  = strtoupper( $params['pp_SecureHash'] );
                $computed  = $this->compute_secure_hash( $params );
                return hash_equals( $computed, $received );
        }

        /**
         * Get the JazzCash form action URL based on sandbox setting.
         *
         * @return string
         */
        protected function get_form_action() {
                if ( 'yes' === $this->sandbox ) {
                        return 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
                }
                return 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
        }

        /**
         * Handle the JazzCash callback (POST or GET to /wc-api/jazzcash_callback).
         *
         * Verifies the hash, updates the order, then redirects to the thank-you page.
         */
        public function handle_callback() {
                $params = ! empty( $_POST ) ? $_POST : $_GET; // phpcs:ignore WordPress.Security.NonceVerification
                $params = array_map( 'stripslashes', $params );

                if ( 'yes' === $this->get_option( 'debug' ) ) {
                        $this->log( 'Callback received: ' . wp_json_encode( $params ) );
                }

                $txn_ref_no = isset( $params['pp_TxnRefNo'] ) ? sanitize_text_field( $params['pp_TxnRefNo'] ) : '';
                $response_code = isset( $params['pp_ResponseCode'] ) ? sanitize_text_field( $params['pp_ResponseCode'] ) : '';

                if ( ! $txn_ref_no ) {
                        wp_die( esc_html__( 'Invalid callback: missing txn reference.', 'jazzcash-woocommerce' ), '', array( 'response' => 400 ) );
                }

                // Look up the order by stored txn ref.
                $orders = wc_get_orders(
                        array(
                                'limit'      => 1,
                                'meta_key'   => '_jazzcash_txn_ref_no',
                                'meta_value' => $txn_ref_no,
                        )
                );

                if ( empty( $orders ) ) {
                        wp_die( esc_html__( 'Order not found for this transaction reference.', 'jazzcash-woocommerce' ), '', array( 'response' => 404 ) );
                }

                /** @var WC_Order $order */
                $order = $orders[0];

                // Verify secure hash.
                if ( ! $this->verify_secure_hash( $params ) ) {
                        $order->update_status( 'failed', __( 'JazzCash callback hash mismatch — possible tampering.', 'jazzcash-woocommerce' ) );
                        $this->log( 'Hash mismatch for txn ' . $txn_ref_no );
                        wp_safe_redirect( $order->get_checkout_order_received_url() );
                        exit;
                }

                // Response code 000 = success.
                if ( '000' === $response_code ) {
                        $order->payment_complete( $txn_ref_no );
                        $order->add_order_note(
                                sprintf(
                                        /* translators: 1: txn ref, 2: response code */
                                        __( 'JazzCash payment approved. Txn ref: %1$s, response code: %2$s', 'jazzcash-woocommerce' ),
                                        $txn_ref_no,
                                        $response_code
                                )
                        );
                } else {
                        $message = isset( $params['pp_ResponseMessage'] ) ? sanitize_text_field( $params['pp_ResponseMessage'] ) : __( 'Payment failed', 'jazzcash-woocommerce' );
                        $order->update_status( 'failed', sprintf( __( 'JazzCash payment failed (code %1$s): %2$s', 'jazzcash-woocommerce' ), $response_code, $message ) );
                }

                // Store raw response for forensics.
                $order->update_meta_data( '_jazzcash_raw_response', wp_json_encode( $params ) );
                $order->save();

                wp_safe_redirect( $order->get_checkout_order_received_url() );
                exit;
        }

        /**
         * Write to the WC logger.
         *
         * @param string $message Message.
         */
        protected function log( $message ) {
                $logger = wc_get_logger();
                $logger->info( $message, array( 'source' => 'jazzcash' ) );
        }

        /**
         * Register block editor (Cart & Checkout blocks) support.
         */
        public function register_block_support() {
                if ( class_exists( '\Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
                        require_once JCWC_PLUGIN_DIR . 'includes/class-wc-gateway-jazzcash-blocks.php';
                        add_action(
                                'woocommerce_blocks_payment_method_type_registration',
                                function ( $registry ) {
                                        $registry->register( new WC_Gateway_JazzCash_Blocks() );
                                }
                        );
                }
        }
}
