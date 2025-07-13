import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Use environment variables for database connections
const OLD_DB_URI = process.env.OLD_DB_URI || '';
const NEW_DB_URI = process.env.NEW_DB_URI || '';

if (!OLD_DB_URI || !NEW_DB_URI) {
  console.error('Database URIs not configured. Please set OLD_DB_URI and NEW_DB_URI environment variables.');
}

let oldDbClient: MongoClient;
let newDbClient: MongoClient;
let oldDb: Db;
let newDb: Db;

export const connectDatabases = async () => {
  try {
    if (!OLD_DB_URI || !NEW_DB_URI) {
      throw new Error('Database URIs not configured');
    }

    // Connect to old database
    oldDbClient = new MongoClient(OLD_DB_URI);
    await oldDbClient.connect();
    oldDb = oldDbClient.db('GOAT_activation_database');
    console.log('Connected to old database');

    // Connect to new database  
    newDbClient = new MongoClient(NEW_DB_URI);
    await newDbClient.connect();
    newDb = newDbClient.db('GOAT_activation_database');
    console.log('Connected to new database');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const getOldDb = (): Db => {
  if (!oldDb) {
    throw new Error('Old database not connected');
  }
  return oldDb;
};

export const getNewDb = (): Db => {
  if (!newDb) {
    throw new Error('New database not connected');
  }
  return newDb;
};

export const closeDatabases = async () => {
  if (oldDbClient) {
    await oldDbClient.close();
  }
  if (newDbClient) {
    await newDbClient.close();
  }
};