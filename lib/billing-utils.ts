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

export function formatExpiryDate(expires_at: string | null): string {
  if (!expires_at) return "N/A"
  return new Date(expires_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
