# City2 Technology Stack

## Architecture
- **Framework Type**: Full-stack web application
- **Architecture Pattern**: Modern JAMstack with serverless functions
- **Frontend Architecture**: Next.js 15 App Router with React Server Components
- **Backend Architecture**: Supabase Backend-as-a-Service with PostgreSQL
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Payment Processing**: Stripe integration with webhook handling
- **Data Storage**: PostgreSQL with automated triggers and real-time subscriptions

## Frontend
- **Framework**: Next.js 15.4.2 with App Router (latest stable)
- **UI Framework**: React 19.1.0 with React DOM 19.1.0
- **Language**: TypeScript 5+ with strict mode enabled
- **Styling**: TailwindCSS 4 with PostCSS integration
- **Component Library**: Radix UI primitives with custom ShadcnUI components
- **State Management**: React Hook Form for form state, Supabase real-time for global state
- **Icons**: Lucide React icon library
- **Utilities**: 
  - `class-variance-authority` for component variants
  - `clsx` and `tailwind-merge` for conditional styling
  - `date-fns` for date formatting and manipulation

## Backend
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password and social providers
- **Real-time**: Supabase real-time subscriptions for live updates
- **Storage**: Supabase Storage for file uploads (past exams, profile pictures)
- **API**: Next.js API Routes for server-side logic and third-party integrations
- **Payment Processing**: Stripe for subscription management and billing
- **Validation**: Zod schemas for type-safe data validation
- **Middleware**: Next.js middleware for authentication and route protection

## Development Environment

### Required Tools
- **Node.js**: Version 18+ (for Next.js compatibility)
- **Package Manager**: npm, yarn, pnpm, or bun
- **Database**: Supabase CLI for local development and migrations
- **Git**: Version control and collaboration
- **TypeScript**: Integrated with Next.js for type checking

### Setup Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit
```

## Common Commands

### Development Workflow
```bash
# Start development server (multiple options)
npm run dev
yarn dev
pnpm dev
bun dev

# Build application
npm run build

# Lint code
npm run lint

# Type checking
npx tsc --noEmit

# Format code (if Prettier configured)
npx prettier --write .
```

### Database Management (Supabase)
```bash
# Initialize Supabase project
npx supabase init

# Start local Supabase stack
npx supabase start

# Create new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db push

# Pull remote schema
npx supabase db pull

# Generate TypeScript types
npx supabase gen types typescript --local > types/supabase.ts
```

## Environment Variables

### Required Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Environment Files
- **`.env.local`**: Local development environment variables
- **`.env.example`**: Template for required environment variables
- **`.env.production`**: Production environment variables (not in repository)

## Port Configuration
- **Development Server**: http://localhost:3000 (Next.js default)
- **Supabase Local API**: http://localhost:54321 (when using local Supabase)
- **Supabase Local DB**: postgresql://postgres:postgres@localhost:54322/postgres
- **Supabase Studio**: http://localhost:54323 (local database admin)

## Key Dependencies

### Production Dependencies
```json
{
  "@hookform/resolvers": "^5.1.1",
  "@radix-ui/react-*": "Various Radix UI primitives",
  "@stripe/react-stripe-js": "^3.7.0",
  "@stripe/stripe-js": "^7.5.0",
  "@supabase/ssr": "^0.6.1",
  "@supabase/supabase-js": "^2.52.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.525.0",
  "next": "15.4.2",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-hook-form": "^7.60.0",
  "stripe": "^18.3.0",
  "tailwind-merge": "^3.3.1",
  "zod": "^4.0.5"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.4.2",
  "prettier": "^3.6.2",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

## Integration Points

### External Services
- **Supabase**: Database, authentication, real-time subscriptions, and storage
- **Stripe**: Payment processing, subscription management, and billing
- **Vercel**: Recommended deployment platform for Next.js applications

### Internal Integrations
- **TypeScript Path Mapping**: `@/*` for clean imports
- **Supabase Client**: Configured for both client and server-side operations
- **Stripe Integration**: Client and server-side payment processing
- **Middleware**: Authentication and route protection
- **API Routes**: Server-side business logic and webhook handling

## Performance Considerations
- **Next.js App Router**: Server Components for optimal performance
- **Database Optimization**: PostgreSQL indexes and query optimization
- **Real-time Features**: Supabase subscriptions for live updates
- **Static Generation**: Next.js static generation where appropriate
- **Image Optimization**: Next.js Image component for optimized loading
- **Bundle Optimization**: Tree shaking and code splitting enabled