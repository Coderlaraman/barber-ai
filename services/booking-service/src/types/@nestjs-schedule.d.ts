declare module '@nestjs/schedule' {
  export interface ScheduleModuleOptions {
    cron?: boolean;
    timeout?: boolean;
    interval?: boolean;
  }

  export class ScheduleModule {
    static forRoot(options?: ScheduleModuleOptions): any;
  }

  export enum CronExpression {
    EVERY_SECOND = '* * * * * *',
    EVERY_5_SECONDS = '*/5 * * * * *',
    EVERY_10_SECONDS = '*/10 * * * * *',
    EVERY_30_SECONDS = '*/30 * * * * *',
    EVERY_MINUTE = '0 * * * * *',
    EVERY_5_MINUTES = '0 */5 * * * *',
    EVERY_10_MINUTES = '0 */10 * * * *',
    EVERY_30_MINUTES = '0 */30 * * * *',
    EVERY_HOUR = '0 0 * * * *',
    EVERY_2_HOURS = '0 0 */2 * * *',
    EVERY_6_HOURS = '0 0 */6 * * *',
    EVERY_12_HOURS = '0 0 */12 * * *',
    EVERY_DAY_AT_1AM = '0 0 1 * * *',
    EVERY_DAY_AT_2AM = '0 0 2 * * *',
    EVERY_DAY_AT_3AM = '0 0 3 * * *',
    EVERY_DAY_AT_4AM = '0 0 4 * * *',
    EVERY_DAY_AT_5AM = '0 0 5 * * *',
    EVERY_DAY_AT_6AM = '0 0 6 * * *',
    EVERY_DAY_AT_7AM = '0 0 7 * * *',
    EVERY_DAY_AT_8AM = '0 0 8 * * *',
    EVERY_DAY_AT_9AM = '0 0 9 * * *',
    EVERY_DAY_AT_10AM = '0 0 10 * * *',
    EVERY_DAY_AT_11AM = '0 0 11 * * *',
    EVERY_DAY_AT_NOON = '0 0 12 * * *',
    EVERY_DAY_AT_1PM = '0 0 13 * * *',
    EVERY_DAY_AT_2PM = '0 0 14 * * *',
    EVERY_DAY_AT_3PM = '0 0 15 * * *',
    EVERY_DAY_AT_4PM = '0 0 16 * * *',
    EVERY_DAY_AT_5PM = '0 0 17 * * *',
    EVERY_DAY_AT_6PM = '0 0 18 * * *',
    EVERY_DAY_AT_7PM = '0 0 19 * * *',
    EVERY_DAY_AT_8PM = '0 0 20 * * *',
    EVERY_DAY_AT_9PM = '0 0 21 * * *',
    EVERY_DAY_AT_10PM = '0 0 22 * * *',
    EVERY_DAY_AT_11PM = '0 0 23 * * *',
    EVERY_WEEK = '0 0 * * 0 *',
    EVERY_WEEKDAY = '0 0 * * 1-5 *',
    EVERY_WEEKEND = '0 0 * * 6,0 *',
    EVERY_MONTH = '0 0 1 * * *',
    EVERY_QUARTER = '0 0 1 1,4,7,10 * *',
    EVERY_YEAR = '0 0 1 1 * *',
    EVERY_5_SECONDS = '*/5 * * * * *',
    EVERY_10_SECONDS = '*/10 * * * * *',
    EVERY_30_SECONDS = '*/30 * * * * *',
    EVERY_5_MINUTES = '0 */5 * * * *',
    EVERY_10_MINUTES = '0 */10 * * * *',
    EVERY_30_MINUTES = '0 */30 * * * *',
    EVERY_2_HOURS = '0 0 */2 * * *',
    EVERY_6_HOURS = '0 0 */6 * * *',
    EVERY_12_HOURS = '0 0 */12 * * *'
  }

  export function Cron(expression: string): MethodDecorator {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      // Implementation would go here
      return descriptor;
    };
  }

  export function Interval(timeout: number): MethodDecorator {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      // Implementation would go here
      return descriptor;
    };
  }

  export function Timeout(delay: number): MethodDecorator {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      // Implementation would go here
      return descriptor;
    };
  }
}