import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({path: 'server/.env'})
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
supabase.from('course_materials').select('description').textSearch('title', 'Syllabus').limit(1).then(({data}) => console.log(data[0].description))
