import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env variables
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '';
let key = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
        url = line.split('=')[1].trim();
    } else if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        key = line.split('=')[1].trim();
    }
});

const supabase = createClient(url, key);

async function checkDatabase() {
    console.log('Checking friendships... ');
    const { data, error } = await supabase.from('friendships').select('*').limit(1);
    
    if (error) {
        console.error('Error fetching friendships:', error);
    } else {
        console.log('Friendships data:', data);
    }
}

checkDatabase();
