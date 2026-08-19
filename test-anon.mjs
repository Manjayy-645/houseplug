import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const res = await supabase.from('listings').select('*, landlord:profiles!landlord_id(id)').limit(1)
console.log(JSON.stringify(res, null, 2))
