import { describe, it, expect } from 'vitest'
import type { BunShell } from '../src/utils/bd.js'
import {
  isBdInstalled,
  getBdPrimeContext,
  getReadyWork,
  getInProgressWork,
  syncFlushOnly,
  checkHooksStatus,
} from '../src/utils/bd.js'

/**
 * Mock BunShellOutput result
 */
function createMockResult(exitCode: number, stdout: string, stderr: string) {
  return {
    exitCode,
    stdout: Buffer.from(stdout),
    stderr: Buffer.from(stderr),
    text: () => stdout,
    json: () => JSON.parse(stdout || '{}'),
    arrayBuffer: () => new TextEncoder().encode(stdout).buffer,
    bytes: () => new TextEncoder().encode(stdout),
    blob: () => new Blob([stdout]),
  }
}

/**
 * Mock shell executor factory that simulates the BunShell API
 * The chain is: $`cmd`.quiet().nothrow() -> Promise<BunShellOutput>
 *
 * Patterns are matched against the full command string. Since findBdPath()
 * may return a full path (e.g., /Users/user/go/bin/bd), patterns should
 * match the subcommand part (e.g., 'prime', 'ready', '--version').
 */
function createMock$(
  responses: Record<string, { exitCode: number; stdout?: string; stderr?: string }>
): BunShell {
  return ((strings: TemplateStringsArray, ...values: unknown[]) => {
    // Reconstruct the full command by interleaving strings and values
    let cmd = strings[0]
    for (let i = 0; i < values.length; i++) {
      cmd += String(values[i]) + strings[i + 1]
    }

    // Find matching response - match against the command subparts
    // This handles both 'bd prime' and '/path/to/bd prime'
    let response = { exitCode: 1, stdout: '', stderr: 'command not found' }
    for (const [pattern, resp] of Object.entries(responses)) {
      // Extract the subcommand part (e.g., 'prime' from 'bd prime' or '--version' from 'bd --version')
      const patternParts = pattern.split(' ')
      const subcommand = patternParts.length > 1 ? patternParts.slice(1).join(' ') : patternParts[0]

      // Check if the command contains the subcommand
      if (cmd.includes(subcommand) || cmd.includes(pattern)) {
        response = { exitCode: resp.exitCode, stdout: resp.stdout || '', stderr: resp.stderr || '' }
        break
      }
    }

    const mockResult = createMockResult(response.exitCode, response.stdout, response.stderr)

    // Create a chainable promise-like object
    const createChainable = () => {
      const promise = Promise.resolve(mockResult)
      return Object.assign(promise, {
        quiet: () => createChainable(),
        nothrow: () => createChainable(),
        text: () => Promise.resolve(response.stdout),
        json: () => Promise.resolve(JSON.parse(response.stdout || '{}')),
      })
    }

    return createChainable()
  }) as unknown as BunShell
}

describe('bd utilities', () => {
  describe('isBdInstalled', () => {
    it('should return true when bd is installed', async () => {
      const $ = createMock$({
        'bd --version': { exitCode: 0, stdout: 'bd version 0.44.0' },
      })

      const result = await isBdInstalled($)
      expect(result).toBe(true)
    })

    it('should return false when bd is not installed', async () => {
      const $ = createMock$({
        'bd --version': { exitCode: 1, stderr: 'command not found' },
      })

      const result = await isBdInstalled($)
      expect(result).toBe(false)
    })
  })

  describe('getBdPrimeContext', () => {
    it('should return context when bd prime succeeds', async () => {
      const expectedContext = '# Beads Workflow Context\n...'
      const $ = createMock$({
        'bd prime': { exitCode: 0, stdout: expectedContext },
      })

      const result = await getBdPrimeContext($)
      expect(result).toBe(expectedContext)
    })

    it('should return null when bd prime fails', async () => {
      const $ = createMock$({
        'bd prime': { exitCode: 1 },
      })

      const result = await getBdPrimeContext($)
      expect(result).toBeNull()
    })
  })

  describe('getReadyWork', () => {
    it('should return ready work JSON', async () => {
      const expectedWork = '[{"id": "bd-123", "title": "Test"}]'
      const $ = createMock$({
        'bd ready': { exitCode: 0, stdout: expectedWork },
      })

      const result = await getReadyWork($, 5)
      expect(result).toBe(expectedWork)
    })

    it('should return null when no ready work', async () => {
      const $ = createMock$({
        'bd ready': { exitCode: 1 },
      })

      const result = await getReadyWork($, 5)
      expect(result).toBeNull()
    })
  })

  describe('getInProgressWork', () => {
    it('should return in-progress work JSON', async () => {
      const expectedWork = '[{"id": "bd-456", "title": "In Progress"}]'
      const $ = createMock$({
        'bd list': { exitCode: 0, stdout: expectedWork },
      })

      const result = await getInProgressWork($)
      expect(result).toBe(expectedWork)
    })
  })

  describe('syncFlushOnly', () => {
    it('should return true when sync succeeds', async () => {
      const $ = createMock$({
        'bd sync': { exitCode: 0 },
      })

      const result = await syncFlushOnly($)
      expect(result).toBe(true)
    })

    it('should return false when sync fails', async () => {
      const $ = createMock$({
        'bd sync': { exitCode: 1 },
      })

      const result = await syncFlushOnly($)
      expect(result).toBe(false)
    })
  })

  describe('checkHooksStatus', () => {
    it('should parse hooks status correctly', async () => {
      const $ = createMock$({
        'bd hooks list': {
          exitCode: 0,
          stdout: JSON.stringify({
            hooks: [
              { Name: 'pre-commit', Installed: true, Outdated: false },
              { Name: 'post-merge', Installed: true, Outdated: true },
            ],
          }),
        },
      })

      const result = await checkHooksStatus($)
      expect(result.installed).toBe(true)
      expect(result.outdated).toBe(true)
    })

    it('should handle missing hooks', async () => {
      const $ = createMock$({
        'bd hooks list': { exitCode: 1 },
      })

      const result = await checkHooksStatus($)
      expect(result.installed).toBe(false)
      expect(result.outdated).toBe(false)
    })
  })
})
