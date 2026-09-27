import { ENV } from './env';
import { APP_CONFIG } from '../constants/app';

export const appConfig = {
  ...APP_CONFIG,
  env: ENV,
  network: {
    requestTimeoutMs: 30000,
    maxRetries: 3,
  },
};

export default appConfig;
