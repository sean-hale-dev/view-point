import type { NextApiRequest, NextApiResponse } from 'next/types';
import sharp from 'sharp';
import { Readable } from 'stream';
import { APIServiceError, makeError, ServerError, UserError } from '../../../util/error';
import { get_file } from '../../../util/minio';
import logger from '../../../util/winston';

export const config = {
  api: {
    responseLimit: false,
  }
};

const get_invoice = async (file: Readable, metadata: {size: number, contentType: string}, res: NextApiResponse) => {
  logger.debug('File - Returning PDF, foregoing all data transformation');
  res.writeHead(200, {
    'Content-Type': metadata.contentType,
    'Content-Size': metadata.size,
  });

  return new Promise<void>((resolve) => {
    file.pipe(res);
    file.on('end', () => {
      resolve();
    });
  });
};

const get_transformed_image = async (file: Readable, queryData: {width?: number, height?: number, quality?: number}, res: NextApiResponse) => {
  if (!queryData.width && !queryData.height && !queryData.quality) throw makeError('user', 'Must provide at least one of: width, height, quality for transformed image');

  let transformer = sharp({ pages: -1 });
  if (queryData.width || queryData.height) {
    logger.debug('File - dimensional transformation provided');
    transformer = transformer.resize(queryData.width, queryData.height);
  }

  transformer = transformer.webp({ quality: queryData.quality });
  logger.debug('File - providing transformed webp');

  res.writeHead(200, {
    'Content-Type': 'image/webp'
  });

  return new Promise<void>((resolve) => {
    file.pipe(transformer).pipe(res);
    file.on('end', () => {
      resolve();
    });
  });
};

const get_image = async (file: Readable, metadata: {size: number, contentType: string}, queryData: {width?: number, height?: number, quality?: number}, useRaw: boolean, res: NextApiResponse) => {
  if (!useRaw) return get_transformed_image(file, queryData, res);

  logger.debug('File - Displaying full file');
  res.writeHead(200, {
    'Content-Type': metadata.contentType,
    'Content-Size': metadata.size,
  });

  return new Promise<void>((resolve) => {
    file.pipe(res);
    file.on('end', () => {
      resolve();
    });
  });
};

const get_handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, width, height, quality, raw } = req.query;

  if (!id || Array.isArray(id)) throw makeError('user', 'Invalid ID provided');

  res.setHeader('Cache-Control', 'max-age=604800, must-revalidate');
  const dimensions: {width?: number, height?: number, quality?: number} = {};

  if (width) {
    if (!Array.isArray(width) && !isNaN(+width)) {
      dimensions.width = +width;
    } else {
      throw makeError('user', 'Invalid width value provided');
    }
  }
  
  if (height) {
    if (!Array.isArray(height) && !isNaN(+height)) {
      dimensions.height = +height;
    } else {
      throw makeError('user', 'Invalid height value provided');
    }
  }

  if (quality) {
    if (!Array.isArray(quality) && !isNaN(+quality)) {
      dimensions.quality = +quality;
    } else {
      throw makeError('user', 'Invalid quality value provided');
    }
  }

  const use_raw: boolean = (!!raw && !Array.isArray(raw) && raw.toLowerCase() === 'true') || (!dimensions.width && !dimensions.height && !dimensions.quality);
  const { file, metadata } = await get_file(id);

  if (metadata.contentType === 'application/pdf') return get_invoice(file, metadata, res);
  return get_image(file, metadata, dimensions, use_raw, res);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
    case 'GET':
      await get_handler(req, res);
      break;
    default:
      res.status(405).end();
    }
  } catch (e) {
    if (e instanceof APIServiceError) {
      if (e instanceof UserError) {
        res.status(400).json({ error: e.message });
      } else if (e instanceof ServerError) {
        res.status(500).json({ error: e.message });
      }
    } else {
      logger.error(`file/id - uncaught error ${e}`);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
}
