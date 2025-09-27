import { setupServer } from 'msw/node';
import { socialHandlers } from './handlers/socialHandlers';

export const server = setupServer(...socialHandlers);

export { handlers } from './handlers';