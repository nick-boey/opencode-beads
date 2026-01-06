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
function copyDirRecursive(src, dest) {
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
function copyFile(src, dest) {
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

/**
 * Write a file with content
 */
function writeFile(dest, content, description) {
  console.log(`  ${description}`)
  console.log(`    To: ${dest}`)
  
  if (!isDryRun) {
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, content)
  }
  
  console.log(`    ${isDryRun ? 'Would create' : 'Created'} 1 file`)
  console.log('')
  return 1
}

// Installation targets
// Structure mirrors the package: opencode-beads/dist/ and opencode-beads/package.json
// This is needed because version.js uses require('../package.json')
const targets = [
  {
    src: join(packageRoot, 'dist'),
    dest: join(targetBase, 'plugin', 'opencode-beads', 'dist'),
    isDir: true,
    description: 'Plugin (compiled JS files)',
  },
  {
    src: join(packageRoot, 'package.json'),
    dest: join(targetBase, 'plugin', 'opencode-beads', 'package.json'),
    description: 'Plugin package.json (for version info)',
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

// Create the wrapper plugin file that OpenCode will auto-load
const wrapperContent = `/**
 * opencode-beads plugin wrapper
 * This file re-exports the plugin from the opencode-beads subdirectory.
 * OpenCode auto-loads all .js files in .opencode/plugin/
 */
export { BeadsPlugin, BeadsPlugin as default } from './opencode-beads/dist/index.js'
`

totalFiles += writeFile(
  join(targetBase, 'plugin', 'beads.js'),
  wrapperContent,
  'Plugin wrapper (auto-loaded by OpenCode)'
)

// Create .opencode/package.json for external dependencies
const packageJsonContent = JSON.stringify({
  "name": "opencode-local-plugins",
  "private": true,
  "type": "module",
  "dependencies": {
    "@opencode-ai/plugin": "^1.1.3",
    "zod": "^3.24.2"
  }
}, null, 2) + '\n'

totalFiles += writeFile(
  join(targetBase, 'package.json'),
  packageJsonContent,
  'Dependencies package.json (for external packages)'
)

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
console.log('')
console.log('  1. OpenCode will auto-load the plugin from .opencode/plugin/beads.js')
console.log('     No configuration needed in opencode.json!')
console.log('')
console.log('  2. Make sure bd (beads) CLI is installed:')
console.log('     npm install -g @beads/bd')
console.log('')
if (!isGlobal) {
  console.log('  3. Initialize beads in your project (if not already):')
  console.log('     bd init')
  console.log('')
}
console.log('  4. Restart OpenCode to load the plugin.')
console.log('     The plugin will inject beads workflow context into your sessions.')
console.log('')
