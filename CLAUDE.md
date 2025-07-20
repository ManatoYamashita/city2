# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# City2 - 大学授業口コミプラットフォーム

This project implements a university course review platform using Kiro-style Spec-Driven Development for Claude Code with hooks and slash commands.

## Project Context

### Project Steering
- Product overview: `.kiro/steering/product.md`
- Technology stack: `.kiro/steering/tech.md`
- Project structure: `.kiro/steering/structure.md`
- Custom steering docs for specialized contexts

### Current Project Status
- **Main Feature**: university-course-review-platform (Ready for Implementation)
- **Tech Stack**: Next.js 15 App Router + Supabase + Stripe + TailwindCSS + ShadcnUI
- **Implementation Status**: All specs approved, ready to begin development
- Use `/spec-status university-course-review-platform` to check detailed progress

### Active Specifications
- **university-course-review-platform**: 大学授業口コミプラットフォーム - 履修登録支援のための先輩学生レビューサイト
  - Requirements: ✅ Approved
  - Design: ✅ Approved  
  - Tasks: ✅ Approved
  - Ready for Implementation: ✅
- Current spec: Check `.kiro/specs/` for active specifications

## Development Guidelines
- Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように)

## Implementation Commands

### Project Setup (Ready to Execute)
Based on the approved task plan in `.kiro/specs/university-course-review-platform/tasks.md`:

```bash
# 1. Initialize Next.js 15 project (Task 1.1)
npx create-next-app@latest city2 --typescript --tailwind --eslint --app --no-src-dir
cd city2

# 2. Install dependencies (Task 1.2)
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install stripe @stripe/stripe-js
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge lucide-react
npm install -D @types/node

# 3. Development commands
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests (after Jest setup)

# 4. Testing setup (Task 12.1-12.3)
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test  # E2E testing
```

### Database Setup Commands
```bash
# Supabase CLI setup (Task 2.1)
npx supabase init
npx supabase start
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > types/supabase.ts
```

## Spec-Driven Development Workflow

### Phase 0: Steering Generation (Recommended)

#### Kiro Steering (`.kiro/steering/`)
```
/steering-init          # Generate initial steering documents
/steering-update        # Update steering after changes
/steering-custom        # Create custom steering for specialized contexts
```

**Note**: For new features or empty projects, steering is recommended but not required. You can proceed directly to spec-requirements if needed.

### Phase 1: Specification Creation
```
/spec-init [feature-name]           # Initialize spec structure only
/spec-requirements [feature-name]   # Generate requirements → Review → Edit if needed
/spec-design [feature-name]         # Generate technical design → Review → Edit if needed
/spec-tasks [feature-name]          # Generate implementation tasks → Review → Edit if needed
```

### Phase 2: Progress Tracking
```
/spec-status [feature-name]         # Check current progress and phases
```

## Spec-Driven Development Workflow

Kiro's spec-driven development follows a strict **3-phase approval workflow**:

### Phase 1: Requirements Generation & Approval
1. **Generate**: `/spec-requirements [feature-name]` - Generate requirements document
2. **Review**: Human reviews `requirements.md` and edits if needed
3. **Approve**: Manually update `spec.json` to set `"requirements": true`

### Phase 2: Design Generation & Approval
1. **Generate**: `/spec-design [feature-name]` - Generate technical design (requires requirements approval)
2. **Review**: Human reviews `design.md` and edits if needed
3. **Approve**: Manually update `spec.json` to set `"design": true`

### Phase 3: Tasks Generation & Approval
1. **Generate**: `/spec-tasks [feature-name]` - Generate implementation tasks (requires design approval)
2. **Review**: Human reviews `tasks.md` and edits if needed
3. **Approve**: Manually update `spec.json` to set `"tasks": true`

### Implementation
Only after all three phases are approved can implementation begin.

**Key Principle**: Each phase requires explicit human approval before proceeding to the next phase, ensuring quality and accuracy throughout the development process.

## Development Rules

