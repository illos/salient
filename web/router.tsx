import { useEffect, useState } from 'react';
import { createRootRoute, createRoute, createRouter, Link, Navigate, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { authClient } from './auth-client';
import { CampaignPage, CampaignsPage, JoinPage } from './campaigns';
import { CharacterPage, CharactersPage } from './characters';
import { ErrorNotice, Loading, errorMessage } from './ui';

function ConnectionStatus() {
  const convex = useConvex();
  const [online, setOnline] = useState(convex.connectionState().isWebSocketConnected);
  useEffect(() => convex.subscribeToConnectionState(state => setOnline(state.isWebSocketConnected)), [convex]);
  return <span className={online ? 'connection' : 'connection offline'} role="status">{online ? '● Connected' : '○ Reconnecting — changes may be pending'}</span>;
}

function ProfileGate() {
  const viewer = useQuery(api.auth.viewer);
  const ensure = useMutation(api.auth.ensureProfile);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (viewer === null) void ensure({}).catch(e => setError(errorMessage(e))); }, [viewer, ensure]);
  if (!viewer) return <main className="auth-page"><Loading>Opening your workspace…</Loading><ErrorNotice error={error} />{error && <button onClick={() => window.location.reload()}>Retry</button>}</main>;
  return <div className="app" key={viewer.userId}>
    <aside className="sidebar"><Link className="brand" to="/">S<span>Salient<small>DRAW STEEL COMPANION</small></span></Link>
      <p className="eyebrow">Your workspace</p><nav><Link to="/" activeOptions={{ exact: true }}>Campaigns</Link><Link to="/characters">Characters</Link></nav>
      <div className="sidebar-bottom"><span className="badge">v0.01 · pre-alpha</span><p>{viewer.displayName}</p><SignOut /></div>
    </aside>
    <div className="workspace"><header className="topbar"><span>A place for your next adventure</span><ConnectionStatus /></header><main className="content"><Outlet /></main></div>
  </div>;
}
function SignOut() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return <><button className="secondary" disabled={pending} onClick={async () => { setPending(true); setError(null); try { const result = await authClient.signOut(); if (result.error) throw new Error(result.error.message); await navigate({ to: '/login', search: { next: '/' }, replace: true }); } catch (e) { setError(errorMessage(e)); setPending(false); } }}>Sign out</button><ErrorNotice error={error} /></>;
}
function Shell() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const path = useRouterState({ select: state => state.location.pathname });
  if (path === '/login') return <Outlet />;
  if (path.startsWith('/join/') && !isAuthenticated) return <main className="auth-page"><Outlet /></main>;
  if (isLoading) return <main className="auth-page"><Loading>Checking your session…</Loading></main>;
  if (!isAuthenticated) return <Navigate to="/login" search={{ next: path }} replace />;
  return <ProfileGate />;
}
function Login() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { next } = loginRoute.useSearch();
  const [register, setRegister] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (isAuthenticated) return <Navigate to={next as '/'} replace />;
  return <main className="auth-page"><div className="auth-intro"><span className="eyebrow">DRAW STEEL · YOUR TABLE, TOGETHER</span><h1>Every great story<br />starts at the table.</h1><p>Bring your campaign, your characters and your next session together.</p><span className="badge">Salient · desktop pre-alpha</span></div><section className="panel auth-card"><h2>{register ? 'Create your account' : 'Welcome back'}</h2><p className="muted">{register ? 'A new seat at the table.' : 'Sign in to your campaigns.'}</p>
    <form className="stack" onSubmit={async event => {
      event.preventDefault(); if (pending) return; setPending(true); setError(null);
      const data = new FormData(event.currentTarget);
      try {
        const credentials = { email: String(data.get('email')), password: String(data.get('password')) };
        const result = register ? await authClient.signUp.email({ ...credentials, name: String(data.get('name')).trim() }) : await authClient.signIn.email(credentials);
        if (result.error) throw new Error(result.error.message || 'Unable to sign in. Please try again.');
      } catch (e) { setError(errorMessage(e)); } finally { setPending(false); }
    }}>
      {register && <label className="field">Display name<input name="name" autoComplete="nickname" required maxLength={80} /></label>}
      <label className="field">Email<input type="email" name="email" autoComplete="email" required /></label>
      <label className="field">Password<input type="password" name="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required /></label>
      <ErrorNotice error={error} /><button disabled={pending || isLoading}>{pending ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
    </form><button className="text-button" disabled={pending} onClick={() => { setRegister(!register); setError(null); }}>{register ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>
  </section></main>;
}

const rootRoute = createRootRoute({ component: Shell, notFoundComponent: () => <section className="panel"><h1>Page not found</h1><Link to="/">Back to campaigns</Link></section> });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', validateSearch: (search: Record<string, unknown>) => ({ next: typeof search.next === 'string' && /^\/(?!\/)/.test(search.next) && !search.next.startsWith('/login') ? search.next : '/' }), component: Login });
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: CampaignsPage });
const campaignRoute = createRoute({ getParentRoute: () => rootRoute, path: '/campaigns/$campaignId', component: () => <CampaignPage campaignId={campaignRoute.useParams().campaignId as Id<'campaigns'>} /> });
const joinRoute = createRoute({ getParentRoute: () => rootRoute, path: '/join/$shareCode', component: () => <JoinPage shareCode={joinRoute.useParams().shareCode} /> });
const charactersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters', component: CharactersPage });
const characterRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters/$characterId', component: () => <CharacterPage characterId={characterRoute.useParams().characterId as Id<'characters'>} /> });
export const router = createRouter({ routeTree: rootRoute.addChildren([loginRoute, homeRoute, campaignRoute, joinRoute, charactersRoute, characterRoute]), defaultErrorComponent: ({ error, reset }) => <section className="panel"><h1>This page is unavailable</h1><ErrorNotice error={errorMessage(error)} /><button onClick={reset}>Retry</button> <a href="/">Back to campaigns</a></section> });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
