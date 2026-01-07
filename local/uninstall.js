#!/usr/bin/env node
/**
 * Uninstall opencode-beads local plugin
 *
 * Usage:
 *   npx opencode-beads-uninstall          # Uninstall from current project
 *   npx opencode-beads-uninstall --global # Uninstall from global config
 *
 * Or from the package directory:
 *   npm run local:uninstall
 *   npm run local:uninstall -- --global
 */

import { existsSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Parse arguments
const args = process.argv.slice(2)
const isGlobal = args.includes('--global') || args.includes('-g')
const isDryRun = args.includes('--dry-run') || args.includes('-n')
const isHelp = args.includes('--help') || args.includes('-h')

if (isHelp) {
  console.log(`
opencode-beads Local Uninstaller

Usage:
  npx opencode-beads-uninstall [options]

Options:
  --global, -g    Uninstall from global config (~/.config/opencode/)
  --dry-run, -n   Show what would be removed without making changes
  --help, -h      Show this help message

By default, uninstalls from the current directory's .opencode/ folder.

Note: This does NOT remove beads data (.beads/) or AGENTS.md.
      Remove those manually if desired.
`)
  process.exit(0)
}

// Determine target directory
const targetBase = isGlobal
  ? join(homedir(), '.config', 'opencode')
  : join(process.cwd(), '.opencode')

console.log(`opencode-beads Local Uninstaller`)
console.log(`================================`)
console.log(`Mode: ${isGlobal ? 'Global' : 'Project-local'}`)
console.log(`Target: ${targetBase}`)
if (isDryRun) console.log(`(Dry run - no changes will be made)`)
console.log('')

/**
 * Remove a file or directory if it exists
 * Returns true if removed, false if not found
 */
function remove(path, description) {
  console.log(`  ${description}`)
  console.log(`    Path: ${path}`)

  if (!existsSync(path)) {
    console.log(`    Not found, skipping`)
    console.log('')
    return false
  }

  if (!isDryRun) {
    rmSync(path, { recursive: true, force: true })
  }

  console.log(`    ${isDryRun ? 'Would remove' : 'Removed'}`)
  console.log('')
  return true
}

/**
 * Check if a directory is empty
 */
function isDirEmpty(path) {
  if (!existsSync(path)) return true
  const entries = readdirSync(path)
  return entries.length === 0
}

/**
 * Remove directory if empty
 */
function removeIfEmpty(path, description) {
  if (!existsSync(path)) return false

  if (isDirEmpty(path)) {
    console.log(`  ${description}`)
    console.log(`    Path: ${path}`)
    if (!isDryRun) {
      rmSync(path, { recursive: true })
    }
    console.log(`    ${isDryRun ? 'Would remove' : 'Removed'} (empty directory)`)
    console.log('')
    return true
  }
  return false
}

// Files and directories to remove
const targets = [
  {
    path: join(targetBase, 'plugin', 'beads.js'),
    description: 'Plugin wrapper',
  },
  {
    path: join(targetBase, 'plugin', 'opencode-beads'),
    description: 'Plugin directory (compiled JS + package.json)',
  },
  {
    path: join(targetBase, 'skill', 'beads'),
    description: 'Beads skill',
  },
]

// Tool files installed by the plugin
const toolFiles = [
  'bd-close.ts',
  'bd-create.ts',
  'bd-dep.ts',
  'bd-ready.ts',
  'bd-show.ts',
  'bd-sync.ts',
  'bd-update.ts',
]

for (const toolFile of toolFiles) {
  targets.push({
    path: join(targetBase, 'tool', toolFile),
    description: `Tool: ${toolFile}`,
  })
}

// Command files installed by the plugin
const commandFiles = ['bd-ready.md', 'bd-status.md', 'bd-sync.md']

for (const cmdFile of commandFiles) {
  targets.push({
    path: join(targetBase, 'command', cmdFile),
    description: `Command: ${cmdFile}`,
  })
}

console.log('Removing components:')
console.log('')

let removed = 0
let notFound = 0

for (const target of targets) {
  if (remove(target.path, target.description)) {
    removed++
  } else {
    notFound++
  }
}

// Clean up empty directories
console.log('Cleaning up empty directories:')
console.log('')

const dirsToClean = [
  { path: join(targetBase, 'plugin'), description: 'Plugin directory' },
  { path: join(targetBase, 'tool'), description: 'Tool directory' },
  { path: join(targetBase, 'command'), description: 'Command directory' },
  { path: join(targetBase, 'skill'), description: 'Skill directory' },
]

for (const dir of dirsToClean) {
  if (removeIfEmpty(dir.path, dir.description)) {
    removed++
  }
}

// Check if .opencode/package.json should be removed
// Only remove if no other plugins remain
const packageJsonPath = join(targetBase, 'package.json')
if (existsSync(packageJsonPath)) {
  const pluginDir = join(targetBase, 'plugin')
  if (!existsSync(pluginDir) || isDirEmpty(pluginDir)) {
    if (remove(packageJsonPath, 'Dependencies package.json (no other plugins)')) {
      removed++
    }
  } else {
    console.log('  Dependencies package.json')
    console.log(`    Path: ${packageJsonPath}`)
    console.log('    Kept (other plugins may need it)')
    console.log('')
  }
}

// Summary
console.log('================================')
if (isDryRun) {
  console.log(`Dry run complete. Would remove ${removed} items.`)
} else {
  console.log(`Uninstallation complete! Removed ${removed} items.`)
}

if (notFound > 0) {
  console.log(`Skipped: ${notFound} items not found`)
}

console.log('')
console.log('Note: The following were NOT removed:')
console.log('  - .beads/ directory (issue tracking data)')
console.log('  - AGENTS.md (project instructions)')
console.log('')
console.log('Remove these manually if you want to fully remove beads:')
console.log('  rm -rf .beads/')
console.log('  rm AGENTS.md')
console.log('')
