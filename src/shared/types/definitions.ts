// ============================================================================
// Structured Definitions — "What should we build?"
// Aligned with: docs/08-nexus-roadmap.md § Epic 5 — Definition Schemas
// Principle: Application First, not Page First.
// ============================================================================

// ============================================================================
// ApplicationDefinition
// ============================================================================

/**
 * The strategic object that describes the entire application.
 * Pages and widgets are derived from this, not defined independently.
 */
export interface ApplicationDefinition {
  /** Unique identifier for this application. */
  id: string;
  /** Application name (e.g. "MyDashboard"). */
  name: string;
  /** Human-readable title. */
  title: string;
  /** Description of the application's purpose. */
  description: string;
  /** Human-readable purpose statement. (extra — beyond spec) */
  purpose: string;

  // -- Strategic decisions (from spec) --
  /** Target architecture model. */
  architecture: 'spa' | 'mpa' | 'ssr' | 'ssg' | 'islands';
  /** Target framework for generation. */
  framework: 'astro' | 'nextjs' | 'remix' | 'nuxt' | 'sveltekit';
  /** Primary styling strategy. */
  stylingStrategy: 'tailwind' | 'css-modules' | 'styled-components';

  // -- Derived from KnowledgeModel --
  /** Domain IDs this application belongs to. */
  domains: string[];
  /** Primary business domain label. (extra — beyond spec) */
  domain: string;
  /** Entity definitions extracted from the knowledge model. */
  entities: EntityDefinition[];

  // -- Pages are derived from the application, not defined independently --
  pages: PageDefinition[];

  // -- Global concerns --
  /** Application navigation structure. */
  navigation: NavigationDefinition;
  /** Application theming configuration. */
  theming: ThemeDefinition;
  /** Authentication configuration, or null if none. */
  authentication: AuthDefinition | null;

  // -- Feature flags (extra — beyond spec) --
  features: FeatureFlag[];

  // -- Metadata --
  /** ISO 8601 timestamp of when this definition was generated. */
  generatedAt: string;
  /** Path to the originating manifest file. */
  sourceManifest: string;
  /** Overall confidence score for these definitions (0.0–1.0). */
  confidence: number;
}

// ============================================================================
// PageDefinition
// ============================================================================

/**
 * A page derived from the application context.
 */
export interface PageDefinition {
  /** Unique identifier for this page. */
  id: string;
  /** Page title. */
  title: string;
  /** URL route for this page. */
  route: string;
  /** Human-readable description. */
  description: string;
  /** Application ID this page belongs to. (extra — beyond spec) */
  application: string;

  // -- Archetype & Layout --
  /** References a KnowledgeArchetype from the catalog. */
  archetype: string;
  /** Page layout type. */
  layout: 'default' | 'full-width' | 'sidebar' | 'minimal' | 'dashboard';

  // -- Content model --
  /** Ordered sections that compose this page. */
  sections: PageSectionDefinition[];
  /** Data dependencies for this page. */
  dataDependencies: DataDependency[];

  // -- Component assignments --
  /** Widgets assigned to this page. */
  widgets: WidgetAssignment[];

  // -- Behavior --
  /** SEO metadata for this page. */
  seo: SeoDefinition;
  /** Access control level. */
  access: 'public' | 'authenticated' | 'admin';
  /** Caching strategy. */
  caching: 'static' | 'dynamic' | 'hybrid';

  // -- Extra fields preserved from original model --
  /** Whether authentication is required. (extra — superseded by `access` but kept for compatibility) */
  authRequired: boolean;
  /** Roles allowed to access this page. (extra — beyond spec) */
  roles: string[];
}

// ============================================================================
// WidgetDefinition
// ============================================================================

/**
 * A reusable UI widget that can be assigned to pages.
 */
export interface WidgetDefinition {
  /** Unique identifier for this widget. */
  id: string;
  /** Widget name (e.g. "HeroBanner", "ProductGrid"). */
  name: string;
  /** Widget type classification. */
  type: 'hero' | 'features' | 'cta' | 'card-grid' | 'data-table' | 'chart'
    | 'form' | 'list' | 'detail' | 'search' | 'navigation' | 'footer' | 'custom';
  /** Human-readable title. (extra — beyond spec) */
  title: string;
  /** Description of what this widget does. (extra — beyond spec) */
  description: string;

  // -- Data contract --
  /** Props accepted by this widget. */
  props: WidgetProp[];
  /** Data source strategy. */
  dataSource: 'static' | 'props' | 'api' | 'context';

  // -- Rendering hints --
  /** Responsive behavior. */
  responsive: 'static' | 'adaptive' | 'responsive';
  /** Interactivity model. */
  interactivity: 'static' | 'hydrated' | 'spa';

  // -- Source mapping --
  /** Original ComponentNode ID this widget was derived from (for migration traceability). */
  sourceComponent: string | null;

