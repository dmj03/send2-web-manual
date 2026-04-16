function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key] ?? undefined;
}

/** Validated environment variables — throws at startup if any required var is missing or malformed. */
export const env = {
  NEXT_PUBLIC_API_BASE_URL: requireEnv('NEXT_PUBLIC_API_BASE_URL'),
  NEXT_PUBLIC_SITE_URL: requireEnv('NEXT_PUBLIC_SITE_URL'),
  NEXT_PUBLIC_STRAPI_URL: requireEnv('NEXT_PUBLIC_STRAPI_URL'),
  NEXT_PUBLIC_FIREBASE_API_KEY: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  NEXT_PUBLIC_FIREBASE_APP_ID: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: optionalEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'),
  NEXT_PUBLIC_TAWK_PROPERTY_ID: optionalEnv('NEXT_PUBLIC_TAWK_PROPERTY_ID'),
  NEXT_PUBLIC_TAWK_WIDGET_ID: optionalEnv('NEXT_PUBLIC_TAWK_WIDGET_ID'),
  NEXTAUTH_URL: requireEnv('NEXTAUTH_URL'),
  NEXTAUTH_SECRET: requireEnv('NEXTAUTH_SECRET'),
  REVALIDATE_SECRET: requireEnv('REVALIDATE_SECRET'),
} as const;
