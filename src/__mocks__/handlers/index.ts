import { authHandlers } from './auth';
import { providerHandlers } from './providers';
import { rateAlertHandlers } from './rateAlerts';
import { notificationHandlers } from './notifications';
import { profileHandlers } from './profile';
import { searchHandlers } from './search';
import { contentHandlers } from './content';

export const handlers = [
  ...authHandlers,
  ...providerHandlers,
  ...rateAlertHandlers,
  ...notificationHandlers,
  ...profileHandlers,
  ...searchHandlers,
  ...contentHandlers,
];