  // -- Extra fields preserved from original model --
  /** Nested child widgets (supports composite widgets). (extra — beyond spec) */
  children: WidgetDefinition[];
}

// ============================================================================
// Supporting Types — Navigation
// ============================================================================

/**
 * Application navigation structure.
 */
export interface NavigationDefinition {
  /** Navigation display type. */
  type: 'header' | 'sidebar' | 'both' | 'none';
  /** Navigation items. */
  items: NavItemDefinition[];
}

/**
 * A single navigation item, which may have children (nested navigation).
 */
export interface NavItemDefinition {
  /** Display label. */
  label: string;
  /** Target route. */
  route: string;
  /** Optional icon identifier. */
  icon: string | null;
  /** Nested child navigation items. */
  children: NavItemDefinition[];
  /** Access control for this nav item. */
  access: 'public' | 'authenticated' | 'admin';
}

// ============================================================================
// Supporting Types — Theming
// ============================================================================

/**
 * Application theming configuration.
 */
export interface ThemeDefinition {
  /** Color mode. */
  mode: 'light' | 'dark' | 'system';
  /** Primary brand color (HSL string recommended). */
  primaryColor: string;
  /** Font family configuration. */
  fonts: { heading: string; body: string; mono: string };
  /** Border radius token (e.g. "0.5rem"). */
  borderRadius: string;
}

// ============================================================================
// Supporting Types — Authentication
// ============================================================================

/**
 * Authentication configuration for the application.
 */
export interface AuthDefinition {
  /** Authentication providers (e.g. "google", "github", "credentials"). */
  providers: string[];
  /** Routes that require authentication. */
  protectedRoutes: string[];
  /** Routes that are always public. */
  publicRoutes: string[];
}

// ============================================================================
// Supporting Types — Page Sections
// ============================================================================

/**
 * A section within a page definition.
 */
export interface PageSectionDefinition {
  /** Unique identifier for this section. */
  id: string;
  /** Section type. */
  type: 'hero' | 'features' | 'content' | 'cta' | 'testimonials' | 'stats' | 'custom';
  /** Display order (ascending). */
  order: number;
  /** WidgetDefinition ID that renders this section. */
  widgetId: string;
}

// ============================================================================
// Supporting Types — Data Dependencies
// ============================================================================

/**
 * A data dependency for a page or widget.
 * Reconciled between the original model and the spec.
 */
export interface DataDependency {
  /** Entity ID this dependency relates to. */
  entity: string;
  /** API endpoint for fetching data. */
  endpoint: string;
  /** HTTP method. */
  method: string;
  /** Data operation type. (extra — beyond spec) */
  operation: 'read' | 'list' | 'create' | 'update' | 'delete';
  /** Whether this dependency is required for the page to render. (extra) */
  required: boolean;
  /** Loading state UI strategy. */
  loadingState: 'skeleton' | 'spinner' | 'none';
  /** Error state UI strategy. */
  errorState: 'toast' | 'inline' | 'redirect';
}

// ============================================================================
// Supporting Types — Widget Assignment & Props
// ============================================================================

/**
 * Assignment of a widget to a specific page section.
 */
export interface WidgetAssignment {
  /** WidgetDefinition ID being assigned. */
  widgetId: string;
  /** PageSectionDefinition ID this widget is assigned to. */
  sectionId: string;
  /** Props passed to the widget instance. */
  props: Record<string, unknown>;
}

/**
 * A prop accepted by a widget.
 */
export interface WidgetProp {
  /** Prop name. */
  name: string;
  /** Prop type (inferred or explicit). */
  type: string;
  /** Whether the prop is required. */
  required: boolean;
  /** Default value, if any. */
  defaultValue: unknown | null;
  /** Where the prop value originates. */
  source: 'static' | 'entity' | 'api' | 'computed';
}

// ============================================================================
// Supporting Types — SEO
// ============================================================================

/**
 * SEO metadata for a page.
 */
export interface SeoDefinition {
  /** Page title (may differ from PageDefinition.title). */
  title: string;
  /** Meta description. */
  description: string;
  /** Open Graph image URL. */
  ogImage: string | null;
  /** Canonical URL. */
  canonical: string | null;
  /** SEO keywords. (extra — beyond spec) */
  keywords: string[];
}

// ============================================================================
// Supporting Types — Entities
// ============================================================================

/**
 * A structured entity definition derived from the knowledge model.
 */
export interface EntityDefinition {
  /** Entity name (e.g. "User", "Product"). */
  name: string;
  /** Entity attributes. */
  attributes: { name: string; type: string; required: boolean }[];
  /** Relationships to other entities. */
  relationships: { entity: string; type: string }[];
}

// ============================================================================
// Legacy / Extra Types (preserved for compatibility)
// ============================================================================

/**
 * Feature flag controlling optional functionality.
 * (extra — preserved from original model, not in roadmap spec)
 */
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
}