1. **Consider steering**: Run `/steering-init` before major development (optional for new features)
2. **Follow the 3-phase approval workflow**: Requirements → Design → Tasks → Implementation
3. **Manual approval required**: Each phase must be explicitly approved by human review
4. **No skipping phases**: Design requires approved requirements; Tasks require approved design
5. **Update task status**: Mark tasks as completed when working on them
6. **Keep steering current**: Run `/steering-update` after significant changes
7. **Check spec compliance**: Use `/spec-status` to verify alignment

## Automation

This project uses Claude Code hooks to:
- Automatically track task progress in tasks.md
- Check spec compliance
- Preserve context during compaction
- Detect steering drift

### Task Progress Tracking

When working on implementation:
1. **Manual tracking**: Update tasks.md checkboxes manually as you complete tasks
2. **Progress monitoring**: Use `/spec-status` to view current completion status
3. **TodoWrite integration**: Use TodoWrite tool to track active work items
4. **Status visibility**: Checkbox parsing shows completion percentage

## Getting Started

1. Initialize steering documents: `/steering-init`
2. Create your first spec: `/spec-init [your-feature-name]`
3. Follow the workflow through requirements, design, and tasks

## Kiro Steering Details

Kiro-style steering provides persistent project knowledge through markdown files:

### Core Steering Documents
- **product.md**: Product overview, features, use cases, value proposition
- **tech.md**: Architecture, tech stack, dev environment, commands, ports
- **structure.md**: Directory organization, code patterns, naming conventions

### Custom Steering
Create specialized steering documents for:
- API standards
- Testing approaches
- Code style guidelines
- Security policies
- Database conventions
- Performance standards
- Deployment workflows

### Inclusion Modes
- **Always Included**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., `"*.test.js"`)
- **Manual**: Loaded on-demand with `#filename` reference

## Architecture Overview

### High-Level Architecture
This project follows a structured spec-driven development approach with these key architectural patterns:

1. **Kiro Framework**: Spec-driven development with 3-phase approval workflow
2. **Next.js 15 App Router**: File-based routing without src directory
3. **Supabase Integration**: Authentication, database, and file storage
4. **Stripe Integration**: Premium subscription and payment processing
5. **Component Architecture**: ShadcnUI + TailwindCSS design system

### Key Directory Structure
```
city2/
├── .claude/commands/           # Custom slash commands for spec workflow
├── .kiro/
│   ├── steering/              # Project knowledge and standards
│   └── specs/                 # Feature specifications and task tracking
├── app/                       # Next.js 15 App Router (when implemented)
│   ├── (auth)/               # Authentication routes
│   ├── (dashboard)/          # Main application routes
│   ├── admin/                # Admin dashboard
│   └── api/                  # API routes
├── components/               # Reusable components
├── lib/                      # Utilities and integrations
├── types/                    # TypeScript definitions
└── hooks/                    # Custom React hooks
```

### Implementation Phases
Based on the approved task plan:
1. **Phase 1 (Tasks 1-3)**: Project setup, database, authentication
2. **Phase 2 (Tasks 4-5)**: Core features (courses, reviews)
3. **Phase 3 (Tasks 6-8)**: Advanced features (admin, premium, UI)
4. **Phase 4 (Tasks 9-11)**: Optimization and analytics
5. **Phase 5 (Tasks 12-13)**: Testing and deployment

## Technical Context

### Core Technologies
- **Frontend**: Next.js 15 with App Router (no src directory)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with email/password
- **Payments**: Stripe for premium subscriptions
- **UI**: TailwindCSS + ShadcnUI components
- **Deployment**: Vercel (recommended)

### Data Models (Implemented via Supabase)
- Universities (multi-tenant support)
- Users (with premium subscription status)
- Courses (with aggregated review statistics)
- Reviews (anonymized with voting)
- Past Exams (premium feature)

### Security Considerations
- Row Level Security (RLS) for multi-tenant data isolation
- JWT tokens for authentication
- Input validation with Zod schemas
- Rate limiting and CSRF protection