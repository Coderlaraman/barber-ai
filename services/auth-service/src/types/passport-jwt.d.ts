declare module 'passport-jwt' {
  export interface StrategyOptions {
    jwtFromRequest: any
    ignoreExpiration?: boolean
    secretOrKey: string | Buffer
    algorithms?: string[]
    audience?: string
    clockTolerance?: number
    complete?: boolean
    issuer?: string
    jsonWebTokenOptions?: any
    maxAge?: string | number
    passReqToCallback?: boolean
  }

  export interface VerifyCallback {
    (error: any, user?: any, info?: any): void
  }

  export class Strategy {
    constructor(options: StrategyOptions, verify: (payload: any, done: VerifyCallback) => void)
    name: string
  }

  export namespace ExtractJwt {
    export function fromAuthHeaderAsBearerToken(): (req: any) => string | null
    export function fromHeader(header_name: string): (req: any) => string | null
    export function fromBodyField(field_name: string): (req: any) => string | null
    export function fromUrlQueryParameter(param_name: string): (req: any) => string | null
    export function fromAuthHeaderWithScheme(auth_scheme: string): (req: any) => string | null
    export function fromExtractors(extractors: Array<(req: any) => string | null>): (req: any) => string | null
  }
}