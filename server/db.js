require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
    console.warn('⚠️ Supabase credentials missing or invalid! Database features will not work.');
    module.exports = {
        from: () => ({
            select: () => Promise.resolve({ error: { message: "Database not configured" } }),
            insert: () => Promise.resolve({ error: { message: "Database not configured" } }),
            update: () => Promise.resolve({ error: { message: "Database not configured" } }),
            delete: () => Promise.resolve({ error: { message: "Database not configured" } })
        })
    };
} else {
    const supabase = createClient(supabaseUrl, supabaseKey);
    module.exports = supabase;
}
