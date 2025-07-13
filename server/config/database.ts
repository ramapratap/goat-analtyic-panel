import { MongoClient, Db } from 'mongodb';

// Database connections
const OLD_DB_URI = 'mongodb+srv://team:Subral123@cluster0.4gfr7tb.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true';
const NEW_DB_URI = 'mongodb+srv://goatdb:goatdb@cluster1.by7y1c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1&tls=true&tlsAllowInvalidCertificates=true';

let oldDbClient: MongoClient;
let newDbClient: MongoClient;
let oldDb: Db;
let newDb: Db;

export const connectDatabases = async () => {
  try {
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