/**
 * Admin Seed Script
 * 
 * This script creates an admin user in Supabase Auth and sets their role.
 * Run with: npm run seed:admin
 * 
 * Requirements:
 * - SUPABASE_SERVICE_ROLE_KEY environment variable
 * - Node.js environment with supabase-js
 */

import { createClient } from '@supabase/supabase-js';
import { ADMIN_CREDENTIALS } from '../src/config/admin';

const SUPABASE_URL = "https://oezojxutetaurmrzurcj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedAdmin() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(
      ADMIN_CREDENTIALS.email
    );

    let userId: string;

    if (existingUser.user) {
      console.log('Admin user already exists, updating...');
      userId = existingUser.user.id;
      
      // Update existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUser(
        userId,
        {
          app_metadata: { role: 'ADMIN' },
          user_metadata: { username: 'admin' }
        }
      );

      if (updateError) {
        throw updateError;
      }
    } else {
      console.log('Creating new admin user...');
      
      // Create new admin user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password,
        email_confirm: true,
        app_metadata: { role: 'ADMIN' },
        user_metadata: { username: 'admin' }
      });

      if (createError) {
        throw createError;
      }

      if (!newUser.user) {
        throw new Error('Failed to create admin user');
      }

      userId = newUser.user.id;
    }

    console.log('Ensuring admin profile exists in public.users...');
    
    // Ensure profile exists in public.users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        auth_user_id: userId,
        email: ADMIN_CREDENTIALS.email,
        username: 'admin',
        role: 'ADMIN',
        active: true
      }, {
        onConflict: 'auth_user_id'
      });

    if (profileError) {
      throw profileError;
    }

    console.log('✅ Admin user setup completed successfully!');
    console.log(`Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`Password: ${ADMIN_CREDENTIALS.password}`);
    console.log('You can now sign in as admin.');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    process.exit(1);
  }
}

// Fallback SQL for manual execution
console.log(`
📝 Manual Setup (if script fails):
Run this SQL in your Supabase SQL Editor:

UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || jsonb_build_object('role','ADMIN')
WHERE email='${ADMIN_CREDENTIALS.email}';
`);

seedAdmin();