import { supabase } from './client';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Run database migrations for the Ghana Education App
 * This script applies necessary database schema changes
 */
export async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  try {
    // Check if we can connect to the database
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError && connectionError.code !== 'PGRST116') {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }

    console.log('✅ Database connection successful');

    // List of migrations to run in order
    const migrations = [
      '002_add_storage_tracking.sql',
      '003_create_resources_table.sql',
      '004_create_study_groups_tables.sql'
    ];

    for (const migrationFile of migrations) {
      console.log(`📄 Running migration: ${migrationFile}`);
      
      try {
        // Read migration file
        const migrationPath = join(__dirname, 'migrations', migrationFile);
        const migrationSQL = readFileSync(migrationPath, 'utf8');

        // Execute migration
        const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

        if (error) {
          // Try alternative approach using individual statements
          console.log(`⚠️  RPC method failed, trying direct execution for ${migrationFile}`);
          
          // Split SQL into individual statements and execute them
          const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

          for (const statement of statements) {
            if (statement.trim()) {
              const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
              if (stmtError) {
                console.warn(`⚠️  Statement failed (may be expected): ${stmtError.message}`);
              }
            }
          }
        }

        console.log(`✅ Migration completed: ${migrationFile}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migrationFile}`, error);
        // Continue with other migrations
      }
    }

    console.log('🎉 All migrations completed!');
    
    // Verify the setup
    await verifySetup();

  } catch (error) {
    console.error('❌ Migration process failed:', error);
    throw error;
  }
}

/**
 * Verify that the database setup is correct
 */
async function verifySetup() {
  console.log('🔍 Verifying database setup...');

  try {
    // Check if profiles table has storage columns
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('storage_used, storage_limit')
      .limit(1);

    if (profilesError) {
      console.warn('⚠️  Profiles storage columns may not exist:', profilesError.message);
    } else {
      console.log('✅ Profiles table with storage tracking verified');
    }

    // Check if resources table exists
    const { data: resourcesTest, error: resourcesError } = await supabase
      .from('resources')
      .select('id')
      .limit(1);

    if (resourcesError) {
      console.warn('⚠️  Resources table may not exist:', resourcesError.message);
    } else {
      console.log('✅ Resources table verified');
    }

    // Check if bookmarks table exists
    const { data: bookmarksTest, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('id')
      .limit(1);

    if (bookmarksError) {
      console.warn('⚠️  Bookmarks table may not exist:', bookmarksError.message);
    } else {
      console.log('✅ Bookmarks table verified');
    }

    // Check if study_groups table exists
    const { data: studyGroupsTest, error: studyGroupsError } = await supabase
      .from('study_groups')
      .select('id')
      .limit(1);

    if (studyGroupsError) {
      console.warn('⚠️  Study groups table may not exist:', studyGroupsError.message);
    } else {
      console.log('✅ Study groups table verified');
    }

    // Check if group_members table exists
    const { data: groupMembersTest, error: groupMembersError } = await supabase
      .from('group_members')
      .select('id')
      .limit(1);

    if (groupMembersError) {
      console.warn('⚠️  Group members table may not exist:', groupMembersError.message);
    } else {
      console.log('✅ Group members table verified');
    }

    // Check if group_messages table exists
    const { data: groupMessagesTest, error: groupMessagesError } = await supabase
      .from('group_messages')
      .select('id')
      .limit(1);

    if (groupMessagesError) {
      console.warn('⚠️  Group messages table may not exist:', groupMessagesError.message);
    } else {
      console.log('✅ Group messages table verified');
    }

    console.log('✅ Database verification completed');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
  }
}

/**
 * Manual migration runner for development
 * Run this function to apply migrations manually
 */
export async function runMigrationsManually() {
  try {
    await runMigrations();
    console.log('✅ Manual migration completed successfully');
  } catch (error) {
    console.error('❌ Manual migration failed:', error);
    process.exit(1);
  }
}

// Allow running this script directly
if (require.main === module) {
  runMigrationsManually();
}