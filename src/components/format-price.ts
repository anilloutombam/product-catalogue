const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatPrice(priceCents: number) {
  return usdFormatter.format(priceCents / 100);
}
