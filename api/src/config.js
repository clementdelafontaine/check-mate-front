export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://checkmate:checkmate@localhost:5432/checkmate',
  corsOrigin: process.env.CORS_ORIGIN ?? '*'
}
