import type { NextApiRequest, NextApiResponse } from 'next/types';
import { validateCredentials } from '../../controllers/user';
import { isAuthenticated, setAuthentication } from '../../util/auth';
import { APIServiceError, AuthError, makeError, ServerError, UserError } from '../../util/error';
import logger from '../../util/winston';

const post_handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, password } = req.body;

  try {
    await isAuthenticated(req, res);
    res.status(200).end();

    logger.info('/api/auth - post handler - no reauthentication required');
    return;
  } catch (e) {
    if (e instanceof AuthError) {
      if (!username || !password) throw makeError('user', 'Missing required auth field');

      const valid = await validateCredentials(username, password);
      if (valid) {
        setAuthentication(req, res);
      }

      res.status(200).end();
      return;
    }

    throw e;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
    case 'POST':
      await post_handler(req, res);
      return;
    default:
      res.status(405).end();
    }
  } catch (e) {
    if (e instanceof APIServiceError) {
      if (e instanceof UserError) {
        res.status(400).json({ error: e.message });
      } else if (e instanceof ServerError || e instanceof AuthError) {
        res.status(500).json({ error: e.message });
      }
    } else {
      logger.error(`file/id - uncaught error ${e}`);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
}
