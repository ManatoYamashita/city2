# Technology Stack

## Architecture
- **Framework Type**: Development workflow management system
- **Deployment Model**: Local development tool integration
- **Integration Pattern**: Claude Code hooks and slash commands
- **Data Storage**: File-based markdown and JSON metadata

## Frontend
- **Not Applicable**: This is a development framework, not a user-facing application
- **Interface**: Command-line interface through Claude Code slash commands
- **Documentation Format**: Markdown files for specifications and steering documents

## Backend
- **Language**: Markdown + JSON configuration
- **Runtime**: Claude Code environment with hook system
- **Command System**: Custom slash commands implemented as markdown files
- **File System**: Local file-based storage for specifications and metadata

## Development Environment
- **Required Tools**:
  - Claude Code CLI
  - Git (for version control)
  - Text editor supporting markdown
- **Setup**:
  - Clone repository
  - Ensure `.claude/commands/` directory contains slash command definitions
  - Initialize `.kiro/steering/` directory with steering documents

## Common Commands
```bash
# Initialize steering documents
/steering-init

# Create new specification
/spec-init [feature-name]

# Generate requirements (requires spec initialization)
/spec-requirements [feature-name]

# Generate design (requires approved requirements)
/spec-design [feature-name]

# Generate tasks (requires approved design)
/spec-tasks [feature-name]

# Check specification status
/spec-status [feature-name]

# Update steering after significant changes
/steering-update

# Create custom steering for specialized contexts
/steering-custom
```

## Environment Variables
- **Not Applicable**: No environment variables required
- **Configuration**: All configuration stored in JSON metadata files within `.kiro/specs/`

## Port Configuration
- **Not Applicable**: No network services or ports required
- **File System Only**: All operations are file-based

## Dependencies
- **Core Dependency**: Claude Code with hook support
- **File Dependencies**:
  - `.claude/commands/*.md` - Slash command definitions
  - `.kiro/steering/*.md` - Project steering documents  
  - `.kiro/specs/*/` - Individual feature specifications
- **No External Dependencies**: Pure markdown and JSON-based system

## Integration Points
- **Claude Code Hooks**: Automatic task progress tracking and spec compliance checking
- **Git Integration**: Version control for all specification and steering documents
- **Markdown Processors**: For rendering and parsing specification documents
- **JSON Parsing**: For metadata management in spec.json files