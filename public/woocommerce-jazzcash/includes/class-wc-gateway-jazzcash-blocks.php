<?php
/**
 * JazzCash Cart & Checkout block integration.
 *
 * @package JazzCashWooCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
        exit;
}

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

/**
 * WC_Gateway_JazzCash_Blocks
 */
class WC_Gateway_JazzCash_Blocks extends AbstractPaymentMethodType {

        /**
         * Gateway instance.
         *
         * @var WC_Gateway_JazzCash
         */
        protected $gateway;

        /**
         * Payment method name/id.
         *
         * @var string
         */
        protected $name = 'jazzcash';

        /**
         * Initialize.
         */
        public function initialize() {
                $this->settings = get_option( 'woocommerce_jazzcash_settings', array() );
                $gateways       = WC()->payment_gateways->payment_gateways();
                $this->gateway  = isset( $gateways[ $this->name ] ) ? $gateways[ $this->name ] : null;
        }

        /**
         * Is the gateway active?
         *
         * @return boolean
         */
        public function is_active() {
                return $this->gateway && 'yes' === $this->gateway->get_option( 'enabled' );
        }

        /**
         * Script handles to enqueue.
         *
         * @return string[]
         */
        public function get_payment_method_script_handles() {
                wp_register_script(
                        'wc-jazzcash-blocks-integration',
                        JCWC_PLUGIN_URL . 'assets/js/blocks.js',
                        array( 'wc-blocks-registry', 'wc-settings', 'wp-element', 'wp-html-entities' ),
                        JCWC_VERSION,
                        true
                );
                return array( 'wc-jazzcash-blocks-integration' );
        }

        /**
         * Data passed to the JS handler.
         *
         * @return array
         */
        public function get_payment_method_data() {
                return array(
                        'title'       => $this->gateway ? $this->gateway->get_option( 'title' ) : 'JazzCash',
                        'description' => $this->gateway ? $this->gateway->get_option( 'description' ) : '',
                        'icon'        => JCWC_PLUGIN_URL . 'assets/images/jazzcash-logo.svg',
                        'supports'    => array( 'products' ),
                );
        }
}
