export function redirectByRole(role?: string) {
  const searchParams = new URLSearchParams(window.location.search)
  const returnTo = searchParams.get('returnTo')

  console.log("[AUTH_DEBUG] redirectByRole called with role:", role)
  console.log("[AUTH_DEBUG] Current window.location.href:", window.location.href)
  console.log("[AUTH_DEBUG] returnTo parameter found:", returnTo)

  if (returnTo) {
    console.log("[AUTH_DEBUG] Redirecting to returnTo:", returnTo)
    window.location.href = returnTo
    return
  }

  let target = '/browse'
  switch (role) {
    case 'super_admin':
    case 'admin':
      target = '/admin/listings'
      break
    case 'landlord':
    case 'agent':
      target = '/landlord/dashboard'
      break
    default:
      target = '/browse'
  }

  window.location.href = target
}
