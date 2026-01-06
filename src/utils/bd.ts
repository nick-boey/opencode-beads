/**
 * Utilities for interacting with the bd (beads) CLI
 */

import { existsSync } from 'fs'
import { join } from 'path'
import type { PluginInput } from '@opencode-ai/plugin'

// Extract the shell type from PluginInput
export type BunShell = PluginInput['$']

/**
 * Safely convert shell output to string
 * Handles both string and Buffer outputs (Buffer can occur on Windows/PowerShell)
 */
function outputToString(output: unknown): string {
  if (typeof output === 'string') {
    return output
  }
  if (Buffer.isBuffer(output)) {
    return output.toString('utf-8')
  }
  if (output && typeof output === 'object' && 'toString' in output) {
    return String(output)
  }
  return ''
}

/**
 * Check if bd CLI is installed and available
 */
export async function isBdInstalled($: BunShell): Promise<boolean> {
  try {
    const result = await $`bd --version`.quiet().nothrow()
    return result.exitCode === 0
  } catch {
    return false
  }
}

/**
 * Check if the current directory is a beads project (has .beads directory)
 */
export function isBeadsProject(directory: string): boolean {
  try {
    return existsSync(join(directory, '.beads'))
  } catch {
    return false
  }
}

/**
 * Get bd prime context for injection
 */
export async function getBdPrimeContext($: BunShell): Promise<string | null> {
  try {
    const result = await $`bd prime --full`.quiet().nothrow()
    if (result.exitCode !== 0) return null
    // Use stdout directly and convert to string to avoid Buffer issues on Windows
    const text = outputToString(result.stdout)
    return text.trim() || null
  } catch {
    return null
  }
}

/**
 * Get ready work for context
 */
export async function getReadyWork($: BunShell, limit: number): Promise<string | null> {
  try {
    const result = await $`bd ready --limit ${limit} --json`.quiet().nothrow()
    if (result.exitCode !== 0) return null
    const text = outputToString(result.stdout)
    return text.trim() || null
  } catch {
    return null
  }
}

/**
 * Get in-progress work for context
 */
export async function getInProgressWork($: BunShell): Promise<string | null> {
  try {
    const result = await $`bd list --status in_progress --json`.quiet().nothrow()
    if (result.exitCode !== 0) return null
    const text = outputToString(result.stdout)
    return text.trim() || null
  } catch {
    return null
  }
}

/**
 * Run bd sync with flush-only mode
 */
export async function syncFlushOnly($: BunShell): Promise<boolean> {
  try {
    const result = await $`bd sync --flush-only`.quiet().nothrow()
    return result.exitCode === 0
  } catch {
    return false
  }
}

/**
 * Check if git hooks are installed and up to date
 */
export async function checkHooksStatus(
  $: BunShell
): Promise<{ installed: boolean; outdated: boolean }> {
  try {
    const result = await $`bd hooks list --json`.quiet().nothrow()
    if (result.exitCode !== 0) {
      return { installed: false, outdated: false }
    }

    // Parse JSON from stdout, handling Buffer on Windows
    const text = outputToString(result.stdout)
    const data = JSON.parse(text)
    const hooks = data.hooks || []

    const installed = hooks.some((h: { Installed: boolean }) => h.Installed)
    const outdated = hooks.some((h: { Outdated: boolean }) => h.Outdated)

    return { installed, outdated }
  } catch {
    return { installed: false, outdated: false }
  }
}
