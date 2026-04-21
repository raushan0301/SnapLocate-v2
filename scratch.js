import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({path: 'server/.env'})

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function check() {
  const { data } = await supabaseAdmin.from('course_materials').select('description').textSearch('title', 'Announcements').limit(1)
  console.log("DB DATA:", data)
}
check()
