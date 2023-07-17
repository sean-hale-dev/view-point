import { IncomingForm } from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next/types';
import { completeCommission, deleteCommission, getCommission, updateCommission } from '../../../controllers/commission';
import { isAuthenticated } from '../../../util/auth';
import { APIServiceError, AuthError, makeError, ServerError, UserError } from '../../../util/error';
import { ImageData, parse_all_supplimental_fields, parse_images, SupplimentalFields } from '../../../util/rest_view_utils';
import logger from '../../../util/winston';

export const config = {
  api: {
    bodyParser: false
  }
};

const read_id = (req: NextApiRequest) => {
  const { id } = req.query;
  if (!id || Array.isArray(id)) throw makeError('user', 'Invalid ID provided');

  return +id;
};

const parse_json_body = async (req: NextApiRequest) => {
  const chunks = [];
  for await (const chunk of req) {
    //@ts-ignore
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  
  const wholeBuffer = Buffer.concat(chunks);
  const bodyStr = wholeBuffer.toString('utf8');
  const body = JSON.parse(bodyStr);

  return body;
};

const get_handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = read_id(req);
  const commission = await getCommission(id);

  res.status(200).json(commission);
};

const put_handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await isAuthenticated(req, res);

  const id = read_id(req);

  const { suppFields, images } = await new Promise<{suppFields: SupplimentalFields, images: ImageData[]}>((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        logger.warn('Commission put - Rejection when attempting to read files from request body');
        throw err;
      }

      try {
        const suppFields = parse_all_supplimental_fields(fields);
        const images = parse_images(files);
        resolve({ suppFields, images });
      } catch (e) {
        reject(e);
      }
    });
  });

  const update_commission = await completeCommission(id, { ...suppFields, images });
  res.status(200).json(update_commission);
};

const patch_handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await isAuthenticated(req, res);

  const id = read_id(req);

  if (!req.headers['content-type'] || req.headers['content-type'] !== 'application/json') {
    res.status(400).json({ error: 'Malformed request body' });
    return;
  }

  let { title, description, nsfw } = await parse_json_body(req);
  if (typeof nsfw === 'string') {
    nsfw = nsfw.toLowerCase() === 'true';
  }

  const update_commission = await updateCommission(id, { title, description, nsfw });
  res.status(200).json(update_commission);
};

const delete_handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await isAuthenticated(req, res);
  const id = read_id(req);

  await deleteCommission(id);
  res.status(200).end();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
    case 'GET':
      await get_handler(req, res);
      break;
    case 'PUT':
      await put_handler(req, res);
      break;
    case 'PATCH':
      await patch_handler(req, res);
      break;
    case 'DELETE':
      await delete_handler(req, res);
      break;
    default:
      logger.debug(`Attempt to use HTTP verb ${req.method} for /commission/id`);
      res.status(405).end();
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
      logger.error(`commission/[id] - uncaught error ${e}`);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
}
