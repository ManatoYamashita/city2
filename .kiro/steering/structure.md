# City2 Project Structure

## Root Directory Organization
```
city2/
├── .claude/                    # Claude Code configuration and commands
├── .kiro/                     # Kiro spec-driven development framework
├── .next/                     # Next.js build output (generated)
├── app/                       # Next.js 15 App Router (main application)
├── components/                # Reusable React components
├── hooks/                     # Custom React hooks
├── lib/                       # Utility libraries and configurations
├── middleware.ts              # Next.js middleware for auth and routing
├── node_modules/              # Package dependencies (generated)
├── types/                     # TypeScript type definitions
├── CLAUDE.md                  # Project-specific Claude Code instructions
├── SETUP_DATABASE.md          # Database setup documentation
├── package.json               # NPM package configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # TailwindCSS configuration
├── postcss.config.mjs        # PostCSS configuration
├── next.config.mjs           # Next.js configuration
├── .env.local               # Local environment variables (not committed)
└── supabase-complete-setup.sql # Database schema and initial data
```

## Subdirectory Structures

### `app/` - Next.js 15 App Router Structure
Modern Next.js application following App Router conventions:
```
app/
├── layout.tsx                 # Root layout component
├── page.tsx                  # Home page (redirects to dashboard)
├── globals.css               # Global CSS styles
├── (auth)/                   # Authentication route group
│   ├── login/page.tsx        # Login page
│   ├── register/page.tsx     # User registration
│   └── reset-password/page.tsx # Password reset
├── (dashboard)/              # Main application route group
│   ├── layout.tsx           # Dashboard layout with navigation
│   ├── page.tsx             # Dashboard home
│   ├── courses/page.tsx     # Course listing and search
│   ├── reviews/page.tsx     # User's reviews management
│   ├── checkout/page.tsx    # Premium subscription checkout
│   └── settings/page.tsx    # User settings
├── (admin)/                  # Admin route group (protected)
│   ├── layout.tsx           # Admin layout
│   ├── admin/               # Admin dashboard
│   │   ├── page.tsx        # Admin overview
│   │   ├── users/page.tsx  # User management
│   │   ├── reviews/page.tsx # Review moderation
│   │   └── analytics/page.tsx # Platform analytics
├── api/                      # API Routes (server-side)
│   ├── courses/             # Course management APIs
│   ├── reviews/             # Review system APIs
│   ├── admin/               # Administrative APIs
│   ├── premium/             # Premium feature APIs
│   └── stripe/              # Stripe payment integration
└── not-found.tsx            # 404 error page
```

### `components/` - Reusable UI Components
Organized by feature and reusability:
```
components/
├── ui/                       # Base UI components (ShadcnUI style)
│   ├── button.tsx           # Reusable button component
│   ├── input.tsx            # Form input components
│   ├── select.tsx           # Dropdown select components
│   ├── card.tsx             # Card container components
│   ├── badge.tsx            # Status badge components
│   └── ...                  # Other base components
├── auth/                     # Authentication components
│   ├── LoginForm.tsx        # Login form component
│   ├── RegisterForm.tsx     # Registration form
│   └── PasswordResetForm.tsx # Password reset
├── course/                   # Course-related components
│   ├── CourseCard.tsx       # Course display card
│   ├── CourseList.tsx       # Course listing with pagination
│   └── CourseFilters.tsx    # Search and filter controls
├── review/                   # Review system components
│   ├── ReviewCard.tsx       # Individual review display
│   ├── ReviewForm.tsx       # Review creation/editing
│   ├── RatingDisplay.tsx    # Star rating display
│   └── ReviewFilters.tsx    # Review filtering
├── search/                   # Search functionality
│   ├── SearchBar.tsx        # Global search component
│   └── SearchResults.tsx    # Search results display
├── filters/                  # Filtering components
│   ├── CourseFilters.tsx    # Course filtering interface
│   └── FilterControls.tsx   # Generic filter controls
├── premium/                  # Premium feature components
│   ├── SubscriptionPlan.tsx # Subscription plan display
│   ├── PremiumGate.tsx      # Premium content protection
│   └── UsageLimits.tsx      # Usage tracking display
├── admin/                    # Admin-specific components
│   ├── UserManagement.tsx   # User administration
│   ├── ReviewModeration.tsx # Review content moderation
│   └── AnalyticsDashboard.tsx # Statistics and analytics
└── layout/                   # Layout and navigation
    ├── Navigation.tsx       # Main navigation component
    ├── Sidebar.tsx          # Dashboard sidebar
    └── Footer.tsx           # Site footer
```

