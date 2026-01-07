import { tool } from '@opencode-ai/plugin'
import { findBdPath, outputToString } from './bd-path.js'

export default tool({
  description:
    'Create a new beads issue for tracking work. Use for multi-session tasks, work with dependencies, or anything that should persist across sessions and survive context compaction.',
  args: {
    title: tool.schema.string().describe('Issue title'),
    type: tool.schema
      .enum(['bug', 'feature', 'task', 'epic', 'chore'])
      .default('task')
      .describe('Issue type'),
    priority: tool.schema
      .number()
      .min(0)
      .max(4)
      .default(2)
      .describe('Priority: 0=critical, 1=high, 2=medium, 3=low, 4=backlog'),
    description: tool.schema.string().optional().describe('Detailed description of the issue'),
    parent: tool.schema
      .string()
      .optional()
      .describe('Parent issue ID (creates subtask relationship)'),
    due: tool.schema
      .string()
      .optional()
      .describe('Due date (e.g., +6h, tomorrow, 2024-01-15, "next monday")'),
    defer: tool.schema
      .string()
      .optional()
      .describe('Hide from bd ready until this date (e.g., +1h, tomorrow)'),
    assignee: tool.schema.string().optional().describe('Username to assign the issue to'),
  },
  async execute(args) {
    const bd = findBdPath()
    const cmdArgs: string[] = [
      `--title="${args.title}"`,
      `--type=${args.type}`,
      `--priority=${args.priority}`,
    ]

    if (args.description) cmdArgs.push(`--description="${args.description}"`)
    if (args.parent) cmdArgs.push(`--parent=${args.parent}`)
    if (args.due) cmdArgs.push(`--due=${args.due}`)
    if (args.defer) cmdArgs.push(`--defer=${args.defer}`)
    if (args.assignee) cmdArgs.push(`--assignee=${args.assignee}`)
    cmdArgs.push('--json')

    const result = await Bun.$`${bd} create ${cmdArgs.join(' ')}`.nothrow()

    if (result.exitCode !== 0) {
      return `Error: ${outputToString(result.stderr) || 'Failed to create issue'}`
    }

    return outputToString(result.stdout)
  },
})
