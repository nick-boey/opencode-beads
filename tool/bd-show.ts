import { tool } from '@opencode-ai/plugin'
import { findBdPath, outputToString } from './bd-path.js'

export default tool({
  description:
    'Show detailed information about a beads issue including description, dependencies, blockers, notes, and audit trail.',
  args: {
    id: tool.schema.string().describe('Issue ID (e.g., bd-a1b2 or project-123)'),
    thread: tool.schema
      .boolean()
      .optional()
      .describe('Show conversation thread for message-type issues'),
    refs: tool.schema.boolean().optional().describe('Show issues that reference this one'),
  },
  async execute(args) {
    const bd = findBdPath()
    const cmdArgs: string[] = [args.id]

    if (args.thread) cmdArgs.push('--thread')
    if (args.refs) cmdArgs.push('--refs')
    cmdArgs.push('--json')

    const result = await Bun.$`${bd} show ${cmdArgs.join(' ')}`.nothrow()

    if (result.exitCode !== 0) {
      return `Error: ${outputToString(result.stderr) || `Issue ${args.id} not found`}`
    }

    return outputToString(result.stdout)
  },
})
