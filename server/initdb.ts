/**
 * Database initialization script
 * Creates default admin user and sample data for production deployment
 */
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, operations } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');

    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@app.com')).limit(1);
    
    if (existingAdmin.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const [adminUser] = await db.insert(users).values({
        email: 'admin@app.com',
        password: hashedPassword,
        role: 'admin'
      }).returning();

      console.log('✅ Admin user created:', adminUser.email);

      // Create sample operations
      const sampleOperations = [
        {
          userId: adminUser.id,
          type: 'BUY' as const,
          amount: '1000.00',
          currency: 'USD'
        },
        {
          userId: adminUser.id,
          type: 'SELL' as const,
          amount: '500.00',
          currency: 'EUR'
        },
        {
          userId: adminUser.id,
          type: 'BUY' as const,
          amount: '0.5',
          currency: 'BTC'
        }
      ];

      await db.insert(operations).values(sampleOperations);
      console.log('✅ Sample operations created');
    } else {
      console.log('ℹ️ Admin user already exists, skipping initialization');
    }

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}