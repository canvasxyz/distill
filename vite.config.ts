import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(() => {
  const isVercel = Boolean(process.env.VERCEL);
  const isCloudflarePages = Boolean(process.env.CF_PAGES);

  return {
    base: isVercel || isCloudflarePages ? "/" : "/archive-explorer/",
    plugins: [react()],
  };
});
