import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
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
const prisma = new PrismaClient();

async function updateProfileImage() {
  try {
    const userId = 'cmlxqyzuz00003dz6nbmqlkks';
    const fileName = '1771772140170-0w7ovo.jpg'; // Most recent file in storage

    console.log('\n🔄 Updating profile image...\n');

    // Get the public URL for this file
    const { data } = supabase.storage
      .from('profiles')
      .getPublicUrl(`${userId}/${fileName}`);

    const imageUrl = data.publicUrl;
    console.log(`📎 Image URL: ${imageUrl}\n`);

    // Update the database
    const user = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    console.log('✅ Profile image updated successfully!');
    console.log(`   Old image: ${user.image === imageUrl ? 'null' : user.image}`);
    console.log(`   New image: ${imageUrl}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProfileImage();
