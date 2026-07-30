import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import type { RepositoryMetadata } from '../shared/types/repository.js';

// ============================================================================
// Framework Detector — detects framework, styling, language from a repo
// ============================================================================

/** Known framework detection map: package name → framework label */
const FRAMEWORK_PACKAGES: Record<string, string> = {
  astro: 'astro',
  '@sveltejs/kit': 'svelte',
  nuxt: 'vue',
};

/** Known styling approach packages */
const STYLING_PACKAGES: Record<string, string> = {
  tailwindcss: 'tailwind',
  'styled-components': 'styled-components',
  '@emotion/styled': 'styled-components',
  sass: 'scss',
  'node-sass': 'scss',
};

/**
 * Recursively count files in a directory, excluding common ignorable dirs.
 */
function countFilesRecursive(dir: string, exclusions: Set<string>): number {
  let count = 0;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return 0;
  }

  for (const entry of entries) {
    if (exclusions.has(entry)) continue;
    const fullPath = join(dir, entry);
    let stats;
    try {
      stats = statSync(fullPath);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      count += countFilesRecursive(fullPath, exclusions);
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Detect if a directory contains TypeScript files or JavaScript files.
 */
function detectLanguage(sourcePath: string): 'typescript' | 'javascript' | 'mixed' {
  let hasTS = false;
  let hasJS = false;

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.next' || entry === 'build') {
        continue;
      }
      const fullPath = join(dir, entry);
      let stats;
      try {
        stats = statSync(fullPath);
      } catch {
        continue;
      }
      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        hasTS = true;
      } else if (entry.endsWith('.js') || entry.endsWith('.jsx')) {
        hasJS = true;
      }

      if (hasTS && hasJS) return; // early exit
    }
  }

  walk(sourcePath);

  if (hasTS && hasJS) return 'mixed';
  if (hasTS) return 'typescript';
  return 'javascript';
}

/**
 * Detect the framework, styling approach, language, and file count from a
 * source repository. Reads `package.json` to determine dependencies.
 *
 * @param sourcePath - Absolute or relative path to the repository root.
 * @returns RepositoryMetadata describing the project.
 */
export async function detectFramework(sourcePath: string): Promise<RepositoryMetadata> {
  const startTime = Date.now();
  const absPath = resolve(sourcePath);
  const pkgPath = join(absPath, 'package.json');

  let pkg: { name?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null = null;
  try {
    const raw = readFileSync(pkgPath, 'utf-8');
    pkg = JSON.parse(raw);
  } catch {
    // No package.json — will default to 'unknown'
  }

  const allDeps: Record<string, string> = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
  };

  const depNames = Object.keys(allDeps);
  const lowerDepNames = depNames.map((d) => d.toLowerCase());

  // --- Framework detection ---
  let framework: RepositoryMetadata['framework'] = 'unknown';

  if (lowerDepNames.includes('astro')) {
    framework = 'astro';
  } else if (lowerDepNames.includes('next')) {
    framework = 'react';
  } else if (lowerDepNames.includes('nuxt') || (lowerDepNames.includes('vue') && lowerDepNames.includes('nuxt'))) {
    framework = 'vue';
  } else if (lowerDepNames.includes('@sveltejs/kit')) {
    framework = 'svelte';
  } else if (lowerDepNames.includes('react')) {
    framework = 'react';
  } else if (lowerDepNames.includes('vue')) {
    framework = 'vue';
  }

  // --- Styling detection ---
  let stylingApproach: RepositoryMetadata['stylingApproach'] = 'css';
  const detectedStyles: string[] = [];

  if (lowerDepNames.includes('tailwindcss')) detectedStyles.push('tailwind');
  if (lowerDepNames.includes('styled-components') || lowerDepNames.includes('@emotion/styled')) {
    detectedStyles.push('styled-components');
  }
  if (lowerDepNames.includes('sass') || lowerDepNames.includes('node-sass')) detectedStyles.push('scss');

  if (detectedStyles.length > 1) {
    stylingApproach = 'mixed';
  } else if (detectedStyles.length === 1) {
    const style = detectedStyles[0];
    if (style === 'tailwind' || style === 'styled-components' || style === 'scss') {
      stylingApproach = style;
    }
  }

  // --- Language detection ---
  const language = detectLanguage(absPath);

  // --- File count ---
  const exclusions = new Set(['node_modules', '.git', 'dist', '.next', 'build', '.astro', '.svelte-kit']);
  const fileCount = countFilesRecursive(absPath, exclusions);

  // --- Name ---
  const name = pkg?.name ?? basename(absPath);

  const scanDurationMs = Date.now() - startTime;

  return {
    name,
    rootPath: absPath,
    framework,
    stylingApproach,
    language,
    fileCount,
    totalPages: 0,
    totalComponents: 0,
    analyzedAt: new Date().toISOString(),
    version: 'nexus-observer/1.0.0',
    scanDurationMs,
  };
}
