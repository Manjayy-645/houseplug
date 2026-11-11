// Risky workflows remain off until migration, staffing and policy checks are complete.
export const featureFlags = {
  housingRequests: process.env.HOUSING_REQUESTS_ENABLED === "true",
  services: process.env.VETTED_SERVICES_ENABLED === "true",
  notifications: process.env.HOUSING_NOTIFICATIONS_ENABLED === "true",
  retention: process.env.HOUSING_RETENTION_ENABLED === "true",
} as const;
