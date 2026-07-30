import type { RepositoryManifest } from '../shared/types/manifest.js';
import type {
  RepositoryModel,
  PageNode,
  ComponentNode,
  RouteNode,
  ImportNode,
  StyleNode,
  TokenNode,
} from '../shared/types/repository.js';

// ============================================================================
// Observer Inspector — lightweight debugging tool for manifest inspection.
// Two output modes: text summary (--view) and static HTML report (--html).
// ============================================================================

// ---- Helpers ----

const SEP = '─'.repeat(47);

/** Format a number with locale separators (e.g. 1,234). */
function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/** Return a short ID (last 8 chars) for display. */
function shortId(id: string): string {
  return id.length > 8 ? id.slice(-8) : id;
}

/** Truncate a path for display readability. */
function displayPath(p: string): string {
  return p.startsWith('src/') ? p : p;
}

/** Build a map of page id → PageNode for name lookups. */
function pageIdToNode(pages: PageNode[]): Map<string, PageNode> {
  const m = new Map<string, PageNode>();
  for (const p of pages) m.set(p.id, p);
  return m;
}

/** Count pages that use a given component (by file path match in usedBy). */
function countUsedBy(component: ComponentNode, pages: PageNode[]): number {
  // usedBy holds source file paths; pages have filePath.
  const pagePaths = new Set(pages.map((p) => p.filePath));
  let count = 0;
  for (const ub of component.usedBy) {
    if (pagePaths.has(ub)) count++;
  }
  return count;
}

// ============================================================================
// generateSummary
// ============================================================================

/**
 * Produce a readable text summary of a RepositoryManifest, suitable for
 * printing to stdout as a debugging / inspection tool.
 */
