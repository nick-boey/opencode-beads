/**
 * opencode-beads - Beads issue tracker integration for OpenCode
 *
 * Provides persistent task memory for AI agents across sessions.
 * Mirrors the Claude Code integration from the beads project.
 */

import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin'
import { appendFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { loadConfig } from './config.js'
import {
  isBdInstalled,
  isBeadsProject,
  getBdPrimeContext,
  getReadyWork,
  getInProgressWork,
  checkHooksStatus,
} from './utils/bd.js'
import { installSkillIfNeeded } from './utils/skill-installer.js'
import { VERSION, NAME } from './version.js'

export type { BeadsConfig } from './config.js'
export { loadConfig } from './config.js'
export { VERSION, NAME }

/**
 * Plugin state - cached between hook invocations
 */
interface PluginState {
  initialized: boolean
  bdInstalled: boolean
  isBeadsProject: boolean
  primeContextInjected: boolean
}

// Global state for the plugin instance
let pluginState: PluginState = {
  initialized: false,
  bdInstalled: false,
  isBeadsProject: false,
  primeContextInjected: false,
}

/**
 * Helper to create a timeout promise
 */
function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

/**
 * Helper to run a promise with a timeout (non-blocking, fire-and-forget style)
 * Returns immediately if the promise takes too long
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  try {
    return await Promise.race([promise, timeout(ms)])
  } catch {
    return undefined
  }
}

/**
 * Helper to show toast notifications (non-blocking with 1s timeout)
 */
function showToast(
  client: PluginInput['client'],
  variant: 'info' | 'warning' | 'error' | 'success',
  message: string
): void {
  // Fire and forget - don't await, just let it run with a timeout
  withTimeout(
    client.tui.showToast({
      body: { variant, message },
    }),
    1000
  ).catch(() => {
    // Ignore errors
  })
}

/**
 * Get the log file path (~/.opencode-beads/log.txt)
 */
function getLogFilePath(): string {
  return join(homedir(), '.opencode-beads', 'log.txt')
}

/**
 * Ensure log directory exists and append message to log file
 */
function appendToLogFile(message: string): void {
  try {
    const logDir = join(homedir(), '.opencode-beads')
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
    const timestamp = new Date().toISOString()
    appendFileSync(getLogFilePath(), `${timestamp} ${message}\n`)
  } catch {
    // Silently ignore file logging errors
  }
}

/**
 * Helper to log messages (non-blocking with 1s timeout)
 * Also logs to ~/.opencode-beads/log.txt for debugging
 */
function log(
  client: PluginInput['client'],
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  extra?: Record<string, unknown>
): void {
  // Log to file for debugging
  const extraStr = extra ? ` ${JSON.stringify(extra)}` : ''
  appendToLogFile(`[${level.toUpperCase()}] ${message}${extraStr}`)

  // Fire and forget SDK log - don't await, just let it run with a timeout
  withTimeout(
    client.app.log({
      body: { service: NAME, level, message, extra },
    }),
    1000
  ).catch(() => {
    // Ignore errors
  })
}

/**
 * Main plugin export
 */
export const BeadsPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  const { $, directory, client, project } = input

  // Load configuration
  const config = loadConfig(project)

  // Log initialization (non-blocking)
  // log(client, 'info', `Initializing ${NAME} v${VERSION}`, { directory })

  // Check if bd CLI is installed
  const bdInstalled = await isBdInstalled($)

  if (!bdInstalled) {
    if (config.warnings.showNotInstalled) {
      showToast(client, 'warning', 'Beads (bd) CLI not installed. Run: npm install -g @beads/bd')
    }
    log(client, 'warn', 'bd CLI not installed, plugin disabled')
    pluginState = {
      initialized: true,
      bdInstalled: false,
      isBeadsProject: false,
      primeContextInjected: false,
    }
    return {}
  }

  // Check if this is a beads project
  const beadsProject = isBeadsProject(directory)

  if (!beadsProject) {
    if (config.warnings.showNotInitialized) {
      showToast(client, 'info', 'Beads not initialized in this project. Run: bd init')
    }
    log(client, 'info', 'Not a beads project (.beads/ not found), plugin disabled')
    pluginState = {
      initialized: true,
      bdInstalled: true,
      isBeadsProject: false,
      primeContextInjected: false,
    }
    return {}
  }

  // Check hooks status
  const hooksStatus = await checkHooksStatus($)
  if (hooksStatus.outdated && config.warnings.showHooksOutdated) {
    showToast(client, 'info', 'Beads git hooks are outdated. Run: bd hooks install')
  }

  // Auto-install skill if not present
  const skillInstalled = installSkillIfNeeded(directory)
  if (skillInstalled) {
    log(client, 'info', 'Installed beads skill to .opencode/skill/beads/')
  }

  log(client, 'info', 'Plugin initialized successfully', {
    hooksInstalled: hooksStatus.installed,
    skillInstalled,
  })

  // Update plugin state
  pluginState = {
    initialized: true,
    bdInstalled: true,
    isBeadsProject: true,
    primeContextInjected: false,
  }

  // Return hooks
  return {
    /**
     * Transform system prompt to include bd prime context
     * This is the equivalent of Claude Code's SessionStart hook
     * Runs on every chat turn, so we track if we've already injected
     */
    'experimental.chat.system.transform': async (_input, output): Promise<void> => {
      // Only inject once per session (on first message)
      if (pluginState.primeContextInjected) return
      if (!config.contextInjection.onSessionStart) return

      const primeContext = await getBdPrimeContext($)
      if (primeContext) {
        output.system.push(primeContext)
        pluginState.primeContextInjected = true
        log(client, 'debug', 'Injected bd prime context into system prompt')
      }
    },

    /**
     * Add beads state to compaction context
     * This ensures issue state persists across compaction
     * Equivalent to Claude Code's PreCompact hook
     */
    'experimental.session.compacting': async (_input, output): Promise<void> => {
      const parts: string[] = []

      // Always include bd prime context during compaction
      if (config.contextInjection.onCompaction) {
        const primeContext = await getBdPrimeContext($)
        if (primeContext) {
          parts.push(primeContext)
        }
      }

      if (config.contextInjection.includeInProgress) {
        const inProgress = await getInProgressWork($)
        if (inProgress) {
          parts.push(`### Work In Progress\n\`\`\`json\n${inProgress}\n\`\`\``)
        }
      }

      if (config.contextInjection.includeReadyWork) {
        const ready = await getReadyWork($, config.contextInjection.readyWorkLimit)
        if (ready) {
          parts.push(`### Ready Work (Unblocked)\n\`\`\`json\n${ready}\n\`\`\``)
        }
      }

      if (parts.length > 0) {
        output.context.push(`## Beads Issue Tracker State

${parts.join('\n\n')}

**Session Close Protocol:**
- Run \`bd sync\` before ending session
- Track strategic work in beads (multi-session, dependencies)
- Use TodoWrite for simple single-session tasks`)

        log(client, 'debug', 'Added beads state to compaction context')

        // Reset the prime context injection flag so it gets re-injected after compaction
        pluginState.primeContextInjected = false
      }
    },
  }
}

// Default export for plugin loading
export default BeadsPlugin
