```md
# OpenFav Discovery System – Recap Completo

Questo documento riassume l'architettura attuale e quella "vNext" del Discovery System:

- Tipi principali (`PageMeta`, `Page`, `PagePolicy`, ecc.)
- Configurazione (registry, policies, helper)
- `DiscoveryService`
- API `/api/v1/pages/discovery`
- Pagine fisiche e pagine virtuali (`template/HelloApi`)

> Nota: helper e pagine di test sono già allineati e funzionano bene; qui ci concentriamo sulla "spina dorsale" del sistema.

---

## 1. Tipi di dominio

### 1.1. Tipi atomici (contenuto UI)

Definiti in `src/types/pages.ts` (o re-esportati dal nuovo file unificato):

```ts
export interface PageFeature {
  title: string;
  description: string;
  iconName: string;
  enabled?: boolean;
}

export interface PageSection {
  title: string;
  content: string | React.ReactNode;
  align?: 'left' | 'center' | 'right';
  enabled?: boolean;
}

export interface PageCta {
  text: string;
  icon?: string;
  redirectUrl?: string;
  loadingText?: string;
  successText?: string;
  onClick?: () => void;
  enabled?: boolean;
}

export interface PageFooter {
  text: string;
  githubUrl?: string;
  enabled?: boolean;
}
```

Questi rappresentano il contenuto renderizzabile (features, sezioni, CTA, footer).

### 1.2. `PagePolicy` – Policy di alto livello

```ts
export interface PagePolicy {
  visibility: {
    inNavbar: boolean;
    inLists: boolean;
    inSearch: boolean;
    inExplorer?: boolean;
  };

  access: {
    isActive: boolean;
    isPublic: boolean;
    requiresAuth: boolean;
    allowDirectAccess: boolean;
  };

  interaction: {
    isEnabled: boolean;
    allowClick: boolean;
  };

  rendering: {
    showFooter: boolean;
    showHeader: boolean;
    showThemeToggle: boolean;
  };
}
```

Serve a definire il "comportamento" di una pagina:

- se è visibile in navbar, liste, search  
- se è pubblica/protetta  
- se è cliccabile/attiva  
- quali parti di layout mostra (header/footer/theme toggle)

### 1.3. `PageMeta` – Config "sorgente" di una pagina

`PageMeta` è il tipo che usi nel registry: è una descrizione di configurazione, non ancora una pagina completa.

```ts
export interface PageMeta {
  // Meta base
  title?: string;
  description?: string;
  icon?: string;

  // Access / visibility
  isPublic?: boolean;
  protected?: boolean;
  disabled?: boolean; // @deprecated → !isEnabled
  showInNavbar?: boolean; // @deprecated → policy.visibility.inNavbar
  showInMenu?: boolean;

  order?: number;
  subtitle?: string;

  // Contenuto
  features?: PageFeature[];
  sections?: PageSection[];
  cta?: PageCta;
  footer?: PageFooter;
  showFooter?: boolean;
  props?: Record<string, any>;

  // Policy system
  policy?: Partial<PagePolicy>; // override strutturato
  policyName?: string; // chiave in PREDEFINED_POLICIES

  // Status flags (facoltativi a livello di meta: possono venire dalla policy)
  isActive?: boolean;
  isVisible?: boolean;
  isEnabled?: boolean;
}
```

`PageMeta` è quello che:

- scrivi nel registry (a mano o con `createPageMeta`),
- viene trasformato in `Page` dal builder/`DiscoveryService`.

### 1.4. `Page` – Oggetto pagina "risolta"

`Page` è il tipo usato:

- internamente da `DiscoveryService`,
- nell'API di discovery,
- dal `SystemClient` sul frontend.

```ts
export type PageRole = 'page' | 'component';

export interface Page {
  id: string;
  url: string | null;
  path: string;
  category: string;
  type: 'astro' | 'react';
  role: PageRole;

  title: string;
  description?: string;
  icon?: string;

