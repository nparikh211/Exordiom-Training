// Simple Node.js script to create Supabase migration files without the CLI
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Generate a timestamp and random name for the migration
const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const adjectives = ['amber', 'autumn', 'blue', 'bold', 'brave', 'bright', 'calm', 'crimson', 'crystal', 'delicate', 'divine', 'dry', 'empty', 'fancy', 'fast', 'fresh', 'gentle', 'green', 'hidden', 'holy', 'icy', 'jolly', 'late', 'lingering', 'little', 'lively', 'lucky', 'misty', 'mute', 'nameless', 'noisy', 'patient', 'proud', 'purple', 'quiet', 'rapid', 'red', 'restless', 'rough', 'round', 'royal', 'sharp', 'silent', 'silver', 'smooth', 'snowy', 'soft', 'solar', 'sparkling', 'spring', 'still', 'summer', 'sweet', 'swift', 'tiny', 'twilight', 'wandering', 'weathered', 'white', 'wild', 'winter', 'yellow', 'young'];
const nouns = ['art', 'band', 'bar', 'base', 'bird', 'block', 'boat', 'bonus', 'bread', 'breeze', 'brook', 'bush', 'butterfly', 'cake', 'cell', 'cherry', 'cloud', 'credit', 'darkness', 'dawn', 'dew', 'disk', 'dream', 'dust', 'feather', 'field', 'fire', 'firefly', 'flower', 'fog', 'forest', 'frog', 'frost', 'glade', 'glitter', 'grass', 'hall', 'hat', 'haze', 'heart', 'hill', 'king', 'lab', 'lake', 'leaf', 'limit', 'math', 'meadow', 'mode', 'moon', 'morning', 'mountain', 'mouse', 'mud', 'night', 'paper', 'pine', 'poetry', 'pond', 'queen', 'rain', 'recipe', 'resonance', 'rice', 'river', 'rock', 'sea', 'shadow', 'shape', 'silence', 'sky', 'smoke', 'snow', 'snowflake', 'sound', 'star', 'sun', 'sun', 'sunset', 'surf', 'term', 'thunder', 'tiger', 'toast', 'tooth', 'tree', 'truth', 'union', 'unit', 'violet', 'voice', 'water', 'waterfall', 'wave', 'wildflower', 'wind', 'wood'];

const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
const randomName = `${randomAdjective}_${randomNoun}`;

// Get the migration name from command-line arguments
const args = process.argv.slice(2);
const migrationName = args[0] || 'migration';

// Create the migration file name
const migrationFileName = `${timestamp}_${randomName}.sql`;
const migrationFilePath = path.join(migrationsDir, migrationFileName);

// Create empty migration file
fs.writeFileSync(migrationFilePath, `/*
  # ${migrationName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

  This migration file was created manually.
*/

-- Write your SQL migration code here:

`, 'utf8');

console.log(`Migration file created at: ${migrationFilePath}`);