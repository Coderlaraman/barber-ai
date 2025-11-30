declare module 'express' {
  export interface Request {
    ip: string
    get(header: string): string | undefined
  }
}