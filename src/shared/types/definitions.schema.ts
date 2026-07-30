// ============================================================================
// Zod Validation Schemas — Structured Definition types
// Aligned with: src/shared/types/definitions.ts
// ============================================================================

import { z } from 'zod';
import type { NavItemDefinition, WidgetDefinition } from './definitions.js';

// ---- SEO Definition ----

/** Zod schema for SEO metadata of a page. */
export const SeoDefinitionSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogImage: z.string().nullable(),
  canonical: z.string().nullable(),
  keywords: z.array(z.string()),
});

// ---- Entity Definition ----

/** Zod schema for a structured entity definition derived from the knowledge model. */
export const EntityDefinitionSchema = z.object({
  name: z.string(),
  attributes: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
    }),
  ),
  relationships: z.array(
    z.object({
      entity: z.string(),
      type: z.string(),
    }),
  ),
});

// ---- Data Dependency ----

/** Zod schema for a data dependency of a page or widget. */
export const DataDependencySchema = z.object({
  entity: z.string(),
  endpoint: z.string(),
  method: z.string(),
  operation: z.enum(['read', 'list', 'create', 'update', 'delete']),
  required: z.boolean(),
  loadingState: z.enum(['skeleton', 'spinner', 'none']),
  errorState: z.enum(['toast', 'inline', 'redirect']),
});

// ---- Widget Prop ----

/** Zod schema for a prop accepted by a widget. */
export const WidgetPropSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  defaultValue: z.unknown().nullable(),
  source: z.enum(['static', 'entity', 'api', 'computed']),
});

// ---- Widget Assignment ----

/** Zod schema for the assignment of a widget to a specific page section. */
export const WidgetAssignmentSchema = z.object({
  widgetId: z.string(),
  sectionId: z.string(),
  props: z.record(z.unknown()),
});

// ---- Page Section Definition ----

/** Zod schema for a section within a page definition. */
export const PageSectionDefinitionSchema = z.object({
  id: z.string(),
  type: z.enum(['hero', 'features', 'content', 'cta', 'testimonials', 'stats', 'custom']),
  order: z.number(),
  widgetId: z.string(),
});

// ---- Navigation Item Definition (recursive) ----

/** Zod schema for a single navigation item; supports nested children via z.lazy(). */
export const NavItemDefinitionSchema: z.ZodType<NavItemDefinition> = z.lazy(() =>
  z.object({
    label: z.string(),
    route: z.string(),
    icon: z.string().nullable(),
    children: z.array(NavItemDefinitionSchema),
    access: z.enum(['public', 'authenticated', 'admin']),
  }),
);

// ---- Navigation Definition ----

/** Zod schema for the application navigation structure. */
export const NavigationDefinitionSchema = z.object({
  type: z.enum(['header', 'sidebar', 'both', 'none']),
  items: z.array(NavItemDefinitionSchema),
});

// ---- Theme Definition ----

/** Zod schema for application theming configuration. */
export const ThemeDefinitionSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string(),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
    mono: z.string(),
  }),
  borderRadius: z.string(),
});

// ---- Auth Definition ----

/** Zod schema for authentication configuration. */
export const AuthDefinitionSchema = z.object({
  providers: z.array(z.string()),
  protectedRoutes: z.array(z.string()),
  publicRoutes: z.array(z.string()),
});

// ---- Feature Flag ----

/** Zod schema for a feature flag controlling optional functionality. */
export const FeatureFlagSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  description: z.string(),
});

// ---- Widget Definition (needs lazy for recursive children) ----

/** Zod schema for a reusable UI widget that can be assigned to pages. */
export const WidgetDefinitionSchema: z.ZodTypeAny = z.lazy(() =>
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum([
        'hero',
        'features',
        'cta',
        'card-grid',
        'data-table',
        'chart',
        'form',
        'list',
        'detail',
        'search',
        'navigation',
        'footer',
        'custom',
      ]),
      title: z.string(),
      description: z.string(),
      props: z.array(WidgetPropSchema),
      dataSource: z.enum(['static', 'props', 'api', 'context']),
      responsive: z.enum(['static', 'adaptive', 'responsive']),
      interactivity: z.enum(['static', 'hydrated', 'spa']),
      sourceComponent: z.string().nullable(),
      children: z.array(WidgetDefinitionSchema),
    }),
  );

// ---- Page Definition ----

/** Zod schema for a page derived from the application context. */
export const PageDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  route: z.string(),
  description: z.string(),
  application: z.string(),
  archetype: z.string(),
  layout: z.enum(['default', 'full-width', 'sidebar', 'minimal', 'dashboard']),
  sections: z.array(PageSectionDefinitionSchema),
  dataDependencies: z.array(DataDependencySchema),
  widgets: z.array(WidgetAssignmentSchema),
  seo: SeoDefinitionSchema,
  access: z.enum(['public', 'authenticated', 'admin']),
  caching: z.enum(['static', 'dynamic', 'hybrid']),
  authRequired: z.boolean(),
  roles: z.array(z.string()),
});

// ---- Application Definition ----

/** Zod schema for the strategic object that describes the entire application. */
export const ApplicationDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  description: z.string(),
  purpose: z.string(),
  architecture: z.enum(['spa', 'mpa', 'ssr', 'ssg', 'islands']),
  framework: z.enum(['astro', 'nextjs', 'remix', 'nuxt', 'sveltekit']),
  stylingStrategy: z.enum(['tailwind', 'css-modules', 'styled-components']),
  domains: z.array(z.string()),
  domain: z.string(),
  entities: z.array(EntityDefinitionSchema),
  pages: z.array(PageDefinitionSchema),
  navigation: NavigationDefinitionSchema,
  theming: ThemeDefinitionSchema,
  authentication: AuthDefinitionSchema.nullable(),
  features: z.array(FeatureFlagSchema),
  generatedAt: z.string(),
  sourceManifest: z.string(),
  confidence: z.number(),
});
