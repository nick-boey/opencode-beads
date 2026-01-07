import { tool } from '@opencode-ai/plugin'
import { findBdPath, outputToString } from './bd-path.js'

export default tool({
  description:
    'Find beads issues ready to work on (no blockers). Returns unblocked issues sorted by priority. Use this to find your next task.',
  args: {
    limit: tool.schema.number().optional().describe('Maximum issues to return (default: 10)'),
    priority: tool.schema
      .number()
      .min(0)
      .max(4)
      .optional()
      .describe('Filter by priority (0=critical, 1=high, 2=medium, 3=low, 4=backlog)'),
    type: tool.schema
      .enum(['bug', 'feature', 'task', 'epic', 'chore'])
      .optional()
      .describe('Filter by issue type'),
    assignee: tool.schema.string().optional().describe('Filter by assignee username'),
    includeDeferred: tool.schema
      .boolean()
      .optional()
      .describe('Include issues deferred to the future'),
  },
  async execute(args) {
    const bd = findBdPath()
    const cmdArgs: string[] = []

    if (args.limit) cmdArgs.push(`--limit=${args.limit}`)
    if (args.priority !== undefined) cmdArgs.push(`--priority=${args.priority}`)
    if (args.type) cmdArgs.push(`--type=${args.type}`)
    if (args.assignee) cmdArgs.push(`--assignee=${args.assignee}`)
    if (args.includeDeferred) cmdArgs.push('--include-deferred')
    cmdArgs.push('--json')

    const result = await Bun.$`${bd} ready ${cmdArgs.join(' ')}`.nothrow()

    if (result.exitCode !== 0) {
      return `Error: ${outputToString(result.stderr) || 'Failed to get ready work. Is bd installed and project initialized?'}`
    }

    return outputToString(result.stdout) || 'No issues ready to work on.'
  },
})
