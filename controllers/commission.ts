import { Prisma } from '@prisma/client'
import sharp from 'sharp'
import { Readable } from 'stream'
import { APIServiceError, makeError } from '../util/error'
import { delete_files, store_file, store_stream } from '../util/minio'
import logger from '../util/winston'
import prisma from '../util/prisma';
import { getDimensions } from '../util/image'

interface FileDetails {
  filepath: string,
  filename: string,
  size: number,
  contentType: string,
}

interface ImageDetails {
  bucketId: string;
  size: number;
  filename: string;
  contentType: string;
  width: number;
  height: number;
  userProvided: boolean;
}

interface RequiredCommissionDetails {
  dateCommissioned: string,
  invoice: FileDetails,
  price: number,
  artistId: number,
  characterIds: number[],
}

interface SupplimentaryCommissionDetails {
  title: string,
  description: string,
  dateReceived: string,
  thumbnailLabel: string,
  nsfw: boolean,
  images: {
    name: string,
    alternates: FileDetails[]
  }[]
}

interface HydratedAlternate {
  width: number;
  height: number;
  size: number;
  filename: string;
  contentType: string;
  filepath?: string;
  buffer?: Buffer;
  userProvided: boolean;
}

const valid_image_mediatypes = [
  'image/jpg', 'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/gif',
]

const validateRequiredDetails = (inputs: RequiredCommissionDetails) => {
  const dateCommissioned = new Date(inputs.dateCommissioned)
  if (dateCommissioned.toString() === 'Invalid Date') throw makeError('user', 'Invalid date commissioned value')

  const invoice = inputs.invoice;
  if (invoice.contentType !== 'application/pdf') throw makeError('user', 'Invoice must be a PDF')
  if (isNaN(invoice.size) || invoice.size === 0) throw makeError('server', 'Unable to read invoice file')

  const price = inputs.price;
  if (isNaN(price)) throw makeError('user', 'Price must be a valid number')

  const artistId = inputs.artistId;
  if (isNaN(artistId)) throw makeError('user', 'Artist ID must be a valid number')

  const characterIds = inputs.characterIds;
  characterIds.forEach((id) => {
    if (isNaN(id)) throw makeError('user', 'Character IDs must be valid numbers')
  });

  return {
    dateCommissioned,
    invoice,
    price,
    artistId,
    characterIds,
  }
}

const validateSupplimentaryDetails = (inputs: Partial<SupplimentaryCommissionDetails>) => {
  let dateReceived: Date | undefined = undefined;
  if (inputs.dateReceived) {
    dateReceived = new Date(inputs.dateReceived)
    if (dateReceived.toString() === 'Invalid Date') throw makeError('user', 'Invalid date received value')
  }

  if (!inputs.images && inputs.thumbnailLabel) throw makeError('user', 'Must provide images if providing thumbnail label');

  if (inputs.images) {
    if (!inputs.title) throw makeError('user', 'Must provide title');
    if (!inputs.description) throw makeError('user', 'Must provide description');
    if (!inputs.thumbnailLabel) throw makeError('user', 'Must provide thumbnail selection');
    if (!inputs.dateReceived) dateReceived = new Date();

    const names: string[] = [];
    inputs.images.forEach((img) => {
      if (names.includes(img.name)) throw makeError('user', 'Image sets must have unique names');
      names.push(img.name);

      img.alternates.forEach(alt => {
        if (!valid_image_mediatypes.includes(alt.contentType)) throw makeError('user', 'Unsupported filetype');
        if (isNaN(alt.size) || alt.size === 0) throw makeError('server', 'Unable to read image file');
      })
    })

    if (!names.includes(inputs.thumbnailLabel)) throw makeError('user', 'Thumbnail label must match the name of a provided image');
  }

  const { title, description, images, thumbnailLabel, nsfw } = inputs;

  return {
    title, description, images, thumbnailLabel, dateReceived, nsfw
  }
}
const validateID = (id: number) => {
  if (isNaN(id)) throw makeError('user', 'Invalid ID provided');
  return id;
}

