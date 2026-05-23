export function redirectByRole(role?: string) {
  switch (role) {
    case 'super_admin':
    case 'admin':
      window.location.href = '/admin/listings'
      break
    case 'landlord':
      window.location.href = '/landlord/dashboard'
      break
    default:
      window.location.href = '/browse'
  }
}
