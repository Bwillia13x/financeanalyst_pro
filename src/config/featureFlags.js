// Centralized feature flags for Valor-IVX / FinanceAnalyst Pro
// Use Vite env vars; provide sensible defaults for production safety

export const featureFlags = {
  // Hide demo/showcase routes in production by default
  ENABLE_DEMOS: import.meta.env.VITE_ENABLE_DEMOS === 'true',

  // Collapse secondary nav into a single drawer on mobile
  MOBILE_SECONDARY_NAV_DRAWER:
    import.meta.env.VITE_MOBILE_SECONDARY_NAV_DRAWER === 'true',

  // Enable additional verbose logging in development only
  VERBOSE_LOGGING: import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGGING !== 'false',

  // Admin login visibility (for environments without SSO)
  ENABLE_ADMIN_LOGIN:
    import.meta.env.VITE_ENABLE_ADMIN_LOGIN === 'true' || import.meta.env.DEV,
};

export default featureFlags;
