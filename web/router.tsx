import { foesSearch } from './foes/filters';
// SPDX-License-Identifier: GPL-3.0-only
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Navigate,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { authClient } from './auth-client';
const ForgotPassword = lazy(() =>
  import('./password-recovery').then(module => ({ default: module.ForgotPassword })),
);
const ResetPassword = lazy(() =>
  import('./password-recovery').then(module => ({ default: module.ResetPassword })),
);
const CampaignPage = lazy(() =>
  import('./campaigns').then(module => ({ default: module.CampaignPage })),
);
const CampaignsPage = lazy(() =>
  import('./campaigns').then(module => ({ default: module.CampaignsPage })),
);
const JoinPage = lazy(() => import('./campaigns').then(module => ({ default: module.JoinPage })));
const CharacterPage = lazy(() =>
  import('./characters').then(module => ({ default: module.CharacterPage })),
);
const CharactersPage = lazy(() =>
  import('./characters').then(module => ({ default: module.CharactersPage })),
);
const WizardPage = lazy(() => import('./wizard').then(module => ({ default: module.WizardPage })));
const ProgressionPage = lazy(() =>
  import('./progression').then(module => ({ default: module.ProgressionPage })),
);
const TablePage = lazy(() => import('./table').then(module => ({ default: module.TablePage })));
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { SignOut, ThemeSwitch } from './components/session-user';
import { ErrorNotice, Eyebrow, Field, Loading, errorMessage } from './ui';

const RulesPage = lazy(() => import('./rules').then(module => ({ default: module.RulesPage })));

const FoesPage = lazy(() => import('./foes/index'));

function ConnectionStatus() {
  const convex = useConvex();
  const [online, setOnline] = useState(convex.connectionState().isWebSocketConnected);
  useEffect(
    () => convex.subscribeToConnectionState(state => setOnline(state.isWebSocketConnected)),
    [convex],
  );
  return (
    <span
      className={online ? 'caps text-success' : 'caps text-warning'}
      role="status"
      aria-live="polite"
    >
      {online ? '● Connected' : '○ Reconnecting — changes may be pending'}
    </span>
  );
}

export { ThemeSwitch };

function Wordmark() {
  return (
    <Link to="/" className="text-2xl font-bold tracking-tight hover:no-underline">
      Salient
    </Link>
  );
}

function TopNav({ displayName }: { displayName?: string }) {
  const navItem =
    'caps flex h-14 items-center border-b-2 border-transparent px-1 text-muted-foreground transition-colors duration-(--motion-fast) hover:text-foreground hover:no-underline data-[status=active]:border-primary data-[status=active]:text-foreground';
  return (
    <header className="site-nav rule-strong sticky top-0 z-40 bg-background">
      <div className="site-nav-inner mx-auto flex max-w-[1460px] items-center gap-6 px-9">
        <Wordmark />
        <span aria-hidden className="h-6 w-px bg-rule-strong" />
        <nav aria-label="Primary" className="flex items-center gap-5">
          <Link to="/" activeOptions={{ exact: true }} className={navItem}>
            Campaigns
          </Link>
          <Link to="/characters" className={navItem}>
            Characters
          </Link>
          <Link to="/rules" search={{}} className={navItem}>
            Rules
          </Link>
          <Link to="/foes" search={{}} className={navItem}>
            Foes
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {displayName && <ConnectionStatus />}
          <ThemeSwitch />
          {displayName ? (
            <>
              <span className="site-user-name text-sm">{displayName}</span>
              <SignOut />
            </>
          ) : (
            <Link to="/login" search={{ next: '/' }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/** `/campaigns/:id/table` renders the session shell (web/table/shell.tsx) instead of the site nav. */
export function isTableRoute(path: string): boolean {
  return /^\/campaigns\/[^/]+\/table\/?$/.test(path);
}

/** `/characters/:id/wizard` renders the wizard header (web/wizard/header.tsx) instead of the site nav. */
export function isWizardRoute(path: string): boolean {
  return /^\/characters\/[^/]+\/wizard\/?$/.test(path);
}

class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="p-8" role="alert">
        This page could not load.{' '}
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function PageOutlet() {
  const path = useRouterState({ select: state => state.location.pathname });
  return (
    <PageBoundary key={path}>
      <Suspense fallback={<Loading>Opening page…</Loading>}>
        <Outlet />
      </Suspense>
    </PageBoundary>
  );
}

function ReferenceShell() {
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = shell.current!;
    const header = container.querySelector('header')!;
    const observer = new ResizeObserver(() =>
      container.style.setProperty(
        '--reference-nav-height',
        `${header.getBoundingClientRect().height}px`,
      ),
    );
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.auth.viewer, isAuthenticated ? {} : 'skip');
  return (
    <div className="reference-shell" ref={shell}>
      <TopNav displayName={viewer?.displayName} />
      <PageOutlet />
    </div>
  );
}

function ProfileGate({ path }: { path: string }) {
  const viewer = useQuery(api.auth.viewer);
  const ensure = useMutation(api.auth.ensureProfile);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (viewer === null) void ensure({}).catch(e => setError(errorMessage(e)));
  }, [viewer, ensure]);
  if (!viewer)
    return (
      <CenteredPage>
        <Loading>Opening your workspace…</Loading>
        <ErrorNotice error={error} />
        {error && <Button onClick={() => window.location.reload()}>Retry</Button>}
      </CenteredPage>
    );
  // V21: the table and the wizard are full-viewport frames with their own headers; no site nav.
  if (isTableRoute(path) || isWizardRoute(path)) return <PageOutlet key={viewer.userId} />;
  return (
    <div className="flex min-h-screen flex-col" key={viewer.userId}>
      <TopNav displayName={viewer.displayName} />
      <main className="mx-auto w-full max-w-[1460px] flex-1 px-9 pt-8 pb-16">
        <PageOutlet />
      </main>
      <footer className="mx-auto w-full max-w-[1460px] px-9 pb-6">
        <span className="eyebrow">v0.01 · pre-alpha</span>
      </footer>
    </div>
  );
}

/** Full-height centred page used outside the signed-in shell. */
function CenteredPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-card p-16">
      {children}
    </main>
  );
}

