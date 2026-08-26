export const DEFAULT_SHIPPING_RATES = {
  localCityFee: 2500, // e.g. ₦2,500 within Lagos
  interstateFee: 5000, // e.g. ₦5,000 outside Lagos
  freeShippingAbove: 100000, // e.g. Free shipping on orders > ₦100,000
};

export function calculateShippingFee(
  customerState,
  subtotal,
  merchantState = 'Lagos',
  rates = DEFAULT_SHIPPING_RATES
) {
  if (subtotal >= rates.freeShippingAbove) return 0;
  if (!customerState) return rates.localCityFee;
  const isLocal = customerState.toLowerCase().trim() === merchantState.toLowerCase().trim();
  return isLocal ? rates.localCityFee : rates.interstateFee;
}
