export const storageConfig = {
  digitalOcean: {
    key: process.env.DO_SPACES_KEY,
    secret: process.env.DO_SPACES_SECRET,
    endpoint: process.env.DO_SPACES_ENDPOINT,
    bucket: process.env.DO_SPACES_BUCKET,
    region: process.env.DO_SPACES_REGION,
  },
};

export const validateStorageConfig = () => {
  if (!process.env.DO_SPACES_KEY) {
    throw new Error('DO_SPACES_KEY environment variable is required');
  }
  if (!process.env.DO_SPACES_SECRET) {
    throw new Error('DO_SPACES_SECRET environment variable is required');
  }
  if (!process.env.DO_SPACES_ENDPOINT) {
    throw new Error('DO_SPACES_ENDPOINT environment variable is required');
  }
  if (!process.env.DO_SPACES_BUCKET) {
    throw new Error('DO_SPACES_BUCKET environment variable is required');
  }
};