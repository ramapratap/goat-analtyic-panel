// server/config/database.ts - NEW_DB Only Configuration
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let newDbConnection: Db | null = null;
let newClient: MongoClient | null = null;

// Connect to NEW database only
export const connectToNewDatabase = async (): Promise<void> => {
  try {
    const NEW_DB_URI = process.env.NEW_DB_URI;
    
    if (!NEW_DB_URI) {
      throw new Error('NEW_DB_URI environment variable is not defined');
    }

    console.log('Connecting to NEW database...');
    
    newClient = new MongoClient(NEW_DB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await newClient.connect();
    newDbConnection = newClient.db(); // Uses default database from connection string
    
    console.log('✅ Connected to NEW database successfully');
    
    // Test the connection
    await newDbConnection.admin().ping();
    console.log('✅ NEW database ping successful');
    
  } catch (error) {
    console.error('❌ Failed to connect to NEW database:', error);
    throw error;
  }
};

// Get NEW database connection
export const getNewDb = (): Db => {
  if (!newDbConnection) {
    throw new Error('NEW database not connected. Call connectToNewDatabase() first.');
  }
  return newDbConnection;
};

// Close database connections
export const closeDatabaseConnections = async (): Promise<void> => {
  try {
    if (newClient) {
      await newClient.close();
      console.log('✅ NEW database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

// Health check for database
export const checkDatabaseHealth = async (): Promise<{ newDb: boolean }> => {
  const health = {
    newDb: false
  };

  try {
    if (newDbConnection) {
      await newDbConnection.admin().ping();
      health.newDb = true;
    }
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  return health;
};

// Initialize database connections
export const initializeDatabases = async (): Promise<void> => {
  try {
    await connectToNewDatabase();
    console.log('✅ All database connections initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Gracefully shutting down database connections...');
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Gracefully shutting down database connections...');
  await closeDatabaseConnections();
  process.exit(0);
});