function Shell() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const path = useRouterState({ select: state => state.location.pathname });
  if (path === '/foes') return <ReferenceShell />;
  if (path === '/rules' || path.startsWith('/rules/')) return <ReferenceShell />;
  if (['/login', '/forgot-password', '/reset-password'].includes(path)) return <PageOutlet />;
  if (path.startsWith('/join/') && !isAuthenticated)
    return (
      <CenteredPage>
        <PageOutlet />
      </CenteredPage>
    );
  if (isLoading)
    return (
      <CenteredPage>
        <Loading>Checking your session…</Loading>
      </CenteredPage>
    );
  if (!isAuthenticated) return <Navigate to="/login" search={{ next: path }} replace />;
  return <ProfileGate path={path} />;
}
function Login() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { next } = loginRoute.useSearch();
  const recoveryAvailable = useQuery(api.auth.recoveryAvailable);
  const [register, setRegister] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (isAuthenticated) return <Navigate to={next as '/'} replace />;
  return (
    <main className="grid min-h-screen grid-cols-2">
      <section className="flex flex-col justify-between border-r border-rule-strong bg-card p-12">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold tracking-tight">Salient</span>
          <ThemeSwitch />
        </div>
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold tracking-tighter">
            Every great story
            <br />
            starts at the table.
          </h1>
          <p className="mt-6 max-w-sm text-lg text-muted-foreground">
            Bring your campaign, your characters and your next session together.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="eyebrow mb-0">Pre-alpha</span>
          <span className="eyebrow mb-0">Desktop first</span>
        </div>
      </section>
      <section className="flex items-center justify-center bg-background p-12">
        <div className="w-full max-w-md">
          <Eyebrow>{register ? 'A new seat at the table' : 'Return to your tables'}</Eyebrow>
          <h2 className="rule-strong pb-3 text-2xl">
            {register ? 'Create your account' : 'Welcome back'}
          </h2>
          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={async event => {
              event.preventDefault();
              if (pending) return;
              setPending(true);
              setError(null);
              const data = new FormData(event.currentTarget);
              try {
                const credentials = {
                  email: String(data.get('email')),
                  password: String(data.get('password')),
                };
                const result = register
                  ? await authClient.signUp.email({
                      ...credentials,
                      name: String(data.get('name')).trim(),
                    })
                  : await authClient.signIn.email(credentials);
                if (result.error)
                  throw new Error(result.error.message || 'Unable to sign in. Please try again.');
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setPending(false);
              }
            }}
          >
            {register && (
              <Field label="Display name">
                <Input name="name" autoComplete="nickname" required maxLength={80} />
              </Field>
            )}
            <Field label="Email">
              <Input type="email" name="email" autoComplete="email" required />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                name="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                minLength={8}
                maxLength={128}
                required
              />
            </Field>
            <ErrorNotice error={error} />
            <Button type="submit" size="lg" className="w-full" disabled={pending || isLoading}>
              {pending ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={pending}
              onClick={() => {
                setRegister(!register);
                setError(null);
              }}
            >
              {register ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Button>
            {!register && recoveryAvailable && <Link to="/forgot-password">Forgot password?</Link>}
          </form>
        </div>
      </section>
    </main>
  );
}

function ProblemCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mx-auto mt-10 max-w-xl">
      <CardContent className="flex flex-col gap-3">
        <h1>{title}</h1>
        {children}
      </CardContent>
    </Card>
  );
}

