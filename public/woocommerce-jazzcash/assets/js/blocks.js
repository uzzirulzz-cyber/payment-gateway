/* JazzCash Cart & Checkout block integration */
const settings = window.wc.wcSettings.getSetting( 'jazzcash_data', {
	title: 'JazzCash',
	description: '',
	icon: '',
} );

const label = window.wp.htmlEntities.decodeHTML( settings.title );
const content = window.wp.htmlEntities.decodeHTML( settings.description );

export const JazzCashLabel = ( props ) => {
	const { PaymentMethodLabel } = props.components;
	return <PaymentMethodLabel text={ label } />;
};

export const JazzCashContent = () => {
	return window.wp.element.createElement(
		'div',
		{ className: 'jazzcash-block-description' },
		content
	);
};

const JazzCash = {
	name: 'jazzcash',
	label: <JazzCashLabel />,
	content: <JazzCashContent />,
	edit: <JazzCashContent />,
	canMakePayment: () => true,
	ariaLabel: label,
	supports: { features: settings.supports || [ 'products' ] },
};

window.wc.wcSettings.registerPaymentMethod( JazzCash );
