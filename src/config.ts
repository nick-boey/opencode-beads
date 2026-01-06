import { z } from 'zod'

/**
 * Configuration schema for the opencode-beads plugin
 */
export const BeadsConfigSchema = z.object({
  /** Run bd sync --flush-only on session idle */
  autoSyncOnIdle: z.boolean().default(true),

  /** Context injection settings */
  contextInjection: z
    .object({
      /** Inject bd prime context on session start */
      onSessionStart: z.boolean().default(true),
      /** Re-inject bd prime context after compaction */
      onCompaction: z.boolean().default(true),
      /** Include ready work in compaction context */
      includeReadyWork: z.boolean().default(true),
      /** Include in-progress work in compaction context */
      includeInProgress: z.boolean().default(true),
      /** Maximum number of ready issues to include */
      readyWorkLimit: z.number().min(1).max(20).default(5),
    })
    .default({}),

  /** Warning display settings */
  warnings: z
    .object({
      /** Show warning when bd CLI is not installed */
      showNotInstalled: z.boolean().default(true),
      /** Show info when project is not initialized with beads */
      showNotInitialized: z.boolean().default(true),
      /** Show warning when git hooks are outdated */
      showHooksOutdated: z.boolean().default(true),
    })
    .default({}),
})

export type BeadsConfig = z.infer<typeof BeadsConfigSchema>

/**
 * Load and validate configuration from project config
 */
export function loadConfig(projectConfig: unknown): BeadsConfig {
  // Extract beads config from project config if present
  const raw = (projectConfig as Record<string, unknown>)?.beads ?? {}
  return BeadsConfigSchema.parse(raw)
}

/**
 * Default configuration
 */
export const defaultConfig: BeadsConfig = BeadsConfigSchema.parse({})
