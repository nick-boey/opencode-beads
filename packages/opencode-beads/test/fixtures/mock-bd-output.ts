/**
 * Mock bd CLI output fixtures for testing
 */

export const mockBdVersion = 'bd version 0.44.0'

export const mockBdPrimeOutput = `# Beads Workflow Context

> **Context Recovery**: Run \`bd prime\` after compaction, clear, or new session
> Hooks auto-call this in Claude Code when .beads/ detected

# SESSION CLOSE PROTOCOL

**CRITICAL**: Before saying "done" or "complete", you MUST run this checklist:

\`\`\`
[ ] 1. git status              (check what changed)
[ ] 2. git add <files>         (stage code changes)
[ ] 3. bd sync                 (commit beads changes)
[ ] 4. git commit -m "..."     (commit code)
[ ] 5. bd sync                 (commit any new beads changes)
[ ] 6. git push                (push to remote)
\`\`\`

**NEVER skip this.** Work is not done until pushed.

## Core Rules
- Track strategic work in beads (multi-session, dependencies, discovered work)
- Use \`bd create\` for issues, TodoWrite for simple single-session execution
- When in doubt, prefer bd—persistence you don't need beats lost context
`

export const mockReadyWork = [
  {
    id: 'proj-a1b2',
    title: 'Implement user authentication',
    status: 'open',
    priority: 1,
    type: 'feature',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'proj-c3d4',
    title: 'Fix login button alignment',
    status: 'open',
    priority: 2,
    type: 'bug',
    created_at: '2024-01-15T11:00:00Z',
  },
]

export const mockInProgressWork = [
  {
    id: 'proj-e5f6',
    title: 'Add dark mode support',
    status: 'in_progress',
    priority: 2,
    type: 'feature',
    assignee: 'developer',
    created_at: '2024-01-14T09:00:00Z',
  },
]

export const mockStats = {
  total: 25,
  open: 10,
  in_progress: 3,
  blocked: 2,
  closed: 10,
}

export const mockHooksStatus = {
  hooks: [
    { Name: 'pre-commit', Installed: true, Outdated: false, IsShim: true, Version: 'v1' },
    { Name: 'post-merge', Installed: true, Outdated: false, IsShim: true, Version: 'v1' },
    { Name: 'pre-push', Installed: true, Outdated: false, IsShim: true, Version: 'v1' },
    { Name: 'post-checkout', Installed: true, Outdated: false, IsShim: true, Version: 'v1' },
    { Name: 'prepare-commit-msg', Installed: true, Outdated: false, IsShim: true, Version: 'v1' },
  ],
}

export const mockIssueShow = {
  id: 'proj-a1b2',
  title: 'Implement user authentication',
  description: 'Add JWT-based authentication to the API',
  status: 'open',
  priority: 1,
  type: 'feature',
  assignee: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  dependencies: [],
  blocked_by: [],
  blocks: ['proj-g7h8'],
  notes: '',
}

export const mockCreateResponse = {
  id: 'proj-i9j0',
  title: 'New issue',
  status: 'open',
  priority: 2,
  type: 'task',
  created_at: '2024-01-16T10:00:00Z',
}
