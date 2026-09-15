// SPDX-License-Identifier: GPL-3.0-only
import { lazy, Suspense, useEffect, useState } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Navigate,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { authClient } from './auth-client';
import { CampaignPage, CampaignsPage, JoinPage } from './campaigns';
import { CharacterPage, CharactersPage } from './characters';
import { WizardPage } from './wizard';
import { TablePage } from './table';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { THEMES, useTheme, type Theme } from './theme';
import { ErrorNotice, Eyebrow, Field, Loading, errorMessage } from './ui';

const RulesPage = lazy(() => import('./rules').then(module => ({ default: module.RulesPage })));

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

const THEME_LABELS: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };

/** Light / dark / system appearance switch; the preference is stored locally (see web/theme.ts). */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <ToggleGroup
      aria-label="Appearance"
      value={[theme]}
      onValueChange={value => {
        const next = value[0];
        if (typeof next === 'string' && THEMES.includes(next as Theme)) setTheme(next as Theme);
      }}
      spacing={0}
      className="rounded-md border border-rule-strong"
    >
      {THEMES.map(option => (
        <ToggleGroupItem
          key={option}
          value={option}
          aria-label={THEME_LABELS[option]}
          className="caps h-7 rounded-none px-2.5 text-muted-foreground hover:text-foreground data-pressed:bg-secondary data-pressed:text-secondary-foreground"
        >
          {THEME_LABELS[option]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function Wordmark() {
  return (
    <Link to="/" className="text-2xl font-bold tracking-tight hover:no-underline">
      Salient
    </Link>
  );
}

function TopNav({ displayName }: { displayName: string }) {
  const navItem =
    'caps flex h-14 items-center border-b-2 border-transparent px-1 text-muted-foreground transition-colors duration-(--motion-fast) hover:text-foreground hover:no-underline data-[status=active]:border-primary data-[status=active]:text-foreground';
  return (
    <header className="rule-strong sticky top-0 z-40 bg-background">
      <div className="mx-auto flex max-w-[1460px] items-center gap-6 px-9">
        <Wordmark />
        <span aria-hidden className="h-6 w-px bg-rule-strong" />
        <nav aria-label="Primary" className="flex items-center gap-5">
          <Link to="/" activeOptions={{ exact: true }} className={navItem}>
            Campaigns
          </Link>
          <Link to="/characters" className={navItem}>
            Characters
          </Link>
          <Link to="/rules" className={navItem}>
            Rules
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <ConnectionStatus />
          <ThemeSwitch />
          <span className="text-sm">{displayName}</span>
          <SignOut />
        </div>
      </div>
    </header>
  );
}

function ProfileGate() {
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
  return (
    <div className="flex min-h-screen flex-col" key={viewer.userId}>
      <TopNav displayName={viewer.displayName} />
      <main className="mx-auto w-full max-w-[1460px] flex-1 px-9 pt-8 pb-16">
        <Outlet />
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

function SignOut() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const result = await authClient.signOut();
            if (result.error) throw new Error(result.error.message);
            await navigate({ to: '/login', search: { next: '/' }, replace: true });
          } catch (e) {
            setError(errorMessage(e));
            setPending(false);
          }
        }}
      >
        Sign out
      </Button>
      <ErrorNotice error={error} />
    </>
  );
}
function Shell() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const path = useRouterState({ select: state => state.location.pathname });
  if (path === '/rules' || path.startsWith('/rules/')) return <Outlet />;
  if (path === '/login') return <Outlet />;
  if (path.startsWith('/join/') && !isAuthenticated)
    return (
      <CenteredPage>
        <Outlet />
      </CenteredPage>
    );
  if (isLoading)
    return (
      <CenteredPage>
        <Loading>Checking your session…</Loading>
      </CenteredPage>
    );
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
  component: () => (
    <WizardPage characterId={wizardRoute.useParams().characterId as Id<'characters'>} />
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
    homeRoute,
    campaignRoute,
    tableRoute,
    joinRoute,
    charactersRoute,
    characterRoute,
    wizardRoute,
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
