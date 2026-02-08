import { AuthPayload } from '../middleware/auth';

export type Variables = {
  user: AuthPayload;
};
