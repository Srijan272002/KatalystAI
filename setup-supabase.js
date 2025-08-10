#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase Migration for Katalyst Calendar\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env.local file not found!');
  console.log('Please create a .env.local file with the following variables:\n');
  
  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (for Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NODE_ENV=development
`;

  console.log(envTemplate);
  process.exit(1);
}

console.log('✅ .env.local file found');

// Check package.json for required dependencies
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const requiredDeps = [
  '@supabase/supabase-js',
  '@supabase/auth-helpers-nextjs',
  '@supabase/auth-helpers-react'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('❌ Missing required dependencies:');
  missingDeps.forEach(dep => console.log(`  - ${dep}`));
  console.log('\nRun the following command to install them:');
  console.log(`npm install ${missingDeps.join(' ')}\n`);
  process.exit(1);
}

console.log('✅ All required dependencies are installed');

// Check if Supabase files exist
const supabaseFiles = [
  'src/lib/supabase/client.ts',
  'src/lib/supabase/auth.ts',
  'src/lib/supabase/calendar.ts',
  'src/lib/supabase/types.ts',
  'src/lib/supabase/schema.sql',
  'src/components/providers/supabase-provider.tsx'
];

const missingFiles = supabaseFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));

if (missingFiles.length > 0) {
  console.log('❌ Missing Supabase files:');
  missingFiles.forEach(file => console.log(`  - ${file}`));
  console.log('\nPlease ensure all migration files are in place.\n');
  process.exit(1);
}

console.log('✅ All Supabase files are in place');

console.log('\n🎉 Setup check completed successfully!');
console.log('\nNext steps:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Update your .env.local with your Supabase credentials');
console.log('3. Set up Google OAuth in your Supabase dashboard');
console.log('4. Run the database schema in Supabase SQL Editor');
console.log('5. Start your development server: npm run dev');
console.log('\nFor detailed instructions, see MIGRATION_GUIDE.md');
