import { setupServer } from 'msw/node';
import { socialHandlers } from './handlers/socialHandlers';
import { userPreferencesHandlers } from './handlers/userPreferencesHandlers';

export const server = setupServer(...socialHandlers, ...userPreferencesHandlers);

export { handlers } from './handlers';