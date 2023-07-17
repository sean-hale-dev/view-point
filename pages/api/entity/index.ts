import { Entity } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createEntity, getEntities } from '../../../controllers/entity';
import { isAuthenticated } from '../../../util/auth';
import { APIServiceError, AuthError, ServerError, UserError } from '../../../util/error';
import logger from '../../../util/winston';

type APIError = {
  error: string
}

type APIGetSuccess = Entity[]

type APIPostSuccess = Entity

type Response = APIError | APIGetSuccess | APIPostSuccess

const get_handler = async (_req: NextApiRequest, res: NextApiResponse<Response>) => {
  const entities = await getEntities();

  res.status(200).json(entities);
};

const post_handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  await isAuthenticated(req, res);
  const { name, type } = req.body;
  let socials: any[] = [];

  if ( !name || !type ) {
    res.status(400).json({ error: 'Missing or malformed name/type.' });
    return;
  }

  if (req.body.socials) {
    if (!Array.isArray(req.body.socials)) {
      res.status(400).json({ error: 'Malformed socials array' });
      return;
    }

    const body_socials: any[] = req.body.socials;
    for (let i = 0; i < body_socials.length; i++) {
      let { name, type, value } = body_socials[i];
      type = type.toUpperCase();

      if ( !type || !value ) {
        res.status(400).json({ error: 'Malformed social, if using a custom type ensure that you set the name.' });
        return;
      }

      socials.push({ name, type, value });
    }
  }

  const newEntity = await createEntity({ name, type, socials });
  res.status(200).json(newEntity);
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
    case 'POST':
      await post_handler(req, res);
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
      logger.error(`entity/index - uncaught error ${e}`);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
}
