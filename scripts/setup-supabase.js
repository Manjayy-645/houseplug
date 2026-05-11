
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase environment variables in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('--- Setting up Storage ---');
  try {
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('verifications', {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('Bucket "verifications" already exists.');
      } else {
        throw bucketError;
      }
    } else {
      console.log('Bucket "verifications" created successfully.');
    }
  } catch (err) {
    console.error('Error creating bucket:', err.message);
  }

  console.log('\n--- Searching for profiles to promote ---');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError.message);
    return;
  }

  if (profiles.length === 0) {
    console.log('No profiles found in the database. Please sign up first.');
    return;
  }

  console.log('Found profiles:');
  profiles.forEach(p => console.log(`- ${p.email} (${p.full_name}) [Current Role: ${p.role}]`));

  // Try to find the user by common email (from git log) or just promote all for now if it's a dev environment
  const targetEmail = 'ezekielmanji645@gmail.com'; 
  const target = profiles.find(p => p.email === targetEmail) || profiles[0];

  console.log(`\nPromoting ${target.email} to admin...`);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', target.id);

  if (updateError) {
    console.error('Error updating role:', updateError.message);
  } else {
    console.log(`Success! ${target.email} is now an admin.`);
  }
}

setup();
