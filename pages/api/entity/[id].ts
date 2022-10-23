import { Entity } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next/types';
import { deleteEntity, getEntity, updateEntity } from '../../../controllers/entity';
import { isAuthenticated } from '../../../util/auth';
import { APIServiceError, AuthError, makeError, ServerError, UserError } from '../../../util/error';
import logger from '../../../util/winston';

type APIGetSuccess = Entity;
type APIError = { error: string };

type Response = APIError | APIGetSuccess

const read_id = (req: NextApiRequest) => {
  const { id } = req.query;
  if (!id || Array.isArray(id)) throw makeError('user', 'Invalid ID provided');

  return id;
};

const get_handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  const id = read_id(req);

  const entity = await getEntity(+id);
  if (!entity) {
    res.status(404).end();
    return;
  }

  res.status(200).json(entity);
};

const patch_handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  await isAuthenticated(req, res);
  const id = read_id(req);
  const { name, type, socials } = req.body;

  if (socials) {
    const { add, remove } = socials;
    if (add && !Array.isArray(add)) throw makeError('user', 'Add socials must be array');
    if (remove && !Array.isArray(remove)) throw makeError('user', 'Remove socials must be array');
  }

  const update_entity = await updateEntity(+id, { name, type, socials });
  res.status(200).json(update_entity);
};

const delete_handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  await isAuthenticated(req, res);
  const id = read_id(req);
  await deleteEntity(+id);

  res.status(200).end();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    switch (req.method) {
    case 'GET':
      await get_handler(req, res);
      break;
    case 'PATCH':
      await patch_handler(req, res);
      break;
    case 'DELETE':
      await delete_handler(req, res);
      break;
    default:
      res.status(405).end();
      break;
    }
  } catch (e) {
    if (e instanceof APIServiceError) {
      if (e instanceof UserError) {
        res.status(400).json({ error: e.message });
      } else if (e instanceof ServerError) {
        res.status(500).json({ error: e.message });
      } else if (e instanceof AuthError) {
        res.status(401).end();
      }
    } else {
      logger.error(`entity/id - uncaught error ${e}`);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
}
