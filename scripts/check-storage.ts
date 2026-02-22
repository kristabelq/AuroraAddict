import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  try {
    console.log('\n🔍 Checking Supabase Storage for profile image...\n');

    const userId = 'cmlxqyzuz00003dz6nbmqlkks';

    // List files in the user's profiles folder
    const { data: files, error } = await supabase.storage
      .from('profiles')
      .list(userId, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('❌ Error listing files:', error);
      return;
    }

    console.log(`Found ${files?.length || 0} files in profiles/${userId}/:\n`);

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   Size: ${(file.metadata.size / 1024).toFixed(2)} KB`);
        console.log(`   Created: ${file.created_at}`);
        console.log(`   Updated: ${file.updated_at}`);

        // Check if this is the expected file
        if (file.name.includes('1771771025847-qjekhl')) {
          console.log('   ✅ THIS IS THE EXPECTED FILE!\n');

          // Get public URL
          const { data } = supabase.storage
            .from('profiles')
            .getPublicUrl(`${userId}/${file.name}`);

          console.log(`   📎 Public URL: ${data.publicUrl}\n`);
        } else {
          console.log('');
        }
      });
    } else {
      console.log('❌ No files found in profiles folder');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStorage();