  // STATUS FLAGS (refactor v0.4.x)
  isActive: boolean; // logica attiva (props, rendering, ecc.)
  isVisible: boolean; // appare in liste (navbar, discovery, ecc.)
  isEnabled: boolean; // interattiva (link cliccabile)

  // Legacy
  /** @deprecated Use !isEnabled */
  disabled?: boolean;
  /** @deprecated Use isVisible / policy.visibility */
  showInNavbar?: boolean;

  isPublic: boolean;
  protected: boolean;
  showInMenu: boolean;
  order: number;

  // Contenuto
  subtitle?: string;
  features?: PageFeature[];
  sections?: PageSection[];
  cta?: PageCta;
  footer?: PageFooter;
  showFooter?: boolean;
  props?: Record<string, any>;

  // Policy reference
  policy?: Partial<PagePolicy>;
  policyName?: string;
}
```

#### Differenza chiave:

- `PageMeta` → cosa vuoi per quella pagina (config sorgente)
- `Page` → cosa il sistema decide (dopo merge policy, flags, path, ecc.)

### 1.5. `NavigationItem` e `SystemResponse`

```ts
export interface NavigationItem {
  name: string;
  path: string;
  icon?: string;
  description?: string;
  children?: NavigationItem[];
  enabled?: boolean;
}

export interface SystemResponse {
  meta: {
    timestamp: string;
    version: string;
    environment: 'development' | 'production';
  };
  pages: Page[];
  navigation: NavigationItem[];
  config: {
    theme: string;
    protected: string[]; // URL protette
    disabled: string[];  // URL disabilitate
  };
}
```

`SystemResponse` è il payload dell'endpoint `/api/v1/pages/discovery`.

---

## 2. Configurazione: Policies, Defaults, Registry, Helper

### 2.1. Page Policies

File: `src/config/page-policies.ts`

```ts
import type { PagePolicy, PageMeta } from '@/types/pages';

export const DEFAULT_PAGE_POLICY: PagePolicy = {
  visibility: { inNavbar: false, inLists: true, inSearch: true, inExplorer: true },
  access: { isActive: true, isPublic: true, requiresAuth: false, allowDirectAccess: true },
  interaction: { isEnabled: true, allowClick: true },
  rendering: { showFooter: true, showHeader: true, showThemeToggle: true }
};

export const PREDEFINED_POLICIES = {
  PUBLIC_PAGE: { /* ... */ } satisfies PagePolicy,
  ADMIN_ONLY: { /* ... */ } satisfies PagePolicy,
  HIDDEN_BUT_ACCESSIBLE: { /* ... */ } satisfies PagePolicy,
  PAGE_DISABLED: { /* ... */ } satisfies PagePolicy,
  PAGE_INACTIVE: { /* ... */ } satisfies PagePolicy,
  MAINTENANCE: { /* ... */ } satisfies PagePolicy,
  LANDING_PAGE: { /* ... */ } satisfies PagePolicy,
  COMPONENT_ONLY: { /* ... */ } satisfies PagePolicy
} as const;

// Default "flag-level" generici per nuove pagine
export const DEFAULT_PAGE_CONFIG: PageMeta = {
  isPublic: true,
  protected: false,
  isActive: true,
  isVisible: false,
  isEnabled: true,
  showInMenu: false,
  showInNavbar: false,
  showFooter: true,
  order: 999
};
```

Queste policy vengono usate:

- a livello di `PageMeta` (via `policyName` e `policy`),
- dal builder/`DiscoveryService` per risolvere `Page`.

### 2.2. Registry – `PAGES_REGISTRY`

Struttura consigliata:

```
src/config/discovery/
├── policies.ts       # DEFAULT_PAGE_POLICY + PREDEFINED_POLICIES
├── defaults.ts       # DEFAULT_PAGE_CONFIG + builder/resolvePolicy
├── registry/
│   ├── core.ts
│   ├── auth.ts
│   ├── lifecycle.ts
│   ├── components.ts
│   └── landing.ts
└── index.ts         # merge di tutti
```

Esempio `core.ts`:

```ts
// src/config/discovery/registry/core.ts
import type { PageMeta } from '@/types/pages';
import { createPageMeta } from '@/scripts/helpers/createPageMeta';

