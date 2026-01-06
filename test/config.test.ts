import { describe, it, expect } from 'vitest'
import { loadConfig, BeadsConfigSchema, defaultConfig } from '../src/config.js'

describe('config', () => {
  describe('BeadsConfigSchema', () => {
    it('should provide sensible defaults', () => {
      const config = BeadsConfigSchema.parse({})

      expect(config.autoSyncOnIdle).toBe(true)
      expect(config.contextInjection.onSessionStart).toBe(true)
      expect(config.contextInjection.onCompaction).toBe(true)
      expect(config.contextInjection.includeReadyWork).toBe(true)
      expect(config.contextInjection.includeInProgress).toBe(true)
      expect(config.contextInjection.readyWorkLimit).toBe(5)
      expect(config.warnings.showNotInstalled).toBe(true)
      expect(config.warnings.showNotInitialized).toBe(true)
      expect(config.warnings.showHooksOutdated).toBe(true)
    })

    it('should allow overriding defaults', () => {
      const config = BeadsConfigSchema.parse({
        autoSyncOnIdle: false,
        contextInjection: {
          onSessionStart: false,
          readyWorkLimit: 10,
        },
        warnings: {
          showNotInstalled: false,
        },
      })

      expect(config.autoSyncOnIdle).toBe(false)
      expect(config.contextInjection.onSessionStart).toBe(false)
      expect(config.contextInjection.readyWorkLimit).toBe(10)
      // Non-overridden values should still be defaults
      expect(config.contextInjection.onCompaction).toBe(true)
      expect(config.warnings.showNotInstalled).toBe(false)
      expect(config.warnings.showNotInitialized).toBe(true)
    })

    it('should validate readyWorkLimit bounds', () => {
      expect(() =>
        BeadsConfigSchema.parse({
          contextInjection: { readyWorkLimit: 0 },
        })
      ).toThrow()

      expect(() =>
        BeadsConfigSchema.parse({
          contextInjection: { readyWorkLimit: 21 },
        })
      ).toThrow()

      const validConfig = BeadsConfigSchema.parse({
        contextInjection: { readyWorkLimit: 20 },
      })
      expect(validConfig.contextInjection.readyWorkLimit).toBe(20)
    })
  })

  describe('loadConfig', () => {
    it('should extract beads config from project config', () => {
      const projectConfig = {
        beads: {
          autoSyncOnIdle: false,
        },
      }

      const config = loadConfig(projectConfig)
      expect(config.autoSyncOnIdle).toBe(false)
    })

    it('should return defaults when no beads config present', () => {
      const config = loadConfig({})
      expect(config).toEqual(defaultConfig)
    })

    it('should return defaults when project config is null', () => {
      const config = loadConfig(null)
      expect(config).toEqual(defaultConfig)
    })

    it('should return defaults when project config is undefined', () => {
      const config = loadConfig(undefined)
      expect(config).toEqual(defaultConfig)
    })
  })

  describe('defaultConfig', () => {
    it('should match schema defaults', () => {
      const schemaDefaults = BeadsConfigSchema.parse({})
      expect(defaultConfig).toEqual(schemaDefaults)
    })
  })
})
