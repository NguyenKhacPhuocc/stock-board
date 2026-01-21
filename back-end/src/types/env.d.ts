declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string
    JWT_SECRET: string
    JWT_EXPIRES_IN: string
  }
}