export const CORE_PAGES: Record<string, PageMeta> = {
  'pages/discovery-test': {
    title: 'Discovery Control Center',
    subtitle: "Gestione dinamica dell'ecosistema OpenFav",
    icon: 'LayoutDashboard',
    policyName: 'PUBLIC_PAGE',
    order: 0
  },

  'test/hello-api': createPageMeta({
    title: 'Hello API 0.4.1',
    subtitle: 'La nuova frontiera del Page Building dinamico',
    description: 'Pagina demo del page builder dinamico',
    icon: 'Terminal',
    policyName: 'PUBLIC_PAGE',
    order: 1,
    features: [
      {
        title: 'Type Safety',
        description: 'Interfacce rigorose.',
        iconName: 'ShieldCheck',
        enabled: true
      }
    ],
    cta: {
      text: 'Provalo ora',
      icon: 'Zap',
      enabled: true
    }
  })
};
```

`registry/index.ts`:

```ts
// src/config/discovery/registry/index.ts
import type { PageMeta } from '@/types/pages';
import { CORE_PAGES } from './core';
import { AUTH_PAGES } from './auth';
import { LIFECYCLE_PAGES } from './lifecycle';
import { COMPONENT_PAGES } from './components';
import { LANDING_PAGES } from './landing';

export const PAGES_REGISTRY: Record<string, PageMeta> = {
  ...CORE_PAGES,
  ...AUTH_PAGES,
  ...LIFECYCLE_PAGES,
  ...COMPONENT_PAGES,
  ...LANDING_PAGES
};
```

### 2.3. Helper: `createPageMeta`

File: `src/scripts/helpers/createPageMeta.ts`

Scopo: fornire una fabbrica type-safe per creare `PageMeta` senza ripetere sempre le stesse chiavi.

```ts
import type { PageMeta, PagePolicy } from '@/types/pages';
import { PREDEFINED_POLICIES } from '@/config/page-policies';

export type PolicyName = keyof typeof PREDEFINED_POLICIES;

export interface CreatePageOptions {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  policyName?: PolicyName;
  order?: number;

  features?: PageMeta['features'];
  cta?: PageMeta['cta'];
  sections?: PageMeta['sections'];
  footer?: PageMeta['footer'];
  props?: PageMeta['props'];

  flags?: Partial<Pick<PageMeta,
    | 'isPublic'
    | 'protected'
    | 'isActive'
    | 'isVisible'
    | 'isEnabled'
    | 'showInNavbar'
    | 'showInMenu'
    | 'showFooter'
  >>;

  policyOverrides?: Partial<PagePolicy>;
}

export function createPageMeta(options: CreatePageOptions): PageMeta {
  const {
    title,
    subtitle,
    description,
    icon,
    policyName = 'PUBLIC_PAGE',
    order = 100,
    features,
    cta,
    sections,
    footer,
    props,
    flags = {},
    policyOverrides = {}
  } = options;

  return {
    title,
    subtitle,
    description,
    icon,
    order,
    features,
    cta,
    sections,
    footer,
    props,
    policyName,
    policy: policyOverrides,
    ...flags
  };
}
```

Questo helper:

- usa solo i tipi attuali (`PageMeta`, `PagePolicy`),
- non introduce campi nuovi,
- rende più comodo creare nuove entry nel registry.

---

## 3. DiscoveryService

`DiscoveryService` è il ponte tra:

- `PAGES_REGISTRY` (`PageMeta`),
- il runtime (`Page[]` + `Navigation`).

Struttura tipica:

```ts
// src/scripts/services/DiscoveryService.server.ts
import { PAGES_REGISTRY } from '@/config/discovery/registry';
import type { Page, NavigationItem, PageMeta } from '@/types/pages';
import { DEFAULT_PAGE_POLICY, PREDEFINED_POLICIES } from '@/config/page-policies';
import { DEFAULT_PAGE_CONFIG } from '@/config/page-policies';

