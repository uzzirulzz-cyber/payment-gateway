<?php
/**
 * Plugin Name:       JazzCash for WooCommerce
 * Plugin URI:        https://github.com/uzzirulzz-cyber/payment-gateway
 * Description:       Accept JazzCash payments (Mobile Wallet, Bank Account, Debit/Credit Card) in your WooCommerce store. Branded and maintained by PlayBeat Digital.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            PlayBeat Digital
 * Author URI:        https://playbeat.digital
 * License:           MIT
 * License URI:       https://opensource.org/licenses/MIT
 * Text Domain:       jazzcash-woocommerce
 * Domain Path:       /languages
 *
 * @package JazzCashWooCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'JCWC_VERSION', '1.0.0' );
define( 'JCWC_PLUGIN_FILE', __FILE__ );
define( 'JCWC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JCWC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * WooCommerce fallback notice.
 */
function jcwc_missing_woocommerce_notice() {
	echo '<div class="error"><p><strong>' .
		esc_html__( 'JazzCash for WooCommerce requires WooCommerce to be installed and active.', 'jazzcash-woocommerce' ) .
		'</strong></p></div>';
}

/**
 * Init plugin.
 */
function jcwc_init() {
	// Bail if WooCommerce is not active.
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', 'jcwc_missing_woocommerce_notice' );
		return;
	}

	// Load gateway class.
	require_once JCWC_PLUGIN_DIR . 'includes/class-wc-gateway-jazzcash.php';

	// Register the gateway so it appears in WC > Settings > Payments.
	add_filter( 'woocommerce_payment_gateways', 'jcwc_register_gateway' );
}
add_action( 'plugins_loaded', 'jcwc_init' );

/**
 * Register the JazzCash gateway.
 *
 * @param array $gateways Existing gateways.
 * @return array
 */
function jcwc_register_gateway( $gateways ) {
	$gateways[] = 'WC_Gateway_JazzCash';
	return $gateways;
}

/**
 * Add settings link on the Plugins page.
 *
 * @param array $links Existing links.
 * @return array
 */
function jcwc_plugin_action_links( $links ) {
	$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=wc-settings&tab=checkout&section=jazzcash' ) ) . '">'
		. esc_html__( 'Settings', 'jazzcash-woocommerce' ) . '</a>';
	array_unshift( $links, $settings_link );
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( JCWC_PLUGIN_FILE ), 'jcwc_plugin_action_links' );
