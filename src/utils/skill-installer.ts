/**
 * Auto-install beads skill to .opencode/skill/beads/
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * Get the path to the bundled skill directory
 */
function getBundledSkillPath(): string {
  // When running as a package, skill/ is in the package root
  // __dirname equivalent for ESM
  const currentFile = fileURLToPath(import.meta.url)
  const srcDir = dirname(currentFile) // src/utils
  const packageRoot = join(srcDir, '..', '..') // packages/opencode-beads
  return join(packageRoot, 'skill', 'beads')
}

/**
 * Recursively copy a directory
 */
function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true })

  const entries = readdirSync(src)
  for (const entry of entries) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)

    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * Install the beads skill to the target directory if not already present
 *
 * @param projectDir - Project directory (where .opencode/ should be)
 * @returns true if installed, false if already exists
 */
export function installSkillIfNeeded(projectDir: string): boolean {
  const targetSkillDir = join(projectDir, '.opencode', 'skill', 'beads')
  const targetSkillFile = join(targetSkillDir, 'SKILL.md')

  // Skip if skill already exists
  if (existsSync(targetSkillFile)) {
    return false
  }

  const bundledSkillDir = getBundledSkillPath()

  // Skip if bundled skill doesn't exist (development mode)
  if (!existsSync(bundledSkillDir)) {
    console.warn('[opencode-beads] Bundled skill not found, skipping auto-install')
    return false
  }

  // Copy the skill directory
  try {
    copyDirRecursive(bundledSkillDir, targetSkillDir)
    return true
  } catch (error) {
    console.warn('[opencode-beads] Failed to install skill:', error)
    return false
  }
}

/**
 * Check if the beads skill is installed
 */
export function isSkillInstalled(projectDir: string): boolean {
  const targetSkillFile = join(projectDir, '.opencode', 'skill', 'beads', 'SKILL.md')
  return existsSync(targetSkillFile)
}
