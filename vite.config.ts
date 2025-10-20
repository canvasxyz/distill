import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(() => {
  const isVercel = Boolean(process.env.VERCEL);

  return {
    base: isVercel ? "/" : "/archive-explorer/",
    plugins: [react()],
  };
});