const processInvoice = async (invoice: FileDetails) => {
  logger.debug(`processInvoice - Processing ${JSON.stringify(invoice)}`);
  try {
    const invoiceUUID = await store_file(invoice);
    return invoiceUUID;
  } catch (e) {
    throw makeError('server', 'Could not store invoice');
  }
}

const hydrateAlternates = async (alternates: FileDetails[]): Promise<HydratedAlternate[]>  => {
  let processed_alternates = await Promise.all(alternates.map(async (alt) => {
    const { width, height, } = await sharp(alt.filepath).metadata();
    if (!width || !height) {
      logger.error('hydrateAlternates - Could not read input commission metadata');
      throw makeError('server', 'Could not read image alternate metadata');
    }

    return { width, height, size: alt.size, contentType: alt.contentType, filename: alt.filename, filepath: alt.filepath, userProvided: true }
  }))

  processed_alternates = processed_alternates.sort((a1, a2) => {
    const a1_aspect = a1.width / a1.height;
    const a2_aspect = a2.width / a2.height;
    const aspect_difference = Math.abs(a1_aspect - a2_aspect);
    if (aspect_difference >= 0.05) {
      logger.warn('hydrateAlternates - Image with dissimmilar alternates detected');
      throw makeError('user', 'Alternates with dissimmilar aspect ratios are not allowed');
    }

    if (a1.width > a1.height) return a1.width - a2.width;
    else return a1.height - a2.height;
  })

  return processed_alternates;
}

const computeThumbnail = async (smallestAlternate: HydratedAlternate): Promise<HydratedAlternate> => {
  // If the smallest alternate is still too big then generate a computed thumbnail alternate
  logger.info('computeThumbnail - Smallest alternate too large, generating computed thumbnail...');

  let width, height;
  const largestSmallestDimension = Math.max(smallestAlternate.width, smallestAlternate.height);
  const aspectRatio = smallestAlternate.width / smallestAlternate.height;
  if (largestSmallestDimension === smallestAlternate.width) {
    width = 512;
    height = Math.ceil(512 / aspectRatio);
  } else {
    height = 512;
    width = Math.ceil(512 * aspectRatio);
  }

  try {
    const thumbnailBuffer = await sharp(smallestAlternate.filepath).resize({ width, height }).toBuffer();
    const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();

    if (!thumbnailMetadata.width || !thumbnailMetadata.height || !thumbnailMetadata.size || !thumbnailMetadata.format) {
      logger.error('computeThumbnail - could not read generated thumbnail metadata');
      throw makeError('server', 'Could not fetch generated thumbnail metadata');
    }

    return {
      width: thumbnailMetadata.width,
      height: thumbnailMetadata.height,
      size: thumbnailMetadata.size,
      filename: `generatedThumbnail_${smallestAlternate.filename}`,
      contentType: `image/${thumbnailMetadata.format}`,
      buffer: thumbnailBuffer,
      userProvided: false,
    };
  } catch (e) {
    logger.error(`computeThumbnail - Could not create thumbnail alternate image - ${e}`);
    throw makeError('server', 'Failed to create compressed version of alternate');
  }
}

const computePlaceholderURI = async (alt: HydratedAlternate) => {
  let processor: sharp.Sharp;
  if (alt.buffer) {
    processor = sharp(alt.buffer);
  } else if (alt.filepath) {
    processor = sharp(alt.filepath)
  } else {
    logger.error('computePlaceholderURI - Cannot generate placeholder of alternate without a filepath or buffer');
    throw makeError('server');
  }

  const { width, height } = getDimensions(alt.width / alt.height, 32);

  try {
    const smallAlt = await processor.resize({ width, height }).toBuffer();
    const b64 = smallAlt.toString('base64');

    const uri = `data:image/${alt.contentType};base64,${b64}`;
    return uri;
  } catch (e) {
    logger.error(`computePlaceholderURI - Sharp error ${e}`);
    throw makeError('server');
  }
}