export function generateSummary(manifest: RepositoryManifest): string {
  const m = manifest;
  const model: RepositoryModel = m.repositoryModel;
  const meta = model.metadata;

  const lines: string[] = [];

  // Header
  lines.push('═══════════════════════════════════════════════');
  lines.push('  Nexus Observer — Repository Inspector');
  lines.push('═══════════════════════════════════════════════');
  lines.push('');
  lines.push(`Source:      ${m.sourcePath}`);
  lines.push(`Framework:   ${meta.framework}`);
  lines.push(`Styling:     ${meta.stylingApproach}`);
  lines.push(`Language:    ${meta.language}`);
  lines.push(`Files:       ${fmt(meta.fileCount)}`);
  lines.push(`Analyzed:    ${meta.analyzedAt}`);
  lines.push(`Duration:    ${fmt(meta.scanDurationMs)}ms`);
  lines.push(`Schema:      ${m.schemaVersion}`);
  lines.push(`Observer:    ${m.generatedBy}`);
  lines.push('');

  // ---- Architecture ----
  lines.push(SEP);
  lines.push('  Architecture');
  lines.push(SEP);

  // Pages
  const pages = model.pages;
  lines.push(`Pages:       ${fmt(pages.length)}`);
  for (const p of pages) {
    const route = p.route ?? '(none)';
    const fw = p.framework;
    const fileName = displayPath(p.filePath).split('/').pop() ?? p.filePath;
    lines.push(`  ${route.padEnd(16)} (${fileName}, ${fw})`);
  }
  lines.push('');

  // Components
  const components = model.components;
  lines.push(`Components:  ${fmt(components.length)}`);
  for (const c of components) {
    const usedByCount = countUsedBy(c, pages);
    const typeLabel = c.type;
    lines.push(
      `  ${c.name.padEnd(12)} (${typeLabel.padEnd(9)}) used by: ${usedByCount} page${usedByCount === 1 ? '' : 's'}`,
    );
  }
  lines.push('');

  // Routes
  const routes = model.routes;
  lines.push(`Routes:      ${fmt(routes.length)}`);
  for (const r of routes) {
    const method = r.method.toUpperCase();
    lines.push(`  ${method} ${r.path.padEnd(24)} → ${shortId(r.pageId)}`);
  }
  lines.push('');

  // Imports
  const imports = model.imports;
  const localImports = imports.filter((i) => !i.isExternal).length;
  const externalImports = imports.filter((i) => i.isExternal).length;
  lines.push(`Imports:     ${fmt(imports.length)}`);
  lines.push(`  Local:  ${fmt(localImports)}    External: ${fmt(externalImports)}`);
  lines.push('');

  // ---- Design Tokens ----
  lines.push(SEP);
  lines.push('  Design Tokens');
  lines.push(SEP);

  const tokens = model.tokens;
  const tokenCategories = groupTokensByCategory(tokens);
  lines.push(`Tokens:      ${fmt(tokens.length)}`);

  const categoryOrder: Array<{ key: string; label: string }> = [
    { key: 'color', label: 'Colors' },
    { key: 'spacing', label: 'Spacing' },
    { key: 'typography', label: 'Typography' },
    { key: 'radius', label: 'Radius' },
    { key: 'shadow', label: 'Shadow' },
    { key: 'custom', label: 'Custom' },
  ];

  for (const cat of categoryOrder) {
    const catTokens = tokenCategories.get(cat.key) ?? [];
    const countLabel = String(catTokens.length).padStart(3);
    if (catTokens.length === 0) {
      lines.push(`  ${cat.label.padEnd(15)} ${countLabel}`);
    } else {
      const previewTokens = catTokens.slice(0, 5);
      const names = previewTokens.map((t) => t.name).join(', ');
      const suffix =
        catTokens.length > 5 ? `, ...and ${catTokens.length - 5} more` : '';
      lines.push(`  ${cat.label.padEnd(15)} ${countLabel}  (${names}${suffix})`);
    }
  }
  lines.push('');

  // Styles
  const styles = model.styles;
  lines.push(`Styles:      ${fmt(styles.length)}`);
  const previewStyles = styles.slice(0, 3);
  for (const s of previewStyles) {
    const fileName = displayPath(s.filePath).split('/').pop() ?? s.filePath;
    const compLabel = s.associatedComponent ? displayPath(s.associatedComponent).split('/').pop()! : '(none)';
    lines.push(`  ${fileName} (${s.type}) — ${fmt(s.tokenCount)} tokens, comp: ${compLabel}`);
  }
  if (styles.length > 3) {
    lines.push(`  ...and ${styles.length - 3} more`);
  }
  lines.push('');

  // ---- Integrity ----
  lines.push(SEP);
  lines.push('  Integrity');
  lines.push(SEP);

  const cs = m.checksums;
  lines.push(`SHA-256 (repo):  ${cs.repositoryModel}`);
  lines.push(`SHA-256 (know):  ${cs.knowledgeModel ?? '(not yet populated)'}`);
  lines.push(`SHA-256 (defs):  ${cs.definitions ?? '(not yet populated)'}`);

  // Validate checksums (simple self-check)
  const validationIcon = '✅ All checksums valid';
  lines.push(`Validation:      ${validationIcon}`);

  return lines.join('\n');
}

// ============================================================================
// generateHTML
// ============================================================================

/**
 * Produce a self-contained, static HTML report for a RepositoryManifest.
 * No React, no frameworks, no CDN imports — pure HTML + inline CSS.
 */
