import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // sockjs-client expects Node's `global` (browser only has globalThis)
    global: "globalThis",
  },
});
