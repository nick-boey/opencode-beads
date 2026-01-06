# opencode-beads

Beads issue tracker integration for OpenCode - persistent task memory for AI agents.

This plugin mirrors the [Beads](https://github.com/steveyegge/beads) integration for Claude Code, providing:

- **Session hooks** - Inject workflow context on session start and after compaction
- **Custom tools** - Direct access to bd CLI commands
- **Custom commands** - Quick slash commands for common operations
- **Beads skill** - Comprehensive documentation available on-demand

## Installation

### From npm (recommended)

```bash
npm install -g opencode-beads
```

Then add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-beads"]
}
```

### Local installation

For project-specific installation:

```bash
npx opencode-beads-install
```

For global installation:

```bash
npx opencode-beads-install --global
```

## Prerequisites

1. **bd CLI** - Install the beads command-line tool:
   ```bash
   # Using npm
   npm install -g @beads/bd
   
   # Using Homebrew (macOS/Linux)
   brew install steveyegge/beads/bd
   ```

2. **Initialize beads** in your project:
   ```bash
   bd init
   ```

## Features

### Session Hooks

The plugin automatically:

- **On session start**: Injects `bd prime` output with workflow context
- **After compaction**: Re-injects context to recover from context loss
- **During compaction**: Adds current beads state to compaction context
- **On idle**: Auto-syncs changes to JSONL (configurable)

### Custom Tools

| Tool | Description |
|------|-------------|
| `bd-ready` | Find issues ready to work on (no blockers) |
| `bd-show` | View detailed issue information |
| `bd-create` | Create new issues |
| `bd-update` | Update issue status, priority, notes |
| `bd-close` | Close completed issues |
| `bd-sync` | Sync with git (CRITICAL before ending session) |
| `bd-dep` | Manage dependencies between issues |

### Custom Commands

| Command | Description |
|---------|-------------|
| `/bd-ready` | Quick "what's next?" |
| `/bd-status` | Project stats and health |
| `/bd-sync` | Sync and check git status |

### Beads Skill

The plugin auto-installs a comprehensive skill at `.opencode/skill/beads/` with:

- Decision tree: bd vs TodoWrite
- CLI reference
- Dependency management guide
- Compaction survival guide
- Troubleshooting tips

## Configuration

Configure in your `opencode.json`:

```json
{
  "plugin": ["opencode-beads"],
  "beads": {
    "autoSyncOnIdle": true,
    "contextInjection": {
      "onSessionStart": true,
      "onCompaction": true,
      "includeReadyWork": true,
      "includeInProgress": true,
      "readyWorkLimit": 5
    },
    "warnings": {
      "showNotInstalled": true,
      "showNotInitialized": true,
      "showHooksOutdated": true
    }
  }
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `autoSyncOnIdle` | `true` | Run `bd sync --flush-only` on session idle |
| `contextInjection.onSessionStart` | `true` | Inject bd prime context on session start |
| `contextInjection.onCompaction` | `true` | Re-inject context after compaction |
| `contextInjection.includeReadyWork` | `true` | Include ready work in compaction context |
| `contextInjection.includeInProgress` | `true` | Include in-progress work in compaction context |
| `contextInjection.readyWorkLimit` | `5` | Max ready issues to include (1-20) |
| `warnings.showNotInstalled` | `true` | Show warning if bd CLI not installed |
| `warnings.showNotInitialized` | `true` | Show info if project not initialized |
| `warnings.showHooksOutdated` | `true` | Show warning if git hooks outdated |

## Usage

### Basic Workflow

1. **Find work**: Use `/bd-ready` or the `bd-ready` tool
2. **Claim work**: `bd update <id> --status in_progress`
3. **Add notes**: `bd update <id> --notes "Progress update..."`
4. **Complete work**: `bd close <id> --reason "Done"`
5. **Sync**: `/bd-sync` or `bd sync` before ending session

### When to Use Beads vs TodoWrite

| Use Beads (bd) | Use TodoWrite |
|----------------|---------------|
| Multi-session work | Single-session tasks |
| Complex dependencies | Linear execution |
| Needs to survive compaction | Conversation-scoped |
| Team collaboration | Personal checklist |

**Rule of thumb**: "Will I need this context in 2 weeks?" → YES = bd

## Session Close Protocol

**CRITICAL**: Before saying "done", always:

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

Work is NOT complete until `git push` succeeds.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## License

MIT

## Related

- [Beads](https://github.com/steveyegge/beads) - Git-backed issue tracker for AI agents
- [OpenCode](https://opencode.ai) - AI coding agent
- [OpenCode Plugins](https://opencode.ai/docs/plugins) - Plugin documentation
