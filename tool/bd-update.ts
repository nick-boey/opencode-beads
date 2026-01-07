import { tool } from '@opencode-ai/plugin'
import { findBdPath, outputToString } from './bd-path.js'

export default tool({
  description:
    'Update a beads issue (status, priority, notes, etc.). Use --notes to add context that survives compaction - this is CRITICAL for multi-session work.',
  args: {
    id: tool.schema.string().describe('Issue ID to update'),
    status: tool.schema
      .enum(['open', 'in_progress', 'blocked', 'deferred', 'closed'])
      .optional()
      .describe('New status for the issue'),
    priority: tool.schema
      .number()
      .min(0)
      .max(4)
      .optional()
      .describe('New priority (0=critical to 4=backlog)'),
    assignee: tool.schema.string().optional().describe('Username to assign/reassign to'),
    notes: tool.schema
      .string()
      .optional()
      .describe(
        'Add notes to the issue. CRITICAL for context recovery after compaction. Write as if explaining to a future agent with zero context.'
      ),
    claim: tool.schema
      .boolean()
      .optional()
      .describe('Atomic claim: set status to in_progress (use instead of --status)'),
    due: tool.schema.string().optional().describe('Set/update due date'),
    defer: tool.schema
      .string()
      .optional()
      .describe('Hide from bd ready until date (use empty string to clear)'),
    title: tool.schema.string().optional().describe('Update the issue title'),
  },
  async execute(args) {
    const bd = findBdPath()
    const cmdArgs: string[] = [args.id]

    if (args.status) cmdArgs.push(`--status=${args.status}`)
    if (args.priority !== undefined) cmdArgs.push(`--priority=${args.priority}`)
    if (args.assignee) cmdArgs.push(`--assignee=${args.assignee}`)
    if (args.notes) cmdArgs.push(`--notes="${args.notes}"`)
    if (args.claim) cmdArgs.push('--claim')
    if (args.due) cmdArgs.push(`--due=${args.due}`)
    if (args.defer !== undefined) cmdArgs.push(`--defer=${args.defer}`)
    if (args.title) cmdArgs.push(`--title="${args.title}"`)
    cmdArgs.push('--json')

    const result = await Bun.$`${bd} update ${cmdArgs.join(' ')}`.nothrow()

    if (result.exitCode !== 0) {
      return `Error: ${outputToString(result.stderr) || `Failed to update ${args.id}`}`
    }

    return outputToString(result.stdout) || `Updated ${args.id}`
  },
})