export class DiscoveryService {
  private static cache: Page[] | null = null;
  private static cacheExpiry = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000;

  static clearCache() {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  static async getAllPages(forceRefresh = false): Promise<Page[]> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    const pages: Page[] = Object.entries(PAGES_REGISTRY).map(
      ([id, meta]) => this.buildPageFromMeta(id, meta)
    );

    this.cache = pages;
    this.cacheExpiry = now + this.CACHE_DURATION;
    return pages;
  }

  static async getPageByUrl(url: string): Promise<Page | undefined> {
    const pages = await this.getAllPages();
    return pages.find(p => p.url === url);
  }

  static async getPageById(id: string): Promise<Page | undefined> {
    const pages = await this.getAllPages();
    return pages.find(p => p.id === id);
  }

  static async buildNavigation(): Promise<NavigationItem[]> {
    const pages = await this.getAllPages();
    // Filtra in base ai flag/policy (es. isVisible && showInNavbar)
    return [];
  }

  // ---------- Builder interno ----------

  private static resolvePolicy(meta: PageMeta) {
    const base = DEFAULT_PAGE_POLICY;
    const fromName = meta.policyName && PREDEFINED_POLICIES[meta.policyName]
      ? PREDEFINED_POLICIES[meta.policyName]
      : undefined;
    const manual = meta.policy ?? {};

    return {
      visibility: {
        ...base.visibility,
        ...(fromName?.visibility ?? {}),
        ...(manual.visibility ?? {})
      },
      access: {
        ...base.access,
        ...(fromName?.access ?? {}),
        ...(manual.access ?? {})
      },
      interaction: {
        ...base.interaction,
        ...(fromName?.interaction ?? {}),
        ...(manual.interaction ?? {})
      },
      rendering: {
        ...base.rendering,
        ...(fromName?.rendering ?? {}),
        ...(manual.rendering ?? {})
      }
    };
  }

  private static buildPageFromMeta(id: string, meta: PageMeta): Page {
    const policy = this.resolvePolicy(meta);

    const isActive = meta.isActive ?? policy.access.isActive;
    const isEnabled = meta.isEnabled ?? policy.interaction.isEnabled;
    const isVisible = meta.isVisible ?? policy.visibility.inLists;

    const isPublic = meta.isPublic ?? policy.access.isPublic;
    const isProtected = meta.protected ?? policy.access.requiresAuth;

    const showInNavbar = meta.showInNavbar ?? policy.visibility.inNavbar;
    const showInMenu = meta.showInMenu ?? policy.visibility.inLists;
    const showFooter = meta.showFooter ?? policy.rendering.showFooter;

    const disabled = meta.disabled ?? !isEnabled;

    const page: Page = {
      id,
      url: null,
      path: id,
      category: 'default',
      type: 'react',
      role: 'page',

      title: meta.title ?? id,
      description: meta.description,
      icon: meta.icon,

      isActive,
      isVisible,
      isEnabled,

      disabled,
      showInNavbar,

      isPublic,
      protected: isProtected,
      showInMenu,
      order: meta.order ?? DEFAULT_PAGE_CONFIG.order!,

      subtitle: meta.subtitle,
      features: meta.features,
      sections: meta.sections,
      cta: meta.cta,
      footer: meta.footer,
      showFooter,
      props: meta.props,

      policy: meta.policy,
      policyName: meta.policyName
    };

    return page;
  }
}
```

Punti chiave:

- `getAllPages()` è l'unico punto in cui `PageMeta` viene trasformato in `Page`.
- Tutto il merging delle policy avviene in `resolvePolicy`.
- Cache interna per evitare calcoli ripetuti.

---

## 4. API di Discovery

File principale: `src/pages/api/v1/pages/discovery.ts`

### 4.1. GET

```ts
import type { APIRoute } from 'astro';
import { DiscoveryService } from '@/scripts/services/DiscoveryService.server';
import type { SystemResponse } from '@/types/pages';