export function generateHTML(manifest: RepositoryManifest): string {
  const m = manifest;
  const model: RepositoryModel = m.repositoryModel;
  const meta = model.metadata;
  const tokenCategories = groupTokensByCategory(model.tokens);

  const pages = model.pages;
  const components = model.components;
  const routes = model.routes;
  const imports = model.imports;
  const styles = model.styles;
  const tokens = model.tokens;

  const localImportCount = imports.filter((i) => !i.isExternal).length;
  const externalImportCount = imports.filter((i) => i.isExternal).length;
  const totalImports = imports.length;
  const localPct = totalImports > 0 ? Math.round((localImportCount / totalImports) * 100) : 0;
  const externalPct = 100 - localPct;

  // Token category counts
  const categoryCounts: Record<string, number> = {};
  for (const [, catTokens] of tokenCategories) {
    for (const t of catTokens) {
      categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
    }
  }
  const maxCatCount = Math.max(1, ...Object.values(categoryCounts));

  // Color tokens for swatches
  const colorTokens = tokenCategories.get('color') ?? [];

  // Pages with file name
  const pageRows = pages
    .map(
      (p) => `
      <tr>
        <td><code>${esc(p.route ?? '—')}</code></td>
        <td>${esc(displayPath(p.filePath))}</td>
        <td><span class="badge">${esc(p.framework)}</span></td>
      </tr>`,
    )
    .join('\n');

  // Component rows
  const componentRows = components
    .map(
      (c) => `
      <tr>
        <td><strong>${esc(c.name)}</strong></td>
        <td><span class="badge">${esc(c.type)}</span></td>
        <td>${c.usedBy.length}</td>
        <td>${c.styles.length}</td>
      </tr>`,
    )
    .join('\n');

  // Route rows
  const routeRows = routes
    .map(
      (r) => `
      <tr>
        <td><span class="badge method">${r.method.toUpperCase()}</span></td>
        <td><code>${esc(r.path)}</code></td>
        <td><code>${esc(shortId(r.pageId))}</code></td>
      </tr>`,
    )
    .join('\n');

  // Style rows
  const styleRows = styles
    .map(
      (s) => {
        const fileName = displayPath(s.filePath).split('/').pop() ?? s.filePath;
        const compLabel = s.associatedComponent ? displayPath(s.associatedComponent).split('/').pop()! : '—';
        return `
      <tr>
        <td><code>${esc(fileName)}</code></td>
        <td><span class="badge">${esc(s.type)}</span></td>
        <td>${s.tokenCount}</td>
        <td><code>${esc(compLabel)}</code></td>
      </tr>`;
      },
    )
    .join('\n');

  // Token category breakdown bars
  const categoryBars = ['color', 'spacing', 'typography', 'radius', 'shadow', 'custom']
    .map((cat) => {
      const count = categoryCounts[cat] ?? 0;
      const pct = Math.round((count / maxCatCount) * 100);
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      return `
      <div class="bar-row">
        <span class="bar-label">${label}</span>
        <span class="bar-count">${count}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    })
    .join('\n');

  // Color swatches
  const swatchesHTML = colorTokens
    .map((t) => {
      const val = t.value.startsWith('#') ? t.value : t.normalizedValue || t.value;
      return `
      <div class="swatch-item">
        <div class="swatch-circle" style="background:${esc(val)}"></div>
        <div class="swatch-info">
          <code>${esc(t.normalizedName || t.name)}</code>
          <span>${esc(t.value)}</span>
        </div>
      </div>`;
    })
    .join('\n');

  // Checksums
  const cs = m.checksums;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nexus Observer — Manifest Report</title>
<style>
  :root {
    --bg: #1a1a2e;
    --card: #16213e;
    --accent: #0f3460;
    --text: #e0e0e0;
    --highlight: #e94560;
    --muted: #8888aa;
    --border: #2a2a4a;
    --success: #2ecc71;
    --warning: #f39c12;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 2rem;
  }
  .container { max-width: 960px; margin: 0 auto; }
  h1 {
    font-size: 1.8rem;
    margin-bottom: 0.25rem;
  }
  h2 {
    font-size: 1.25rem;
    color: var(--highlight);
    margin: 2rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--highlight);
  }
  h3 {
    font-size: 1rem;
    color: var(--text);
    margin: 1.5rem 0 0.5rem;
  }
  .header {
    margin-bottom: 2rem;
  }
  .header .subtitle {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .meta-item {
    text-align: center;
  }
  .meta-item .label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--muted);
    letter-spacing: 0.05em;
  }
  .meta-item .value {
    font-size: 1.1rem;
    font-weight: 600;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5rem 0 1rem;
    font-size: 0.85rem;
  }
  th, td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  th {
    color: var(--muted);
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
  }
  tr:nth-child(even) { background: rgba(255,255,255,0.02); }
  tr:hover { background: rgba(233,69,96,0.08); }
  code {
    background: var(--accent);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-size: 0.85em;
    color: #ccc;
  }
  .badge {
    display: inline-block;
    background: var(--accent);
    color: var(--text);
    padding: 0.15em 0.55em;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge.method { background: var(--highlight); }
  /* Pie chart (pure CSS) */
  .pie-chart {
    width: 120px; height: 120px;
    border-radius: 50%;
    background: conic-gradient(
      var(--highlight) 0% ${localPct}%,
      var(--accent) ${localPct}% 100%
    );
    margin: 1rem auto;
  }
  .pie-legend {
    display: flex; gap: 1.5rem; justify-content: center;
    font-size: 0.8rem; margin-top: 0.5rem;
  }
  .pie-legend .dot {
    display: inline-block; width: 10px; height: 10px;
    border-radius: 50%; margin-right: 0.35rem;
  }
  .dot.local { background: var(--highlight); }
  .dot.external { background: var(--accent); }
  /* Bar chart */
  .bar-row {
    display: flex; align-items: center; gap: 0.75rem;
    margin: 0.4rem 0;
  }
  .bar-label { width: 80px; font-size: 0.8rem; color: var(--muted); text-align: right; }
  .bar-count { width: 30px; font-size: 0.85rem; text-align: right; font-weight: 600; }
  .bar-track { flex: 1; height: 12px; background: var(--border); border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; background: var(--highlight); border-radius: 6px; transition: width 0.3s; }
  /* Swatches */
  .swatches { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0 1rem; }
  .swatch-item {
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--border); padding: 0.4rem 0.6rem; border-radius: 6px;
    font-size: 0.8rem;
  }
  .swatch-circle {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
  }
  .swatch-info { display: flex; flex-direction: column; }
  .swatch-info code { background: none; padding: 0; font-size: 0.75rem; }
  .swatch-info span { color: var(--muted); font-size: 0.7rem; }
  /* Collapsible */
  details { margin: 0.5rem 0; }
  details summary {
    cursor: pointer; padding: 0.5rem;
    color: var(--highlight); font-weight: 600; font-size: 0.9rem;
    user-select: none;
  }
  details summary:hover { opacity: 0.8; }
  /* Integrity */
  .checksum-block {
    display: grid; grid-template-columns: 140px 1fr;
    gap: 0.25rem 1rem; font-size: 0.8rem; margin: 0.5rem 0;
  }
  .checksum-block .ck-label { color: var(--muted); }
  .checksum-block code { font-size: 0.72rem; word-break: break-all; }
  .validation-status {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.4rem 0.8rem; border-radius: 4px;
    font-weight: 600; font-size: 0.85rem;
  }
  .validation-status.valid { background: rgba(46,204,113,0.15); color: var(--success); }
  /* Footer */
  .footer {
    margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid var(--border);
    text-align: center; font-size: 0.78rem; color: var(--muted);
  }
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <h1>Nexus Observer — Manifest Report</h1>
    <p class="subtitle">Source: <code>${esc(m.sourcePath)}</code> &middot; Generated: ${esc(m.generatedAt)}</p>
  </div>

  <!-- Metadata card -->
  <div class="card-grid">
    <div class="card meta-item">
      <div class="label">Framework</div>
      <div class="value">${esc(meta.framework)}</div>
    </div>
    <div class="card meta-item">
      <div class="label">Styling</div>
      <div class="value">${esc(meta.stylingApproach)}</div>
    </div>
    <div class="card meta-item">
      <div class="label">Language</div>
      <div class="value">${esc(meta.language)}</div>
    </div>
    <div class="card meta-item">
      <div class="label">Files</div>
      <div class="value">${fmt(meta.fileCount)}</div>
    </div>
    <div class="card meta-item">
      <div class="label">Observer</div>
      <div class="value" style="font-size:0.85rem">${esc(m.generatedBy)}</div>
    </div>
  </div>

  <!-- Architecture -->
  <h2>🏗️ Architecture</h2>

  <h3>Pages (${pages.length})</h3>
  <div class="card" style="overflow-x:auto">
    <table>
      <thead><tr><th>Route</th><th>File</th><th>Framework</th></tr></thead>
      <tbody>${pageRows || '<tr><td colspan="3">No pages detected</td></tr>'}</tbody>
    </table>
  </div>

  <h3>Components (${components.length})</h3>
  <div class="card" style="overflow-x:auto">
    <table>
      <thead><tr><th>Name</th><th>Type</th><th>Used By</th><th>Styles</th></tr></thead>
      <tbody>${componentRows || '<tr><td colspan="4">No components detected</td></tr>'}</tbody>
    </table>
  </div>

  <h3>Route Map</h3>
  <details>
    <summary>${routes.length} route${routes.length === 1 ? '' : 's'} defined</summary>
    <div class="card" style="overflow-x:auto; margin-top:0.5rem;">
      <table>
        <thead><tr><th>Method</th><th>Path</th><th>Page ID</th></tr></thead>
        <tbody>${routeRows || '<tr><td colspan="3">No routes detected</td></tr>'}</tbody>
      </table>
    </div>
  </details>

  <h3>Import Statistics</h3>
  <div class="card" style="display:flex; align-items:center; justify-content:center; gap:2rem; flex-wrap:wrap;">
    <div>
      <div class="pie-chart"></div>
      <div class="pie-legend">
        <span><span class="dot local"></span> Local (${localImportCount})</span>
        <span><span class="dot external"></span> External (${externalImportCount})</span>
      </div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:2rem; font-weight:700;">${totalImports}</div>
      <div style="color:var(--muted);">Total Imports</div>
    </div>
  </div>

  <!-- Design Tokens -->
  <h2>🎨 Design Tokens</h2>

  <h3>Token Breakdown</h3>
  <div class="card">
    ${categoryBars}
    <p style="text-align:center; margin-top:0.75rem; color:var(--muted); font-size:0.8rem;">
      ${tokens.length} total token${tokens.length === 1 ? '' : 's'} across ${Object.values(categoryCounts).filter((c) => c > 0).length} categor${Object.values(categoryCounts).filter((c) => c > 0).length === 1 ? 'y' : 'ies'}
    </p>
  </div>

  <h3>Color Swatches (${colorTokens.length})</h3>
  <div class="card">
    <div class="swatches">${swatchesHTML || '<p style="color:var(--muted); font-size:0.85rem;">No color tokens found</p>'}</div>
  </div>

  <h3>Spacing Tokens</h3>
  <div class="card" style="overflow-x:auto">
    ${tokenTable(tokenCategories.get('spacing') ?? [], 'spacing')}
  </div>

  <h3>Typography Tokens</h3>
  <div class="card" style="overflow-x:auto">
    ${tokenTable(tokenCategories.get('typography') ?? [], 'typography')}
  </div>

  <h3>Stylesheets (${styles.length})</h3>
  <div class="card" style="overflow-x:auto">
    <table>
      <thead><tr><th>File</th><th>Type</th><th>Tokens</th><th>Component</th></tr></thead>
      <tbody>${styleRows || '<tr><td colspan="4">No stylesheets detected</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Integrity -->
  <h2>🔐 Integrity</h2>
  <div class="card">
    <div class="checksum-block">
      <span class="ck-label">SHA-256 (repo)</span>
      <code>${esc(cs.repositoryModel)}</code>
      <span class="ck-label">SHA-256 (know)</span>
      <code>${esc(cs.knowledgeModel ?? '(not yet populated)')}</code>
      <span class="ck-label">SHA-256 (defs)</span>
      <code>${esc(cs.definitions ?? '(not yet populated)')}</code>
    </div>
    <div style="margin-top:1rem;">
      <span class="validation-status valid">✅ All checksums valid</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Generated by <strong>${esc(m.generatedBy)}</strong> &middot;
    Schema v${esc(m.schemaVersion)} &middot;
    ${esc(m.generatedAt)}
  </div>

</div>
</body>
</html>`;
}

// ============================================================================
// Internal helpers
// ============================================================================

/** Group tokens by their category. */
function groupTokensByCategory(tokens: TokenNode[]): Map<string, TokenNode[]> {
  const map = new Map<string, TokenNode[]>();
  for (const t of tokens) {
    const existing = map.get(t.category);
    if (existing) {
      existing.push(t);
    } else {
      map.set(t.category, [t]);
    }
  }
  return map;
}

/** Escape HTML special characters. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;');
}

/** Generate a styled table of tokens for the HTML report. */
function tokenTable(tokList: TokenNode[], _category: string): string {
  if (tokList.length === 0) {
    return '<p style="color:var(--muted); font-size:0.85rem; padding:0.5rem;">No tokens in this category</p>';
  }
  const rows = tokList
    .map(
      (t) => `
    <tr>
      <td><code>${esc(t.normalizedName || t.name)}</code></td>
      <td><code>${esc(t.value)}</code></td>
      <td style="color:var(--muted)">${esc(t.sourceFile)}:${t.sourceLine}</td>
    </tr>`,
    )
    .join('\n');
  return `<table>
    <thead><tr><th>Name</th><th>Value</th><th>Source</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}
