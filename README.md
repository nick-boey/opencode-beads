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

### Prerequisites

- **Node.js**: 20.x or 22.x (LTS recommended)
- **npm**: 10.x or later
- **Git**: For version control
- **bd CLI** (optional): For testing with actual beads projects

### Repository Setup

```bash
# Clone the repository
git clone https://github.com/nick-boey/opencode-beads.git
cd opencode-beads

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run local:install` | Install plugin locally for testing |

### Project Structure

```
opencode-beads/
├── src/                    # TypeScript source code
│   ├── index.ts           # Main plugin entry point
│   ├── config.ts          # Configuration schema (Zod)
│   ├── version.ts         # Version info (reads from package.json)
│   └── utils/
│       ├── bd.ts          # bd CLI wrapper utilities
│       └── skill-installer.ts  # Auto-install skill
├── tool/                   # Custom tools (bd-ready.ts, bd-show.ts, etc.)
├── command/                # Custom slash commands (markdown files)
├── skill/beads/           # Beads skill with resources
│   ├── SKILL.md           # Main skill file
│   └── resources/         # Detailed documentation files
├── test/                   # Vitest test files
├── dist/                   # Compiled output (generated)
└── local/                  # Local installation script
```

### Testing Locally with OpenCode

#### Method 1: Local Plugin Installation

```bash
npm run build
npm run local:install

# Or install globally
npm run local:install -- --global
```

This copies the built plugin to `.opencode/plugin/beads.js` in your project.

#### Method 2: npm Link

```bash
# From the opencode-beads directory
npm link

# In your test project
npm link opencode-beads
```

Then add to your project's `opencode.json`:
```json
{
  "plugin": ["opencode-beads"]
}
```

#### Method 3: Direct Path Reference

In your test project's `opencode.json`:
```json
{
  "plugin": ["../path/to/opencode-beads"]
}
```

### Writing Tests

Tests use [Vitest](https://vitest.dev/). Test files are in the `test/` directory.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run test/config.test.ts
```

#### Mocking the Shell

The plugin uses OpenCode's `BunShell` for executing bd commands. Tests mock this:

```typescript
import { describe, it, expect } from 'vitest'

function createMock$(responses: Record<string, { exitCode: number; stdout?: string }>) {
  // See test/utils.test.ts for full implementation
}

it('should handle bd commands', async () => {
  const $ = createMock$({
    'bd ready': { exitCode: 0, stdout: '[{"id": "1"}]' }
  })
  // Test your function with mocked shell
})
```

### Code Style

- **ESLint**: Enforces code quality rules
- **Prettier**: Formats code consistently
- **TypeScript**: Strict mode enabled

```bash
# Check for issues
npm run lint
npm run typecheck

# Auto-fix issues
npm run lint:fix
npm run format
```

### Contributing

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feature/my-feature`
3. **Make changes** and add tests
4. **Run checks**: `npm run typecheck && npm run lint && npm test`
5. **Commit** with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `chore:` for maintenance tasks
6. **Push** to your fork and create a **Pull Request**

### Release Process

Releases are automated via GitHub Actions:

1. **Create a GitHub Release** with a tag like `v1.0.0`
2. The release workflow automatically:
   - Extracts the version from the tag
   - Updates `package.json` version
   - Builds and tests the package
   - Publishes to npm with provenance
   - Commits the version bump back to `main`

**To release a new version:**

```bash
# Ensure main is up to date
git checkout main
git pull

# Create and push a tag (or use GitHub UI)
git tag v1.0.0
git push origin v1.0.0

# Then create a GitHub Release from the tag
# Go to: https://github.com/nick-boey/opencode-beads/releases/new
```

Or use the GitHub UI:
1. Go to Releases → "Draft a new release"
2. Create a new tag (e.g., `v1.0.0`)
3. Generate release notes
4. Publish release

The npm package will be published automatically.

## License

MIT

## Related

- [Beads](https://github.com/steveyegge/beads) - Git-backed issue tracker for AI agents
- [OpenCode](https://opencode.ai) - AI coding agent
- [OpenCode Plugins](https://opencode.ai/docs/plugins) - Plugin documentation
