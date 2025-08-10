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
- **Main Feature**: university-course-review-platform (Implementation in Progress)
- **Tech Stack**: Next.js 15 App Router + Supabase + Stripe + TailwindCSS + ShadcnUI
- **Implementation Status**: Core features implemented, database schema deployed
- **Current State**: Functional university course review platform with authentication, reviews, premium features, admin dashboard
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

## Development Commands

### Core Development Workflow
```bash
# Development server (port 3000)
npm run dev          # Start Next.js development server

# Production build and deployment
npm run build        # Build for production
npm run start        # Start production server

# Code quality and linting
npm run lint         # Run ESLint with Next.js rules
```

### Database Management
```bash
# Database setup (see SETUP_DATABASE.md for complete guide)
# 1. Apply schema via Supabase Dashboard SQL Editor
# 2. Execute supabase-complete-setup.sql for full schema
# 3. Run verification script:
npx tsx scripts/verify-supabase-setup.ts
```

### Component Development (ShadcnUI)
```bash
# Add new shadcn/ui components
npx shadcn@latest add [component-name]

# Current shadcn configuration:
# - Style: new-york
# - Base color: neutral
# - CSS variables: enabled
# - Icon library: lucide-react
```

## Critical Development Notes

### Database Setup Requirements
⚠️ **IMPORTANT**: Database setup is required for application functionality
1. **Setup Guide**: Follow `SETUP_DATABASE.md` for complete Supabase configuration
2. **Schema Files**: Execute `supabase-complete-setup.sql` via Supabase Dashboard
3. **Environment**: Configure `.env.local` with Supabase credentials
4. **Verification**: Run `npx tsx scripts/verify-supabase-setup.ts` to validate setup

### Architecture Patterns
- **Route Groups**: Uses Next.js 15 route groups for organization: `(auth)`, `(dashboard)`, `(admin)`
- **Server Components**: Leverage RSC for data fetching and SEO optimization
- **Type Safety**: Comprehensive TypeScript coverage with Zod validation schemas
- **Component Organization**: Feature-based component structure with proper index exports
- **State Management**: React hooks for client state, Supabase for server state

### Code Conventions
- **Import Aliases**: Use `@/` prefix for all internal imports (`@/components`, `@/lib`, etc.)
- **Component Naming**: PascalCase for components, kebab-case for files
- **API Routes**: Follow REST conventions with proper HTTP methods and status codes
- **Error Handling**: Implement proper error boundaries and user-friendly error messages
- **Form Validation**: Use react-hook-form with Zod schemas for type-safe form handling

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

### Implemented Directory Structure
```
city2/
├── app/                       # Next.js 15 App Router (implemented)
│   ├── (auth)/               # Authentication: login, register, reset-password
│   ├── (dashboard)/          # Main app: courses, dashboard, premium, checkout
│   ├── (admin)/              # Admin panel: analytics, users, payments management
│   ├── api/                  # API routes: courses, reviews, stripe, admin endpoints
│   ├── globals.css           # TailwindCSS 4.0 global styles
│   └── layout.tsx            # Root layout with providers
├── components/               # Organized component library
│   ├── auth/                 # LoginForm, RegisterForm, PasswordResetForm
│   ├── course/               # CourseCard, CourseDetail, CourseList, CourseRegistrationForm
│   ├── review/               # ReviewCard, ReviewForm, ReviewList, RatingStars
│   ├── stripe/               # CheckoutForm, StripeProvider
│   ├── filters/              # CourseFilters for advanced search
│   ├── premium/              # AdvancedSearch, DataAnalytics (premium features)
│   └── ui/                   # ShadcnUI components (button, card, form, etc.)
├── lib/                      # Core integrations and utilities
│   ├── supabase/             # Database client (browser, server, SSR)
│   ├── stripe/               # Payment processing (client, config)
│   ├── auth/                 # Authentication helpers and admin context
│   └── validations/          # Zod schemas (course, review, stripe)
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts            # Authentication state management
│   ├── useCourseSearch.ts    # Course filtering and search
│   └── useSubscription.ts    # Premium subscription status
├── types/                    # TypeScript definitions
│   ├── auth.ts, course.ts, review.ts
│   ├── stripe.ts, admin.ts   # Organized by feature domain
│   └── index.ts              # Centralized exports
├── scripts/                  # Utility scripts
│   └── verify-supabase-setup.ts  # Database setup verification
└── docs/                     # Project documentation
    ├── technical-overview.md, user-guide.md
    ├── features-admin.md, business-security.md
    └── README.md
```

### Implementation Status
Major features implemented:
1. ✅ **Authentication System**: Complete login/register/password reset with Supabase Auth
2. ✅ **Course Management**: Course listing, detailed view, search and filtering
3. ✅ **Review System**: Student reviews with rating stars, helpful votes, anonymization
4. ✅ **Premium Features**: Stripe integration, subscription plans, advanced search, data analytics
5. ✅ **Admin Dashboard**: User management, payment tracking, analytics, course moderation
6. ✅ **Database Schema**: Complete Supabase setup with RLS policies and relationships
7. 🟡 **Testing & Deployment**: Testing framework setup pending
8. 🟡 **Performance Optimization**: SEO and caching implementation pending

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