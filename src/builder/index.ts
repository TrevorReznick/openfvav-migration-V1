import type { ApplicationDefinition } from '../shared/types/definitions.js';

/**
 * Configuration options for the build stage.
 */
export interface BuildOptions {
  /** Directory where output files will be written. */
  outputDir: string;
  /** If true, perform a dry run without writing files to disk. */
  dryRun?: boolean;
  /** Limit the build to a specific artifact type. */
  only?: 'tokens' | 'pages' | 'widgets' | 'config';
}

/**
 * Summary of the build operation result.
 */
export interface BuildResult {
  /** Number of files actually written to disk. */
  filesWritten: number;
  /** Number of files skipped (e.g. dry run or unchanged). */
  filesSkipped: number;
  /** Wall-clock duration of the build in milliseconds. */
  durationMs: number;
  /** Absolute path to the output directory. */
  outputPath: string;
}

/**
 * Builds a runnable web application from an ApplicationDefinition.
 * The final stage of the Nexus pipeline — produces actual source files.
 *
 * @param definition - The application definition to build.
 * @param options - Build configuration.
 * @returns Build results summary.
 */
export async function build(
  definition: ApplicationDefinition,
  options: BuildOptions
): Promise<BuildResult> {
  throw new Error('Not implemented: build');
}