### `lib/` - Utilities and Configurations
Shared utilities and service integrations:
```
lib/
├── utils.ts                  # General utility functions
├── supabase/                 # Supabase integration
│   ├── client.ts            # Browser-side Supabase client
│   ├── server.ts            # Server-side Supabase client
│   └── middleware.ts        # Middleware Supabase client
├── stripe/                   # Stripe payment integration
│   ├── config.ts            # Stripe configuration
│   ├── webhooks.ts          # Webhook handling utilities
│   └── subscriptions.ts     # Subscription management
├── auth/                     # Authentication utilities
│   ├── context.tsx          # Auth context provider
│   ├── helpers.ts           # Auth helper functions
│   └── admin.ts             # Admin authentication
├── validations/              # Zod validation schemas
│   ├── auth.ts              # Authentication schemas
│   ├── course.ts            # Course data schemas
│   ├── review.ts            # Review data schemas
│   └── admin.ts             # Admin operation schemas
└── constants/                # Application constants
    ├── routes.ts            # Route definitions
    ├── permissions.ts       # Permission constants
    └── config.ts            # App configuration
```

### `types/` - TypeScript Type Definitions
Comprehensive type system for the application:
```
types/
├── index.ts                  # Re-exports and common types
├── auth.ts                   # Authentication-related types
├── course.ts                 # Course and university types
├── review.ts                 # Review system types
├── admin.ts                  # Administrative types
├── stripe.ts                 # Stripe integration types
└── supabase.ts              # Generated Supabase types (auto-generated)
```

### `hooks/` - Custom React Hooks
Reusable React hooks for common functionality:
```
hooks/
├── useAuth.ts               # Authentication state management
├── useCourseSearch.ts       # Course search and filtering
├── useReviews.ts            # Review operations
├── useSubscription.ts       # Premium subscription management
└── useSupabase.ts           # Supabase client access
```

## Code Organization Patterns

### 1. Feature-Based Organization
- Components grouped by domain (auth, course, review, admin)
- Related types, hooks, and utilities co-located
- Clear separation between UI components and business logic

### 2. Next.js App Router Conventions
- Route groups `(auth)`, `(dashboard)`, `(admin)` for logical organization
- Nested layouts for different application sections
- API routes mirror frontend route structure

### 3. Component Architecture
- Base UI components in `components/ui/` following ShadcnUI patterns
- Feature-specific components in domain directories
- Composition over inheritance for component reuse

### 4. Type Safety
- Strict TypeScript configuration with comprehensive type definitions
- Generated types from Supabase schema
- Zod schemas for runtime validation

## File Naming Conventions

### Components
- **React Components**: PascalCase with `.tsx` extension (`CourseCard.tsx`)
- **UI Components**: Lowercase with `.tsx` extension (`button.tsx`, `input.tsx`)
- **Page Components**: Always `page.tsx` for App Router compliance
- **Layout Components**: Always `layout.tsx` for App Router compliance

### Utilities and Libraries
- **Utility Files**: camelCase with `.ts` extension (`authHelpers.ts`)
- **Configuration Files**: camelCase with appropriate extension (`tailwind.config.ts`)
- **Type Definition Files**: camelCase with `.ts` extension (`courseTypes.ts`)

### API Routes
- **API Endpoints**: `route.ts` for App Router API compliance
- **Nested Routes**: Directory structure mirrors URL structure
- **Dynamic Routes**: Square bracket notation `[id]/route.ts`

## Import Organization

### Path Mapping
- `@/*` maps to project root for clean imports
- Absolute imports preferred over relative for better maintainability

### Import Order Convention
1. React and Next.js imports
2. Third-party library imports
3. Internal utility imports (`@/lib/*`)
4. Component imports (`@/components/*`)
5. Type imports (`@/types/*`)
6. Local/relative imports

### Example Import Structure
```typescript
import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/config'
import { Button } from '@/components/ui/button'
import { CourseSearchParams } from '@/types/course'
import './styles.css'
```

## Key Architectural Principles

### 1. Type Safety First
- TypeScript strict mode enabled
- Comprehensive type definitions for all data structures
- Runtime validation with Zod schemas

### 2. Component Composition
- Small, focused components with single responsibilities
- Composition patterns over complex inheritance hierarchies
- Reusable UI components with consistent API

### 3. Server-Side Security
- Row Level Security (RLS) enforced at database level
- Authentication middleware for route protection
- Sensitive operations server-side only

### 4. Performance Optimization
- React Server Components for optimal performance
- Static generation where appropriate
- Optimized database queries with proper indexing

### 5. Scalable Architecture
- Multi-tenant database design
- Modular code organization for easy feature addition
- Clear separation between presentation and business logic

## Development Workflow Patterns

### 1. Component Development
- Start with TypeScript types
- Create base functionality
- Add styling with TailwindCSS
- Implement error handling and loading states

### 2. API Development
- Define Zod validation schema
- Implement database operations with Supabase
- Add proper error handling and logging
- Test with various input scenarios

### 3. Feature Integration
- Update routing structure
- Create necessary database migrations
- Implement frontend and backend simultaneously
- Add appropriate admin controls if needed