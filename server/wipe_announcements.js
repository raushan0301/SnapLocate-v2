import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function wipeAnnouncements() {
  const { data, error } = await supabaseAdmin.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error('Error wiping announcements:', error.message);
  } else {
    console.log('Successfully wiped all announcements.');
  }
}

wipeAnnouncements().then(() => process.exit(0));
