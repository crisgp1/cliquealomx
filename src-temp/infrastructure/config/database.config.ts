export const databaseConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
};

export const validateDatabaseConfig = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }
};