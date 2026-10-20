/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Let devices on the local network (e.g. http://10.x.x.x:3000) use the dev server,
  // including hot reload. Dev-only; has no effect on `next build` / `next start`.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
};

export default config;
