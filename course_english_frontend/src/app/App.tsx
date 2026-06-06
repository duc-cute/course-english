import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./providers";
import { appRouter } from "./routes";

export default function App() {
  return (
    <AppProviders>
      <Suspense fallback={<div className="route-placeholder">Loading…</div>}>
        <RouterProvider router={appRouter} />
      </Suspense>
    </AppProviders>
  );
}
