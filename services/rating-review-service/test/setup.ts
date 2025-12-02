/// <reference types="jest" />

import 'jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValid(): R;
    }
  }
}