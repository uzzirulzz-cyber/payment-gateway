<?php
/**
 * Uninstall JazzCash for WooCommerce.
 *
 * Removes plugin settings when uninstalled (not deactivated).
 *
 * @package JazzCashWooCommerce
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'woocommerce_jazzcash_settings' );

// Clear any cached WC logs for this gateway.
foreach ( WC()->log() ? WC()->log()->get_files() : array() as $file ) {
	if ( false !== strpos( $file['source'] ?? '', 'jazzcash' ) ) {
		WC()->log()->clear( $file['source'] );
	}
}
