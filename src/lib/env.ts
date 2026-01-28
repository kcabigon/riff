/**
 * Environment detection and configuration utilities
 * Provides helpers for determining current environment and environment-specific values
 */

export type Environment = "development" | "staging" | "production";

/**
 * Get the current environment
 * @returns The current environment (development, staging, or production)
 */
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV || "development";

  // Check if we're in Vercel preview deployment (staging)
  if (process.env.VERCEL_ENV === "preview") {
    return "staging";
  }

  // Check if we're in Vercel production deployment
  if (process.env.VERCEL_ENV === "production") {
    return "production";
  }

  // Default based on NODE_ENV
  if (env === "production") {
    return "production";
  }

  if (env === "staging") {
    return "staging";
  }

  return "development";
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

/**
 * Check if running in staging environment
 */
export function isStaging(): boolean {
  return getEnvironment() === "staging";
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

/**
 * Get the base URL for the current environment
 * @returns The base URL (without trailing slash)
 */
export function getBaseUrl(): string {
  // Vercel provides this automatically
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Use NEXTAUTH_URL if available
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Fallback for local development
  return "http://localhost:3000";
}

/**
 * Get environment display name for UI badges
 */
export function getEnvironmentLabel(): string {
  const env = getEnvironment();
  return env.toUpperCase();
}

/**
 * Get environment-specific configuration
 */
export function getConfig() {
  const env = getEnvironment();

  return {
    environment: env,
    isDevelopment: isDevelopment(),
    isStaging: isStaging(),
    isProduction: isProduction(),
    baseUrl: getBaseUrl(),
    apiUrl: `${getBaseUrl()}/api`,
    // Log level based on environment
    logLevel: env === "development" ? "debug" : env === "staging" ? "info" : "error",
    // Feature flags
    features: {
      showEnvironmentBadge: !isProduction(),
      enableDebugTools: isDevelopment(),
      enableAnalytics: isProduction(),
    },
  };
}
