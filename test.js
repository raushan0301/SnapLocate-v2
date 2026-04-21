import dotenv from 'dotenv'
dotenv.config({path: 'server/.env'})
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
supabaseAdmin.from('student_sync_config').select('user_id').limit(1).then(({data}) => console.log(data))
