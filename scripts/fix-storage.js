const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgqypgffyuvszdlqcwst.supabase.co';
const serviceKey = 'sb_secret_egnYb8JZnaStv1DvXcHzLg_bkE76O9w';

async function setup() {
  const supabase = createClient(supabaseUrl, serviceKey);

  const buckets = ['avatars', 'listings', 'verifications'];

  for (const b of buckets) {
    console.log(`Creating/checking bucket: ${b}...`);
    const isPublic = b !== 'verifications';
    const { data, error } = await supabase.storage.createBucket(b, {
      public: isPublic,
      fileSizeLimit: 2 * 1024 * 1024 // 2MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`Bucket "${b}" already exists.`);
      } else {
        console.error(`Error creating bucket "${b}":`, error.message);
      }
    } else {
      console.log(`Bucket "${b}" created successfully.`);
    }
  }
}

setup();
