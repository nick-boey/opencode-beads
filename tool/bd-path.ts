/**
 * Utility to find the bd executable path
 * Used by custom tools to locate bd when it's not in PATH
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

/**
 * Cached path to the bd executable (resolved once on first use)
 */
let cachedBdPath: string | null = null

/**
 * Common locations where bd might be installed
 */
function getBdSearchPaths(): string[] {
  const home = homedir()
  const isWindows = process.platform === 'win32'
  const ext = isWindows ? '.exe' : ''

  return [
    // Go bin directory (common for Go-based tools like bd)
    join(home, 'go', 'bin', `bd${ext}`),
    // Homebrew on macOS (Intel)
    '/usr/local/bin/bd',
    // Homebrew on macOS (Apple Silicon)
    '/opt/homebrew/bin/bd',
    // Linux standard locations
    '/usr/bin/bd',
    '/usr/local/bin/bd',
    // npm global bin (varies by platform)
    ...(isWindows
      ? [join(process.env.APPDATA || '', 'npm', `bd${ext}`)]
      : [join(home, '.npm-global', 'bin', 'bd'), '/usr/local/bin/bd']),
    // Cargo bin (in case it's a Rust tool)
    join(home, '.cargo', 'bin', `bd${ext}`),
  ]
}

/**
 * Find the bd executable path
 * Returns the full path if found in a known location, or 'bd' to use PATH
 */
export function findBdPath(): string {
  if (cachedBdPath !== null) {
    return cachedBdPath
  }

  // Check common installation locations
  for (const path of getBdSearchPaths()) {
    if (existsSync(path)) {
      cachedBdPath = path
      return path
    }
  }

  // Fall back to just 'bd' and hope it's in PATH
  cachedBdPath = 'bd'
  return 'bd'
}

/**
 * Get the bd command to use (full path or just 'bd')
 */
export function getBdCommand(): string {
  return findBdPath()
}

/**
 * Safely convert shell output to string
 * Handles both string and Buffer outputs (Buffer can occur on Windows)
 */
export function outputToString(output: unknown): string {
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
