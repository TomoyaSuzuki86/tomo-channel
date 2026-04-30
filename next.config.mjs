import { createNextConfig } from "./next.config.shared.mjs";

const appHostingMode =
  process.env.APP_HOSTING === "true" || process.env.FIREBASE_APP_HOSTING === "true";

export default createNextConfig({ appHosting: appHostingMode });
