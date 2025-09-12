export const servicesConfig = {
  radar: {
    publishableKey: process.env.RADAR_TEST_PUBLISHABLE_KEY,
    secretKey: process.env.RADAR_TEST_SECRET_KEY,
  },
};

export const validateServicesConfig = () => {
  if (!process.env.RADAR_TEST_PUBLISHABLE_KEY) {
    console.warn('RADAR_TEST_PUBLISHABLE_KEY not found - location services may not work');
  }
  if (!process.env.RADAR_TEST_SECRET_KEY) {
    console.warn('RADAR_TEST_SECRET_KEY not found - location services may not work');
  }
};