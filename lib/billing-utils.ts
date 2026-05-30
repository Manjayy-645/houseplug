export function getListingLimit(plan: string): number {
  const limits: Record<string, number> = {
    free: 1,
    pro: 5,
    business: Infinity,
  }
  return limits[plan] ?? 1
}

export function isSubscriptionExpiringSoon(expires_at: string | null): boolean {
  if (!expires_at) return false
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  return new Date(expires_at) < threeDaysFromNow
}

export function daysUntilExpiry(expires_at: string | null): number {
  if (!expires_at) return 0
  const ms = new Date(expires_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export function formatExpiryDate(expires_at: string | null): string {
  if (!expires_at) return "N/A"
  return new Date(expires_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
