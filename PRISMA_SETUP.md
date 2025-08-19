# Prisma + Supabase Setup Guide

This project is now configured with Prisma ORM connected to a Supabase PostgreSQL database.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### Getting Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings > Database
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password
5. Go to Settings > API
6. Copy the Project URL and API keys

## Database Setup

### 1. Push Schema to Database
```bash
npm run db:push
```

### 2. Generate Prisma Client
```bash
npm run db:generate
```

### 3. Seed Database (Optional)
```bash
npm run db:seed
```

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Database Schema

The current schema includes:

### User
- Basic user information
- Relationships to workout sessions

### Workout
- Workout templates with exercises stored as JSON
- Flexible structure for different exercise types

### WorkoutSession
- Individual workout sessions
- Links users to workouts with completion data
- Stores actual performed exercises with sets/reps/weights

## Usage in Code

### Mock Authentication (for testing)
```typescript
import { getCurrentUser, getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get the current mock user
const user = getCurrentUser()
const userId = getCurrentUserId()

// Example: Get user's workouts
const workouts = await prisma.workout.findMany({
  where: { userId },
  include: {
    workoutItems: {
      include: {
        exercise: true,
        workoutItemSets: true
      }
    }
  }
})

// Example: Create a workout session
const session = await prisma.session.create({
  data: {
    userId,
    workoutId: 'workout-1',
    status: 'ACTIVE'
  }
})
```

## Next Steps

1. Set up your Supabase project and get the connection details
2. Create your `.env` file with the proper credentials
3. Run `npm run db:push` to create the tables in your database
4. Optionally run `npm run db:seed` to add sample workout data
5. Start building your workout app with Prisma!
