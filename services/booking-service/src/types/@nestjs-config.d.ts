declare module '@nestjs/config' {
  export interface ConfigModuleOptions {
    isGlobal?: boolean;
    envFilePath?: string | string[];
    ignoreEnvFile?: boolean;
    ignoreEnvVars?: boolean;
    cache?: boolean;
    expandVariables?: boolean;
  }

  export class ConfigModule {
    static forRoot(options?: ConfigModuleOptions): any;
    static forFeature(): any;
  }

  export class ConfigService {
    get<T = any>(propertyPath: string, defaultValue?: T): T;
    getOrThrow<T = any>(propertyPath: string): T;
  }
}