const processImage = async (image: {name: string, alternates: FileDetails[]}): Promise<{name: string; placeholderURI: string, files: ImageDetails[]}>  => {
  logger.debug(`processImage - processing ${JSON.stringify(image)}`);
  const processed_alternates = await hydrateAlternates(image.alternates);

  let placeholder_uri: string;
  if (Math.max(processed_alternates[0].width, processed_alternates[0].height) > 512) {
    const computed_thumbnail = await computeThumbnail(processed_alternates[0]);
    processed_alternates.push(computed_thumbnail);

    placeholder_uri = await computePlaceholderURI(computed_thumbnail);
  } else {
    placeholder_uri = await computePlaceholderURI(processed_alternates[0]);
  }

  const uploadedAlternates = await Promise.all(processed_alternates.map(async (alt) => {
    let alt_uuid;
    if (alt.filepath) {
      alt_uuid = await store_file({ filepath: alt.filepath, size: alt.size, contentType: alt.contentType });
    } else if (alt.buffer) {
      const alt_stream = new Readable({
        read() {
          this.push(alt.buffer);
          this.push(null);
        }
      });

      alt_uuid = await store_stream({ stream: alt_stream, size: alt.size, contentType: alt.contentType });
    } else {
      logger.error('processImage - Attempted to upload alternate without filename or buffer');
      throw makeError('server');
    }

    if (!alt_uuid) {
      logger.error('processImage - Alternative UUID was not processed');
      throw makeError('server');
    }

    return { bucketId: alt_uuid, size: alt.size, width: alt.width, height: alt.height, filename: alt.filename, contentType: alt.contentType, userProvided: alt.userProvided };
  }))

  return {
    name: image.name,
    placeholderURI: placeholder_uri,
    files: uploadedAlternates,
  }
}

const createCommission = async (inputs: RequiredCommissionDetails & Partial<SupplimentaryCommissionDetails>) => {
  logger.debug(`createCommission - Creating ${JSON.stringify(inputs)}`);

  const requiredValues = validateRequiredDetails(inputs);
  const supplimentaryValues = validateSupplimentaryDetails(inputs);

  const invoiceUUID = await processInvoice(requiredValues.invoice);
  const createData: Prisma.CommissionCreateInput = {
    price: requiredValues.price,
    nsfw: false,
    artist: {
      connect: { id: requiredValues.artistId }
    },
    characters: {
      connect: requiredValues.characterIds.map(id => ({ id }))
    },
    invoice: {
      create: {
        size: requiredValues.invoice.size,
        filename: requiredValues.invoice.filename,
        bucketId: invoiceUUID
      }
    },
    dateCommissioned: requiredValues.dateCommissioned,
  }

  if (supplimentaryValues.images) {
    const processed_images = await Promise.all(supplimentaryValues.images.map(img => processImage(img)));
    const prisma_image_queries = processed_images.map(img => ( { name: img.name, placeholderURI: img.placeholderURI, files: { createMany: { data: img.files } } }))
    createData.images = { create: prisma_image_queries };

    const thumbnail_image = processed_images.find((img) => img.name === supplimentaryValues.thumbnailLabel)!;
    const prisma_thumbnail_query = {
      name: thumbnail_image.name,
      placeholderURI: thumbnail_image.placeholderURI,
      files: { createMany: { data: thumbnail_image.files }}
    }
    createData.thumbnail = { create: prisma_thumbnail_query }

    const { title, description, dateReceived, nsfw } = supplimentaryValues;

    createData.title = title!;
    createData.description = description!;
    createData.dateReceived = dateReceived ?? new Date();
    createData.nsfw = nsfw ?? false;
  }

  try {
    const commission = await prisma.commission.create({ data: createData });
    logger.info(`createCommission - Commission ${commission.id} created`);

    return commission;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2001') throw makeError('user', 'Could not find either artist or character to link');
    }

    logger.error(`createCommission - ${e}`);
    throw makeError('server');
  }
}

const updateCommission = async (inputID: number, inputs: Partial<SupplimentaryCommissionDetails>) => {
  logger.debug(`updateCommission - ${inputID} - ${JSON.stringify(inputs)}`)

  const id = validateID(inputID);
  const supplimentaryValues = validateSupplimentaryDetails(inputs);

  const { title, description, nsfw } = supplimentaryValues;
  if (!title && !description && nsfw === undefined) throw makeError('user', 'Must provide at least one field to edit');

  try {
    const commission = await prisma.commission.update({ where: { id }, data: { title, description, nsfw } });
    logger.info(`updateCommission - Commission ${commission.id} updated`)

    return commission;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2001') throw makeError('user', 'Could not find commission to update');
    }

    logger.error(`updateCommission - ${e}`)
    throw makeError('server');
  }
}

