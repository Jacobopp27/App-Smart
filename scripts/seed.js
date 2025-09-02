/**
 * Database Seeding Script for TechTest Application
 * 
 * This script creates an admin user for development and testing purposes.
 * It demonstrates secure password hashing with bcrypt and proper error handling.
 * 
 * Usage:
 *   node scripts/seed.js
 * 
 * What this script does:
 * 1. Connects to the PostgreSQL database
 * 2. Checks if admin user already exists
 * 3. Creates admin user with hashed password if not exists
 * 4. Provides feedback on the operation
 */

import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Default admin user configuration
 * These credentials are used for initial setup and testing
 * IMPORTANT: Change these in production environments
 */
const ADMIN_USER = {
  email: 'admin@app.com',
  password: 'admin123',
  role: 'admin'
};

/**
 * Seed admin user function
 * Creates the admin user with secure password hashing
 * Uses bcrypt with 12 salt rounds for security
 */
async function seedAdminUser() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if admin user already exists
    // This prevents duplicate user creation on multiple script runs
    console.log('📋 Checking if admin user exists...');
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_USER.email))
      .limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists!');
      console.log(`   Email: ${ADMIN_USER.email}`);
      console.log(`   Role: ${existingAdmin[0].role}`);
      console.log('   Use these credentials to login to the application.');
      return;
    }
    
    // Hash the password using bcrypt
    // bcrypt is used because it:
    // - Automatically handles salt generation
    // - Is resistant to timing attacks
    // - Uses adaptive hashing (can increase security over time)
    // - Is industry standard for password hashing
    console.log('🔐 Hashing admin password...');
    const saltRounds = 12; // Higher rounds = more secure but slower
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, saltRounds);
    
    // Create the admin user in the database
    // Uses Drizzle ORM's insert method with returning clause
    console.log('👤 Creating admin user...');
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: ADMIN_USER.email,
        password: hashedPassword,
        role: ADMIN_USER.role
      })
      .returning();
    
    // Success feedback
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${ADMIN_USER.email}`);
    console.log(`   Password: ${ADMIN_USER.password}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   User ID: ${newAdmin.id}`);
    console.log('');
    console.log('🚀 You can now start the application and login with these credentials.');
    console.log('   npm run dev');
    console.log('   http://localhost:5000');
    
  } catch (error) {
    // Error handling with helpful messages
    console.error('❌ Error seeding database:', error);
    
    // Provide specific guidance based on error type
    if (error.message.includes('database') || error.message.includes('connection')) {
      console.error('');
      console.error('💡 Database connection failed. Please check:');
      console.error('   1. PostgreSQL is running');
      console.error('   2. DATABASE_URL in .env is correct');
      console.error('   3. Database exists and is accessible');
      console.error('   4. Run "npm run db:push" to create tables');
    } else if (error.message.includes('unique') || error.message.includes('duplicate')) {
      console.error('');
      console.error('💡 User already exists. This is normal if you\'ve run the seed script before.');
    } else {
      console.error('');
      console.error('💡 Unexpected error. Please check:');
      console.error('   1. All dependencies are installed (npm install)');
      console.error('   2. Environment variables are set correctly');
      console.error('   3. Database schema is up to date (npm run db:push)');
    }
    
    process.exit(1);
  }
}

/**
 * Seed sample operations function (optional)
 * Creates sample operations for demonstration purposes
 * Only runs if admin user is successfully created
 */
async function seedSampleOperations(adminUserId) {
  try {
    console.log('📊 Creating sample operations...');
    
    // Import operations schema
    const { operations } = await import('../shared/schema.js');
    
    // Sample operations data for demonstration
    const sampleOperations = [
      {
        type: 'BUY',
        amount: '1250.00',
        currency: 'USD',
        userId: adminUserId
      },
      {
        type: 'SELL',
        amount: '850.75',
        currency: 'EUR',
        userId: adminUserId
      },
      {
        type: 'BUY',
        amount: '0.0234',
        currency: 'BTC',
        userId: adminUserId
      },
      {
        type: 'SELL',
        amount: '2100.50',
        currency: 'USD',
        userId: adminUserId
      },
      {
        type: 'BUY',
        amount: '450.25',
        currency: 'EUR',
        userId: adminUserId
      }
    ];
    
    // Insert sample operations
    await db.insert(operations).values(sampleOperations);
    
    console.log(`✅ Created ${sampleOperations.length} sample operations`);
    
  } catch (error) {
    // Non-fatal error - app can work without sample data
    console.warn('⚠️  Could not create sample operations:', error.message);
    console.log('   This is not critical - you can create operations manually.');
  }
}

/**
 * Validate environment function
 * Checks required environment variables before seeding
 */
function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   ${varName}`);
    });
    console.error('');
    console.error('💡 Please check your .env file and ensure all required variables are set.');
    console.error('   Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
}

/**
 * Main execution function
 * Orchestrates the entire seeding process
 */
async function main() {
  console.log('🚀 TechTest Database Seeding Script');
  console.log('=====================================');
  console.log('');
  
  try {
    // Validate environment before proceeding
    validateEnvironment();
    
    // Seed admin user (required)
    await seedAdminUser();
    
    // Ask user if they want sample data (interactive mode)
    if (process.argv.includes('--with-samples')) {
      const adminUser = await db
        .select()
        .from(users)
        .where(eq(users.email, ADMIN_USER.email))
        .limit(1);
      
      if (adminUser.length > 0) {
        await seedSampleOperations(adminUser[0].id);
      }
    }
    
    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Start the application: npm run dev');
    console.log('   2. Open browser: http://localhost:5000');
    console.log('   3. Login with the admin credentials above');
    console.log('   4. Start creating operations!');
    
    // Hint about sample data
    if (!process.argv.includes('--with-samples')) {
      console.log('');
      console.log('💡 Tip: Run with --with-samples to create sample operations:');
      console.log('   node scripts/seed.js --with-samples');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    // Ensure database connection is closed
    process.exit(0);
  }
}

/**
 * Handle script interruption gracefully
 * Ensures clean exit on Ctrl+C or other signals
 */
process.on('SIGINT', () => {
  console.log('\n⚠️  Seeding interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Seeding terminated');
  process.exit(1);
});

// Execute main function if script is run directly
// This allows the module to be imported without executing automatically
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export functions for potential reuse
export { seedAdminUser, seedSampleOperations, validateEnvironment };
