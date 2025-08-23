# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Foxon is a Next.js 15 workout tracking application built with React 19, Prisma ORM, PostgreSQL, and Tailwind CSS. It features a mobile-first design focused on workout session logging with a devotion scoring system.

## Development Commands

```bash
# Start development server (usually already running)
npm run dev

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes to database
npm run db:migrate     # Create and run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with initial data

# Code quality
npm run lint           # Run ESLint
npm run build          # Build for production (includes PWA service worker generation)
```

## PWA Features

Foxon is configured as a Progressive Web App with:
- **Add to Home Screen (A2HS)** support on iOS, Android, and desktop
- **Offline functionality** with strategic caching
- **App-like experience** with standalone display mode
- **Service worker** for background sync and caching
- **Web App Manifest** with complete metadata

**Important**: Before production deployment, generate real PWA icons to replace placeholders in `/public/icons/`. See `PWA_SETUP.md` for complete instructions.

## Architecture Overview

### Data Layer
- **Prisma ORM** with PostgreSQL database (required - no direct DB connections)
- **Service Layer Pattern**: All database operations through services in `src/services/`
- **Mock Authentication**: Currently uses mock user data (`src/lib/auth.ts`)
- **User Reference**: Always use User table `id`, not `clerkUserId` for relationships

### Core Domain Models
- **User**: Profile management with weekly goals and progression states
- **Workout**: User-created workout templates with exercises and target sets
- **Session**: Active workout sessions with devotion scoring system
- **Exercise/MuscleGroup/Equipment**: Shared vocabulary for workout components

### Key Features
- **Devotion Scoring**: 4-pillar system (EC, SC, RF, LF) scoring workout adherence
- **Progressive Workout States**: SLIM → FIT → STRONG → FIERY
- **Session Management**: Active sessions with real-time set tracking
- **Mobile-First UI**: Touch-optimized with wheel pickers and haptic feedback

### Component Architecture
```
src/components/
├── ui/                 # Base shadcn components (generic)
├── navigation/         # App navigation components
├── workout/           # Workout-specific components
├── session/           # Session tracking components
├── profile/           # User profile components
└── review/           # Session review and analytics
```

### State Management
- **React Hooks**: Custom hooks in `src/hooks/` for state logic
- **In-Memory Session**: `useInMemorySession` for active workout state
- **Server Components**: Database operations in API routes and server components

## Development Guidelines

### Database Integration
- Use Prisma client exclusively (`import { prisma } from '@/lib/prisma'`)
- All database operations in service classes under `src/services/`
- Reference users by `User.id`, not `clerkUserId`

### Component Development
- Use `'use client'` directive for client components
- Prefer shadcn/ui components over custom UI components
- Use Tailwind CSS for all styling
- Use Lucide React for icons
- Follow mobile-first responsive design patterns

### Commit Messages
Use conventional format: `Type(scope): description`
- `Feat(component): add new component`
- `Fix(api): fix api error`  
- `Refactor(utils): refactor utils`

### File Organization
- Feature-based component organization under domain folders
- Server components for data fetching, client components for interactivity
- Custom hooks for complex state logic
- Type definitions in `src/lib/types/`

## Testing Notes
- No specific test runner configured
- Manual testing through dev server recommended
- Prisma Studio available for database inspection