import { tool } from '@opencode-ai/plugin'
import { findBdPath, outputToString } from './bd-path.js'

export default tool({
  description:
    'Manage dependencies between beads issues. Dependencies control the ready work queue - issues with open blockers are hidden from bd ready.',
  args: {
    action: tool.schema
      .enum(['add', 'remove', 'tree'])
      .describe('Action: add/remove dependency, or show dependency tree'),
    issue: tool.schema.string().describe('Issue ID'),
    dependsOn: tool.schema
      .string()
      .optional()
      .describe(
        'Issue that must complete first. For "add": issue depends on dependsOn. IMPORTANT: "bd dep add A B" means A depends on B (B blocks A).'
      ),
    type: tool.schema
      .enum(['blocks', 'related', 'parent-child', 'discovered-from', 'waits-for'])
      .optional()
      .default('blocks')
      .describe(
        'Dependency type. blocks=hard dependency, related=soft link, parent-child=hierarchy, discovered-from=audit trail'
      ),
  },
  async execute(args) {
    const bd = findBdPath()

    if (args.action === 'tree') {
      const result = await Bun.$`${bd} dep tree ${args.issue}`.nothrow()
      if (result.exitCode !== 0) {
        return `Error: ${outputToString(result.stderr) || `Failed to show dependency tree for ${args.issue}`}`
      }
      return outputToString(result.stdout)
    }

    if (!args.dependsOn) {
      return 'Error: dependsOn is required for add/remove actions'
    }

    const cmdArgs = [args.action, args.issue, args.dependsOn]
    if (args.type) cmdArgs.push(`--type=${args.type}`)

    const result = await Bun.$`${bd} dep ${cmdArgs.join(' ')}`.nothrow()

    if (result.exitCode !== 0) {
      return `Error: ${outputToString(result.stderr) || 'Failed to update dependency'}`
    }

    return (
      outputToString(result.stdout) || `Dependency ${args.action === 'add' ? 'added' : 'removed'}`
    )
  },
})
