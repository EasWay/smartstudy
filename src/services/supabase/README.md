# Supabase Database Setup

This directory contains the database setup and migration files for the Ghana Education App.

## Profiles Table Setup

### 1. Run the Migration

Copy and paste the SQL from `migrations/001_create_profiles_table.sql` into your Supabase dashboard SQL editor and execute it.

Alternatively, you can use the setup utility:

```typescript
import { DatabaseSetup } from './setup';

// This will log the SQL to run in Supabase dashboard
await DatabaseSetup.createProfilesTable();
```

### 2. Test the Setup

After running the migration, test that everything works:

```typescript
import { ProfilesTableTest } from '../../utils/profilesTableTest';

// Run all tests
await ProfilesTableTest.runAllTests();
```

Or run the test script:

```bash
npx ts-node src/scripts/testProfilesTable.ts
```

### 3. Database Schema

The profiles table extends Supabase's built-in `auth.users` table with additional fields:

- `id` - UUID (references auth.users)
- `username` - Unique username
- `full_name` - User's full name
- `avatar_url` - Profile picture URL
- `school` - School name
- `grade_level` - Educational level
- `subjects_of_interest` - Array of subjects
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-updated)

### 4. Row Level Security (RLS)

The table has RLS enabled with policies that allow users to:
- View their own profile
- Insert their own profile
- Update their own profile

### 5. Automatic Profile Creation

A trigger automatically creates a profile when a new user signs up through Supabase Auth.

## Usage

```typescript
import { DatabaseService } from './database';

// Create a profile
const { data, error } = await DatabaseService.createProfile(userId, {
  username: 'john_doe',
  full_name: 'John Doe',
  school: 'Ghana International School',
  grade_level: 'SHS 2',
  subjects_of_interest: ['Mathematics', 'Physics', 'Chemistry']
});

// Get a profile
const { data, error } = await DatabaseService.getProfile(userId);

// Update a profile
const { data, error } = await DatabaseService.updateProfile(userId, {
  school: 'New School Name'
});
```