export default {
  user: process.env.PG_DB_USER || '',
  host: process.env.PG_DB_HOST || '',
  database: process.env.PG_DB_DATABASE || '',
  password: process.env.PG_DB_PASSWORD || '',
  port: process.env.PG_DB_PORT ? parseInt(process.env.PG_DB_PORT) : 5432,
};