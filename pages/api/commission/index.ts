import { IncomingForm } from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next/types';
import { createCommission, getCommissions } from '../../../controllers/commission';
import { isAuthenticated } from '../../../util/auth';
import { APIServiceError, AuthError, ServerError, UserError } from '../../../util/error';
import { FileData, RequiredFields, SupplimentalFields, ImageData, parse_required_fields, parse_supplimental_fields, parse_invoice, parse_images } from '../../../util/rest_view_utils';
import logger from '../../../util/winston';

export const config = {
  api: {
    bodyParser: false
  }
};

const get_handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const commissions = await getCommissions();

  res.status(200).json(commissions);
};

const post_handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await isAuthenticated(req, res);

  const { reqFields, suppFields, invoice, images } = await new Promise<{reqFields: RequiredFields, suppFields: Partial<SupplimentalFields>, invoice: FileData, images: ImageData[]}>((resolve) => {
    const form = new IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        logger.warn('Commission post - error while parsing formdata body');
        throw err;
      }

      const required_fields = parse_required_fields(fields);
      const supplimental_fields = parse_supplimental_fields(fields);
      const invoice = parse_invoice(files);
      const images = parse_images(files);
      resolve({ reqFields: required_fields, suppFields: supplimental_fields, invoice, images, });
    });
  });

  const commission = await createCommission({ ...reqFields, invoice, ...suppFields, images: images.length > 0 ? images : undefined });
  res.status(200).json(commission);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      return;
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
      logger.error(`commission/index - uncaught error ${e}`);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
}
