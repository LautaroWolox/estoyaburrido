export function formatMoney(value: number, currency = 'ARS', hidden = false) {
  if (hidden) return '••••••'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0)
}
