#!/usr/bin/env node
/**
 * Install opencode-beads as a local plugin
 *
 * Usage:
 *   npx opencode-beads-install          # Install to current project
 *   npx opencode-beads-install --global # Install globally
 *
 * Or from the package directory:
 *   npm run local:install
 *   npm run local:install -- --global
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { homedir } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Parse arguments
const args = process.argv.slice(2)
const isGlobal = args.includes('--global') || args.includes('-g')
const isDryRun = args.includes('--dry-run') || args.includes('-n')
const isHelp = args.includes('--help') || args.includes('-h')

if (isHelp) {
  console.log(`
opencode-beads Local Installer

Usage:
  npx opencode-beads-install [options]

Options:
  --global, -g    Install to global config (~/.config/opencode/)
  --dry-run, -n   Show what would be installed without making changes
  --help, -h      Show this help message

By default, installs to the current directory's .opencode/ folder.
`)
  process.exit(0)
}

// Determine source and target directories
const packageRoot = join(__dirname, '..')
const targetBase = isGlobal
  ? join(homedir(), '.config', 'opencode')
  : join(process.cwd(), '.opencode')

console.log(`opencode-beads Local Installer`)
console.log(`==============================`)
console.log(`Mode: ${isGlobal ? 'Global' : 'Project-local'}`)
console.log(`Target: ${targetBase}`)
if (isDryRun) console.log(`(Dry run - no changes will be made)`)
console.log('')

/**
 * Recursively copy a directory
 */
function copyDirRecursive(src: string, dest: string): number {
  let count = 0
  
  if (!isDryRun) {
    mkdirSync(dest, { recursive: true })
  }

  const entries = readdirSync(src)
  for (const entry of entries) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)

    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath)
    } else {
      if (!isDryRun) {
        copyFileSync(srcPath, destPath)
      }
      count++
    }
  }
  
  return count
}

/**
 * Copy a single file
 */
function copyFile(src: string, dest: string): boolean {
  if (!existsSync(src)) {
    console.warn(`  Warning: ${src} not found, skipping`)
    return false
  }
  
  if (!isDryRun) {
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(src, dest)
  }
  
  return true
}

// Installation targets
interface Target {
  src: string
  dest: string
  isDir?: boolean
  description: string
}

const targets: Target[] = [
  {
    src: join(packageRoot, 'dist', 'index.js'),
    dest: join(targetBase, 'plugin', 'beads.js'),
    description: 'Plugin entry point',
  },
  {
    src: join(packageRoot, 'tool'),
    dest: join(targetBase, 'tool'),
    isDir: true,
    description: 'Custom tools (bd-ready, bd-show, etc.)',
  },
  {
    src: join(packageRoot, 'command'),
    dest: join(targetBase, 'command'),
    isDir: true,
    description: 'Custom commands (/bd-ready, /bd-status, /bd-sync)',
  },
  {
    src: join(packageRoot, 'skill', 'beads'),
    dest: join(targetBase, 'skill', 'beads'),
    isDir: true,
    description: 'Beads skill with resources',
  },
]

console.log('Installing components:')
console.log('')

let totalFiles = 0
let errors = 0

for (const target of targets) {
  const srcPath = target.src
  const destPath = target.dest

  console.log(`  ${target.description}`)
  console.log(`    From: ${srcPath}`)
  console.log(`    To:   ${destPath}`)

  if (!existsSync(srcPath)) {
    console.warn(`    Warning: Source not found, skipping`)
    errors++
    continue
  }

  try {
    if (target.isDir) {
      const count = copyDirRecursive(srcPath, destPath)
      console.log(`    ${isDryRun ? 'Would copy' : 'Copied'} ${count} files`)
      totalFiles += count
    } else {
      if (copyFile(srcPath, destPath)) {
        console.log(`    ${isDryRun ? 'Would copy' : 'Copied'} 1 file`)
        totalFiles++
      }
    }
  } catch (error) {
    console.error(`    Error: ${error}`)
    errors++
  }
  
  console.log('')
}

// Summary
console.log('==============================')
if (isDryRun) {
  console.log(`Dry run complete. Would install ${totalFiles} files.`)
} else {
  console.log(`Installation complete! Installed ${totalFiles} files.`)
}

if (errors > 0) {
  console.log(`Warnings: ${errors} components skipped`)
}

console.log('')
console.log('Next steps:')
if (!isGlobal) {
  console.log('  1. The plugin is now available in your project')
  console.log('  2. Make sure bd (beads) CLI is installed: npm install -g @beads/bd')
  console.log('  3. Initialize beads in your project: bd init')
} else {
  console.log('  1. The plugin is now globally available')
  console.log('  2. Make sure bd (beads) CLI is installed: npm install -g @beads/bd')
}
console.log('')
