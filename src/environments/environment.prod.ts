export const environment = {
  production: true,
  minLogLevel: 'WARN', // In production, suppress DEBUG and INFO logs
  sentry: {
    enabled: true,
    dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
    environment: 'production',
    tracesSampleRate: 0.2,
  },
};