const rootRoute = createRootRoute({
  component: Shell,
  notFoundComponent: () => (
    <ProblemCard title="Page not found">
      <Link to="/">Back to campaigns</Link>
    </ProblemCard>
  ),
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({
    next:
      typeof search.next === 'string' &&
      /^\/(?!\/)/.test(search.next) &&
      !search.next.startsWith('/login')
        ? search.next
        : '/',
  }),
  component: Login,
});
const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPassword,
});
const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    invalid: typeof search.error === 'string',
  }),
  component: () => <ResetPassword {...resetPasswordRoute.useSearch()} />,
});
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CampaignsPage,
});
const campaignRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/campaigns/$campaignId',
  component: () => (
    <CampaignPage campaignId={campaignRoute.useParams().campaignId as Id<'campaigns'>} />
  ),
});
const tableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/campaigns/$campaignId/table',
  component: () => <TablePage campaignId={tableRoute.useParams().campaignId as Id<'campaigns'>} />,
});
const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/join/$shareCode',
  component: () => <JoinPage shareCode={joinRoute.useParams().shareCode} />,
});
const charactersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/characters',
  component: CharactersPage,
});
const characterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/characters/$characterId',
  component: () => (
    <CharacterPage characterId={characterRoute.useParams().characterId as Id<'characters'>} />
  ),
});
const wizardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/characters/$characterId/wizard',
  component: () => {
    const { characterId } = wizardRoute.useParams();
    return (
      <WizardPage
        characterId={characterId === 'new' ? undefined : (characterId as Id<'characters'>)}
      />
    );
  },
});
const progressionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/characters/$characterId/progression',
  component: () => (
    <ProgressionPage characterId={progressionRoute.useParams().characterId as Id<'characters'>} />
  ),
});
function rulesSearch(search: Record<string, unknown>): {
  q?: string;
  book?: string;
  category?: string;
} {
  return {
    q: typeof search.q === 'string' ? search.q.slice(0, 200) : undefined,
    book: typeof search.book === 'string' ? search.book : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
  };
}
const foesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/foes',
  validateSearch: foesSearch,
  component: () => (
    <Suspense fallback={<Loading>Opening foes…</Loading>}>
      <FoesPage filters={foesRoute.useSearch()} />
    </Suspense>
  ),
});
const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rules',
  validateSearch: rulesSearch,
  component: () => (
    <Suspense fallback={<Loading>Opening the compendium…</Loading>}>
      <RulesPage filters={rulesRoute.useSearch()} />
    </Suspense>
  ),
});
const rulesArticleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rules/$',
  validateSearch: rulesSearch,
  component: () => (
    <Suspense fallback={<Loading>Opening the compendium…</Loading>}>
      <RulesPage
        path={rulesArticleRoute.useParams()._splat}
        filters={rulesArticleRoute.useSearch()}
      />
    </Suspense>
  ),
});
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    loginRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    homeRoute,
    campaignRoute,
    tableRoute,
    joinRoute,
    charactersRoute,
    characterRoute,
    wizardRoute,
    progressionRoute,
    foesRoute,
    rulesRoute,
    rulesArticleRoute,
  ]),
  defaultErrorComponent: ({ error, reset }) => (
    <ProblemCard title="This page is unavailable">
      <ErrorNotice error={errorMessage(error)} />
      <div className="flex items-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <a href="/">Back to campaigns</a>
      </div>
    </ProblemCard>
  ),
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