export const GET: APIRoute = async ({ url }) => {
  const searchParams = new URL(url).searchParams;

  const pageUrl = searchParams.get('url');
  const pageId = searchParams.get('id');
  const category = searchParams.get('category');
  const role = searchParams.get('role'); // 'page' | 'component'
  const filter = searchParams.get('filter'); // 'visible' | 'active' | ...
  const forceRefresh = searchParams.get('refresh') === 'true';
  const format = searchParams.get('format'); // 'full' | 'simple'

  // 1. Lookup singola pagina per URL
  if (pageUrl) {
    const page = await DiscoveryService.getPageByUrl(pageUrl);
    return new Response(JSON.stringify(page || null), {
      status: page ? 200 : 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Lookup singola pagina per ID
  if (pageId) {
    const page = await DiscoveryService.getPageById(pageId);
    return new Response(JSON.stringify(page || null), {
      status: page ? 200 : 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Bulk lookup + filtri
  let pages = await DiscoveryService.getAllPages(forceRefresh);

  if (category) {
    pages = pages.filter(p => p.category === category);
  }
  if (role) {
    pages = pages.filter(p => p.role === role);
  }

  if (filter === 'visible') {
    pages = pages.filter(p => p.isVisible);
  } else if (filter === 'active') {
    pages = pages.filter(p => p.isActive);
  } else if (filter === 'enabled') {
    pages = pages.filter(p => p.isEnabled);
  } else if (filter === 'public') {
    pages = pages.filter(p => p.isPublic);
  } else if (filter === 'protected') {
    pages = pages.filter(p => p.protected);
  }

  // formato semplice → solo array di Page
  if (format === 'simple') {
    return new Response(JSON.stringify(pages), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': forceRefresh ? 'no-cache' : 'public, max-age=300'
      }
    });
  }

  // formato completo → SystemResponse
  const navigation = await DiscoveryService.buildNavigation();

  const response: SystemResponse = {
    meta: {
      timestamp: new Date().toISOString(),
      version: '0.4.2',
      environment: import.meta.env.MODE as 'development' | 'production'
    },
    pages,
    navigation,
    config: {
      theme: 'system',
      protected: pages.filter(p => p.protected && p.url).map(p => p.url!),
      disabled: pages.filter(p => !p.isEnabled && p.url).map(p => p.url!)
    }
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': forceRefresh ? 'no-cache' : 'public, max-age=300'
    }
  });
};
```

### 4.2. POST (refresh cache)

```ts
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (body.action === 'refresh') {
      DiscoveryService.clearCache();
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cache cleared successfully'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid action'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

## 5. SystemClient (frontend)

File: `src/scripts/services/SystemClient.ts` (o simile)

```ts
import type { Page, NavigationItem, SystemResponse } from '@/types/pages';

export class SystemClient {
  private static cache: SystemResponse | null = null;
  private static cacheExpiry = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000;

  static async getSystemData(forceRefresh = false): Promise<SystemResponse> {
    const now = Date.now();

    if (!forceRefresh && this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    const res = await fetch(
      `/api/v1/pages/discovery${forceRefresh ? '?refresh=true' : ''}`
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch system data: ${res.status}`);
    }

    const data = (await res.json()) as SystemResponse;
    this.cache = data;
    this.cacheExpiry = now + this.CACHE_DURATION;

    return data;
  }

  static async getPages(forceRefresh = false): Promise<Page[]> {
    const data = await this.getSystemData(forceRefresh);
    return data.pages;
  }

  static async getNavigation(forceRefresh = false): Promise<NavigationItem[]> {
    const data = await this.getSystemData(forceRefresh);
    return data.navigation;
  }

  static async getPageByUrl(
    url: string,
    forceRefresh = false
  ): Promise<Page | undefined> {
    const pages = await this.getPages(forceRefresh);
    return pages.find(p => p.url === url);
  }

  static async getPagesByCategory(
    category: string,
    forceRefresh = false
  ): Promise<Page[]> {
    const pages = await this.getPages(forceRefresh);
    return pages.filter(p => p.category === category && !p.disabled);
  }

  static async getPublicPages(forceRefresh = false): Promise<Page[]> {
    const pages = await this.getPages(forceRefresh);
    return pages.filter(p => p.isPublic && !p.disabled);
  }

  static async getProtectedPages(forceRefresh = false): Promise<Page[]> {
    const pages = await this.getPages(forceRefresh);
    return pages.filter(p => p.protected && !p.disabled);
  }
}
```

---

## 6. Pagine fisiche vs pagine virtuali

### 6.1. Pagine fisiche React

Esempi:

- `src/react/components/pages/index.tsx`
- `src/react/components/pages/qualcosa.tsx`

Sono componenti React "classici":

- scritti a mano,
- montati da Astro via route dinamica (`[...component].astro` o simili),
- `Discovery` fornisce solo i metadati (`Page`) per routing, visibilità, ecc.

### 6.2. Pagine virtuali / template-driven (`HelloApi` & co.)

Esempio: `test/hello-api`

- ha una entry nel registry (`PageMeta`) molto ricca (features, sections, cta, footer…),
- viene renderizzata da un template dinamico (`HelloApi` o `DynamicPageTemplate`),
- non richiede un componente `.tsx` dedicato per ogni pagina:
  - puoi riusare lo stesso template per molte pagine configurate nel registry.

Schema ibrido:

- Pagine "semplici / marketing / test" → config-only (`PageMeta` + template).
- Pagine "complesse / app-specifiche" → component React fisico.

### 6.3. Obiettivo a medio termine

Atomizzare il template generatore (`HelloApi`) in sub-componenti: `PageHeader`, `PageFeatures`, `PageSections`, `PageCta`, `PageFooter`.

Introdurre una convenzione nel `Page`/`PageMeta` per decidere:

- se usare il template dinamico,
- o un componente fisico.

Esempio di routing ibrido (pseudo):

```tsx
// In una route Astro
const page = await DiscoveryService.getPageByUrl(currentUrl);

