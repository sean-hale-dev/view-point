import { randomUUID } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next/types';
import { readKey, writeKey } from './redis';
import Cookies from 'cookies';
import { makeError } from './error';
import logger from './winston';

const cookie_key = "sessionID";

const isAuthenticated = async (req: NextApiRequest, res: NextApiResponse) => {
  const cookies = new Cookies(req, res);

  const session_cookie = cookies.get(cookie_key);
  if (!session_cookie) throw makeError('auth');

  let session_lookup: string | null;
  try {
    session_lookup = await readKey(session_cookie);
  } catch (e) {
    logger.error(`isAuthenticated - redis error ${e}`);
    throw makeError('server');
  }

  if (!session_lookup) throw makeError('auth');
}

const setAuthentication = async (req: NextApiRequest, res: NextApiResponse) => {
  const session_key = 'deersio' + randomUUID(); 
  const session_data = {
    createdOn: new Date(),
  };

  const cookies = new Cookies(req, res);

  cookies.set(cookie_key, session_key);

  try {
    await writeKey(session_key, JSON.stringify(session_data));
  } catch (e) {
    logger.error(`setAuthentication - redis error ${e}`);
    throw makeError('server');
  }
}

export {
  isAuthenticated,
  setAuthentication
}
