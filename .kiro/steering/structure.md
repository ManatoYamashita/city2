# Project Structure

## Root Directory Organization
```
city2/
├── .claude/                    # Claude Code configuration and commands
│   └── commands/              # Custom slash command definitions
├── .kiro/                     # Kiro framework files
│   ├── steering/              # Project steering documents
│   └── specs/                 # Feature specifications (created as needed)
├── CLAUDE.md                  # Project-specific Claude Code instructions
└── .git/                      # Git version control
```

## Subdirectory Structures

### `.claude/commands/` - Slash Command Definitions
Each file defines a custom slash command for the spec-driven development workflow:
- `steering-init.md` - Initialize steering documents
- `steering-update.md` - Update existing steering documents
- `steering-custom.md` - Create custom steering documents
- `spec-init.md` - Initialize new specification structure
- `spec-requirements.md` - Generate requirements phase
- `spec-design.md` - Generate design phase
- `spec-tasks.md` - Generate tasks phase
- `spec-status.md` - Check specification progress

### `.kiro/steering/` - Project Steering Documents
Persistent project knowledge base:
- `product.md` - Product overview and value proposition
- `tech.md` - Technology stack and architecture
- `structure.md` - Project organization and conventions
- `{custom}.md` - Additional domain-specific steering (created as needed)

### `.kiro/specs/` - Feature Specifications (Created Dynamically)
Each feature gets its own directory:
```
.kiro/specs/
└── {feature-name}/
    ├── spec.json           # Metadata and approval tracking
    ├── requirements.md     # User stories and acceptance criteria
    ├── design.md          # Technical design and architecture
    └── tasks.md           # Implementation tasks and progress
```

## Code Organization Patterns
- **Markdown-Driven**: All specifications and steering documents in markdown
- **JSON Metadata**: Progress and approval tracking in structured JSON
- **Phase-Gated**: Clear separation between requirements, design, and tasks phases
- **File-Based Storage**: No databases, all state in version-controlled files

## File Naming Conventions
- **Steering Documents**: Lowercase with hyphens (`product.md`, `tech.md`)
- **Specification Directories**: Kebab-case feature names (`user-authentication`, `data-export`)
- **Standard Files**: Fixed names (`requirements.md`, `design.md`, `tasks.md`, `spec.json`)
- **Custom Steering**: Domain-specific descriptive names (`api-standards.md`, `security-policies.md`)

## Import Organization
- **Steering References**: Use `@.kiro/steering/{file}.md` in slash commands
- **Spec References**: Use `@.kiro/specs/{feature}/{file}.md` for cross-references
- **Command References**: Reference other commands as needed for workflow documentation

## Key Architectural Principles

### 1. Separation of Concerns
- **Steering**: Project-wide context and standards
- **Specifications**: Feature-specific requirements and design
- **Commands**: Workflow orchestration and validation

### 2. Phase-Gate Quality Control
- Explicit approval required between phases
- No skipping phases in the workflow
- Human review gates prevent automation errors

### 3. Documentation as Code
- All project knowledge in version-controlled markdown
- Specifications are living documents
- Context preserved across all AI interactions

### 4. Minimal Dependencies
- Pure markdown and JSON approach
- No external services or databases
- Git-based collaboration and history

### 5. Extensibility
- Custom steering documents for specialized domains
- Flexible specification structure
- Reusable across multiple projects

## Directory Creation Patterns
- **Steering**: Created once during project initialization
- **Specifications**: Created per-feature using `/spec-init`
- **Custom Steering**: Created as needed for specialized contexts
- **All Directories**: Version controlled and persistent across development lifecycle