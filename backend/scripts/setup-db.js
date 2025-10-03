const { execSync } = require('child_process');
const path = require('path');

console.log('Setting up database...');

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run migrations
  console.log('Running database migrations...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });

  // Seed the database
  console.log('Seeding database...');
  execSync('npx prisma db seed', { stdio: 'inherit' });

  console.log('Database setup completed successfully!');
  console.log('You can view your database with: npm run db:studio');
} catch (error) {
  console.error('Database setup failed:', error.message);
  process.exit(1);
}
