import { compare, hash } from 'bcrypt';
import { APIServiceError, makeError } from '../util/error';
import prisma from '../util/prisma';
import logger from "../util/winston";

const createUser = async (username: string, password: string) => {
  logger.debug(`createUser - Username: ${username}`);

  const hashAndSalt = await hash(password, 8).catch((e) => {
    logger.error(`createUser - hash error - ${e}`);
    throw makeError('server');
  });

  try {
    const user = await prisma.user.create({
      data: {
        username,
        password: hashAndSalt
      }
    });

    return user;
  } catch (e) {
    logger.error(`createUser - ${e}`);
    throw makeError('server');
  }
}

const getUser = async (username: string) => {
  logger.debug(`getUser - Username: ${username}`);

  try {
    const user = await prisma.user.findUnique({ where: { username }});
    if (!user) throw makeError('user', 'Could not find user');

    return user;
  } catch (e) {
    if (e instanceof APIServiceError) throw e;

    logger.error(`getUser - prisma error ${e}`);
    throw makeError('server');
  }
}

const validateCredentials = async (username: string, password: string) => {
  logger.debug(`validateCredentials - Username: ${username}`);

  const user = await getUser(username).catch(e => { logger.error(`validateCredentials - ${JSON.stringify(e)}`); throw makeError('server'); });

  try {
    const valid = await compare(password, user.password)
    if (!valid) logger.warn(`validateCredentials - Authentication of user: ${username} failed`);

    return valid;
  } catch {
    logger.error(`validateCredentials - Error comparing password to hash`);
    throw makeError('server');
  }
}

export {
  createUser,
  getUser,
  validateCredentials,
}
