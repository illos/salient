import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { RouterProvider } from '@tanstack/react-router';
import { authClient } from './auth-client';
import { router } from './router';
import { ToastProvider } from './toast';
import './style.css';

const url =
  import.meta.env.VITE_LOCAL_PROXY === 'true'
    ? `${window.location.origin}/convex-api`
    : import.meta.env.VITE_CONVEX_URL;
const root = createRoot(document.getElementById('root')!);
if (!url && !/^\/(?:rules|foes)(?:\/|$)/.test(window.location.pathname)) {
  root.render(
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-card p-16 text-center">
      <h1>Salient</h1>
      <p>Connect a development backend to open your table.</p>
      <p className="text-muted-foreground">
        Follow the local setup in README.md, then restart the web server.
      </p>
    </main>,
  );
} else {
  const client = new ConvexReactClient(url || 'http://127.0.0.1:3210', {
    skipConvexDeploymentUrlCheck: true,
  });
  root.render(
    <React.StrictMode>
      <ConvexBetterAuthProvider client={client} authClient={authClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ConvexBetterAuthProvider>
    </React.StrictMode>,
  );
}
