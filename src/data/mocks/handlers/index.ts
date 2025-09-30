import { socialHandlers } from './socialHandlers';
import { userPreferencesHandlers } from './userPreferencesHandlers';

export const handlers = [...socialHandlers, ...userPreferencesHandlers];