if (!page) notFound();

if (page.role === 'page' && !page.props?.usePhysicalComponent) {
  return <DynamicPageTemplate page={page} />;
} else {
  return <PhysicalComponent {...page.props} />;
}
```

---

## 7. Cosa devi ricordare / takeaway

### Un solo modello di dominio:

- Usa `PageMeta` (config sorgente) + `Page` (risolto) definiti in `src/types/pages.ts` o `src/types/discovery/page.ts` unificato.

### Policy system:

- `PagePolicy` + `PREDEFINED_POLICIES` + `DEFAULT_PAGE_POLICY`.
- `policyName` collega una pagina a una policy predefinita.
- `policy` permette override strutturati.

### Builder centralizzato:

- `DiscoveryService.buildPageFromMeta` è il cuore che fa: `PageMeta + Policy → Page`.

### Registry modulare:

- `PAGES_REGISTRY` split in `core.ts`, `auth.ts`, `lifecycle.ts`, `components.ts`, `landing.ts`.
- Nuove pagine: preferibilmente via `createPageMeta` helper.

### API & Client:

- `/api/v1/pages/discovery` espone `SystemResponse`.
- `SystemClient` usa `SystemResponse` e offre API convenienti (`getPages`, `getNavigation`, `getPublicPages`, ecc.).

### Fisico vs virtuale:

- Puoi continuare a usare componenti React fisici.
- Puoi spingere sempre di più verso pagine config-driven + template dinamico, dove ha senso.
```