import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { RouterProvider } from '@tanstack/react-router';
import { authClient } from './auth-client';
import { router } from './router';
import './style.css';

const url = import.meta.env.VITE_LOCAL_PROXY === 'true'
  ? `${window.location.origin}/convex-api` : import.meta.env.VITE_CONVEX_URL;
const root = createRoot(document.getElementById('root')!);
if (!url) {
  root.render(<main className="auth-page"><h1>Salient</h1><p>Connect a development backend to open your table.</p><p>Follow the local setup in README.md, then restart the web server.</p></main>);
} else {
  const client = new ConvexReactClient(url, { skipConvexDeploymentUrlCheck: true });
  root.render(<React.StrictMode><ConvexBetterAuthProvider client={client} authClient={authClient}><RouterProvider router={router} /></ConvexBetterAuthProvider></React.StrictMode>);
}