const completeCommission = async (inputID: number, inputs: SupplimentaryCommissionDetails) => {
  logger.debug(`completeCommission - ${inputID} - ${JSON.stringify(inputs)}`)

  const id = validateID(inputID)
  if (!inputs.images || !inputs.thumbnailLabel || inputs.images.length === 0) throw makeError('user', 'Must provide images for completeCommission');
  const supplimentaryValues = validateSupplimentaryDetails(inputs);

  const updateData: Prisma.CommissionUpdateInput = {
    title: supplimentaryValues.title!,
    description: supplimentaryValues.description!,
    dateReceived: supplimentaryValues.dateReceived ?? new Date(),
  }

  if (supplimentaryValues.nsfw !== undefined) {
    updateData.nsfw = supplimentaryValues.nsfw;
  }

  const processed_images = await Promise.all(supplimentaryValues.images!.map(img => processImage(img)));
  const prisma_image_queries = processed_images.map(img => ( { name: img.name, placeholderURI: img.placeholderURI, files: { createMany: { data: img.files } } }))

  const thumbnail_image = processed_images.find(img => img.name === supplimentaryValues.thumbnailLabel)!;
  const prisma_thumbnail_query = { name: thumbnail_image.name, placeholderURI: thumbnail_image.placeholderURI, files: { createMany: { data: thumbnail_image.files }} }

  updateData.images = { create: prisma_image_queries };
  updateData.thumbnail = { create: prisma_thumbnail_query };

  try {
    const commission = await prisma.commission.update({ where: { id }, data: updateData });
    logger.info(`completeCommission - Commission ${commission.id} completed`)

    return commission;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2001') throw makeError('user', 'Could not find commission to complete');
    }

    logger.error(`completeCommission - ${e}`);
    throw makeError('server');
  }
}

const deleteCommission = async (inputID: number) => {
  logger.debug(`deleteCommission - ${inputID}`);

  const id = validateID(inputID);
  try {
    const commission = await prisma.commission.delete({ where: { id }, include: { invoice: true, images: { include: { files: true } } } });
    const alternate_s3_objects: string[] = [commission.invoice.bucketId];
    if (commission.images && commission.images.length > 0) {
      commission.images.forEach(img => img.files.forEach(alt => alternate_s3_objects.push(alt.bucketId)));
    }

    await delete_files(alternate_s3_objects);
    logger.info(`deleteCommission - Deleted commission ${id}`);
  } catch (e) {

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      logger.warn(`deleteCommission - ${JSON.stringify(e)}`);

      if (e.code === 'P2001') throw makeError('user', 'Could not find commission to delete');
      if (e.code === 'P2003') throw makeError('server', 'Failed to delete associated DB record');
    } else if (e instanceof APIServiceError) {
      throw e;
    }

    logger.error(`deleteCommission - ${JSON.stringify(e)}`);
    throw makeError('server')
  }
}

const getCommission = async (inputID: number) => {
  logger.debug(`getCommission - ID: ${inputID}`);

  const id = validateID(inputID);
  try {
    const commission = await prisma.commission.findUnique({ where: { id }, include: { artist: true, characters: true, images: { include: { files: true } }, invoice: true } });
    if (!commission) throw makeError('user', 'Could not find commission');

    return commission;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2001') throw makeError('user', 'Could not find commission');
    } else if (e instanceof APIServiceError) throw e;

    logger.error(`getCommission - ${e}`);
    throw makeError('server');
  }
}

const getCommissions = async () => {
  logger.debug('getCommissions');

  try {
    const commissions = await prisma.commission.findMany({ include: { artist: true, thumbnail: { include: { files: true } } } });
    return commissions;
  } catch (e) {
    logger.error(`getCommissions - ${e}`);
    throw makeError('server');
  }
}

export {
  createCommission,
  completeCommission,
  deleteCommission,
  getCommission,
  getCommissions,
  updateCommission,
}
