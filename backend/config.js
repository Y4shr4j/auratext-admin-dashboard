// AuraText Admin Dashboard Configuration
module.exports = {
  PORT: process.env.PORT || 3001,
  API_KEY: process.env.API_KEY || 'auratext_secret_key_2024_launch_secure',
  DATABASE_PATH: process.env.DATABASE_PATH || './analytics.db',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};
