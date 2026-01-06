import { tool } from '@opencode-ai/plugin'

export default tool({
  description:
    'Sync beads issues with git. CRITICAL: Run before ending any session to ensure work is persisted. This exports changes to JSONL and optionally commits/pushes.',
  args: {
    flushOnly: tool.schema
      .boolean()
      .optional()
      .describe('Only export to JSONL, skip git operations'),
    fromMain: tool.schema
      .boolean()
      .optional()
      .describe('Pull beads updates from main branch (for feature branches)'),
    importOnly: tool.schema
      .boolean()
      .optional()
      .describe('Only import from JSONL, skip git operations'),
    status: tool.schema
      .boolean()
      .optional()
      .describe('Check sync status without making changes'),
  },
  async execute(args) {
    const cmdArgs: string[] = []

    if (args.flushOnly) cmdArgs.push('--flush-only')
    if (args.fromMain) cmdArgs.push('--from-main')
    if (args.importOnly) cmdArgs.push('--import-only')
    if (args.status) cmdArgs.push('--status')

    const result = await Bun.$`bd sync ${cmdArgs.join(' ')}`.nothrow()

    if (result.exitCode !== 0) {
      return `Error: ${result.stderr || 'Sync failed'}`
    }

    return result.stdout || 'Sync completed successfully'
  },
})
