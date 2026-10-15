export const fmt = (n, decimals = 0) =>
  Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

export const fmtCurrency = (n) =>
  '$' + fmt(n ?? 0, 2)

export const fmtPct = (n) =>
  fmt(n ?? 0, 1) + '%'

export const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
]

export const CATEGORY_COLORS = {
  Technology:       '#3b82f6',
  Furniture:        '#10b981',
  'Office Supplies':'#f59e0b',
  Clothing:         '#8b5cf6',
  Electronics:      '#ec4899',
}

export const REGION_COLORS = {
  North:   '#3b82f6',
  South:   '#ef4444',
  East:    '#10b981',
  West:    '#f59e0b',
  Central: '#8b5cf6',
}

export const regionColor = (r) => REGION_COLORS[r] ?? '#3b82f6'
export const categoryColor = (c) => CATEGORY_COLORS[c] ?? '#3b82f6'
