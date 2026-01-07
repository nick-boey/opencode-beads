import { tool } from '@opencode-ai/plugin'
import { findBdPath, outputToString } from './bd-path.js'

export default tool({
  description:
    'Close one or more beads issues as completed. Can close multiple issues at once for efficiency.',
  args: {
    ids: tool.schema
      .array(tool.schema.string())
      .describe('Issue ID(s) to close (can specify multiple)'),
    reason: tool.schema
      .string()
      .optional()
      .describe('Reason for closing - documents what was done'),
    suggestNext: tool.schema
      .boolean()
      .optional()
      .describe('Show newly unblocked issues after closing'),
    continue: tool.schema
      .boolean()
      .optional()
      .describe('Auto-advance to next step (for molecule workflows)'),
  },
  async execute(args) {
    const bd = findBdPath()
    const cmdArgs: string[] = [...args.ids]

    if (args.reason) cmdArgs.push(`--reason="${args.reason}"`)
    if (args.suggestNext) cmdArgs.push('--suggest-next')
    if (args.continue) cmdArgs.push('--continue')
    cmdArgs.push('--json')

    const result = await Bun.$`${bd} close ${cmdArgs.join(' ')}`.nothrow()

    if (result.exitCode !== 0) {
      return `Error: ${outputToString(result.stderr) || 'Failed to close issue(s)'}`
    }

    return outputToString(result.stdout) || `Closed: ${args.ids.join(', ')}`
  },
})
