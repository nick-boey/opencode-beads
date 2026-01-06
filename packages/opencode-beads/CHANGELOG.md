# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-01-06

### Added

- Initial release
- Core plugin with session hooks:
  - `session.created` - Inject bd prime context on session start
  - `session.compacted` - Re-inject context after compaction
  - `experimental.session.compacting` - Add beads state to compaction context
  - `session.idle` - Auto-sync on idle
- Custom tools:
  - `bd-ready` - Find issues ready to work on
  - `bd-show` - View issue details
  - `bd-create` - Create new issues
  - `bd-update` - Update issues
  - `bd-close` - Close issues
  - `bd-sync` - Sync with git
  - `bd-dep` - Manage dependencies
- Custom commands:
  - `/bd-ready` - Quick "what's next?"
  - `/bd-status` - Project stats and health
  - `/bd-sync` - Sync and check git status
- Beads skill with comprehensive documentation
- Auto-install skill on first run
- Configuration options for all features
- TUI warnings for setup issues
- Local installation support
