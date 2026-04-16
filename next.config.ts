import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://api.send2app.com https://cdn.send2app.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.send2app.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.send2app.com" },
      { protocol: "https", hostname: "cdn.send2app.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/providers/list",    destination: "/providers",       permanent: true },
      { source: "/providers/detail",  destination: "/providers",       permanent: true },
      { source: "/authentication/login",                    destination: "/login",           permanent: true },
      { source: "/authentication/registration",             destination: "/register",        permanent: true },
      { source: "/authentication/registration/otp",         destination: "/register/otp",   permanent: true },
      { source: "/authentication/resetpassword",            destination: "/forgot-password", permanent: true },
      { source: "/authentication/resetpassword/otp",        destination: "/forgot-password/otp", permanent: true },
      { source: "/authentication/resetpassword/changepassword", destination: "/change-password", permanent: true },
    ];
  },
};

export default nextConfig;
