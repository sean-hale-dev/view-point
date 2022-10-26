import { Files, File, Fields } from "formidable";
import { makeError } from "./error";

export interface RequiredFields {
  artistId: number;
  characterIds: number[];
  price: number;
  dateCommissioned: string;
}

export interface SupplimentalFields {
  title: string;
  description: string;
  dateReceived: string;
  nsfw: boolean;
  thumbnailLabel: string;
}

export interface FileData {
  filepath: string;
  filename: string;
  size: number;
  contentType: string;
}

export interface ImageData {
  name: string;
  alternates: FileData[];
}

export const parse_required_fields = (fields: Fields): RequiredFields => {
  if (!fields.artistId || !fields.price || !fields.characterIds || !fields.dateCommissioned) throw makeError('user', 'missing required field');

  let artistId: number;
  let characterIds: number[];
  let price: number;
  let dateCommissioned: string;

  if (Array.isArray(fields.artistId) && fields.artistId.length !== 1) throw makeError('user', 'Failed to parse artistID');
  artistId = typeof fields.artistId === 'string' ? +fields.artistId : +fields.artistId[0];

  if (Array.isArray(fields.price) && fields.price.length !== 1) throw makeError('user', 'Failed to parse price');
  price = typeof fields.price === 'string' ? +fields.price : +fields.price[0];

  if (Array.isArray(fields.price) && fields.price.length !== 1) throw makeError('user', 'Failed to parse characterIds');
  characterIds = JSON.parse(typeof fields.characterIds === 'string' ? fields.characterIds : fields.characterIds[0]);

  if (Array.isArray(fields.price) && fields.price.length !== 1) throw makeError('user', 'Failed to parse dateCommissioned');
  dateCommissioned = typeof fields.dateCommissioned === 'string' ? fields.dateCommissioned : fields.dateCommissioned[0];

  return {artistId, characterIds, price, dateCommissioned};
}

export const parse_supplimental_fields = (fields: Fields): Partial<SupplimentalFields> => {
  const parsed: Partial<SupplimentalFields> = {};

  if (fields.title) {
    if (Array.isArray(fields.title) && fields.title.length !== 1) throw makeError('user', 'Failed to parse title');
    parsed.title = typeof fields.title === 'string' ? fields.title : fields.title[0];
  }

  if (fields.description) {
    if (Array.isArray(fields.description) && fields.description.length !== 1) throw makeError('user', 'Failed to parse description');
    parsed.description = typeof fields.description === 'string' ? fields.description : fields.description[0];
  }

  if (fields.thumbnailLabel) {
    if (Array.isArray(fields.thumbnailLabel) && fields.thumbnailLabel.length !== 1) throw makeError('user', 'Failed to parse thumbnailLabel');
    parsed.thumbnailLabel = typeof fields.thumbnailLabel === 'string' ? fields.thumbnailLabel : fields.thumbnailLabel[0];
  }

  if (fields.dateReceived) {
    if (Array.isArray(fields.dateReceived) && fields.dateReceived.length !== 1) throw makeError('user', 'Failed to parse dateReceived');
    parsed.dateReceived = typeof fields.dateReceived === 'string' ? fields.dateReceived : fields.dateReceived[0];
  }

  if (fields.nsfw) {
    if (Array.isArray(fields.nsfw) && fields.nsfw.length !== 1) throw makeError('user', 'Failed to parse nsfw');
    const nsfw = typeof fields.nsfw === 'string' ? fields.nsfw : fields.nsfw[0];
    parsed.nsfw = nsfw.toLowerCase() === 'true';
  }

  return parsed;
}

export const parse_all_supplimental_fields = (fields: Fields): SupplimentalFields => {
  if (!fields.title || !fields.description || !fields.dateReceived || !fields.thumbnailLabel || !fields.nsfw) throw makeError('user', 'Missing required field');

  if (Array.isArray(fields.title) && fields.title.length !== 1) throw makeError('user', 'Failed to parse title')
  const title = typeof fields.title !== 'string' ? fields.title[0] : fields.title;

  if (Array.isArray(fields.description) && fields.description.length !== 1) throw makeError('user', 'Failed to parse description')
  const description = typeof fields.description !== 'string' ? fields.description[0] : fields.description;

  if (Array.isArray(fields.dateReceived) && fields.dateReceived.length !== 1) throw makeError('user', 'Failed to parse dateReceived')
  const dateReceived = typeof fields.dateReceived !== 'string' ? fields.dateReceived[0] : fields.dateReceived;

  if (Array.isArray(fields.nsfw) && fields.nsfw.length !== 1) throw makeError('user', 'Failed to parse nsfw')
  const nsfwStr = typeof fields.nsfw !== 'string' ? fields.nsfw[0] : fields.nsfw;
  const nsfw = nsfwStr.toLowerCase() === 'true';

  if (Array.isArray(fields.thumbnailLabel) && fields.thumbnailLabel.length !== 1) throw makeError('user', 'Failed to parse thumbnailLabel')
  const thumbnailLabel = typeof fields.thumbnailLabel !== 'string' ? fields.thumbnailLabel[0] : fields.thumbnailLabel;

  return { title, description, dateReceived, nsfw, thumbnailLabel, }
}

export const parse_file = (file: File): FileData => {
  const { filepath, originalFilename, size, mimetype } = file;
  if (!filepath || !originalFilename || typeof size !== 'number' || !mimetype) throw makeError('server', 'Unable to parse file');

  return {
    filepath,
    filename: originalFilename,
    size,
    contentType: mimetype
  }
}

export const parse_invoice = (files: Files): FileData => {
  if (!Object.keys(files).includes('invoice')) throw makeError('user', 'Must provide invoice');
  if (Array.isArray(files.invoice) && files.invoice.length > 1) throw makeError('user', 'Must provide only 1 invoice');

  const invoice = Array.isArray(files.invoice) ? files.invoice[0] : files.invoice;

  return parse_file(invoice);
}

export const parse_images = (files: Files): ImageData[] => {
  const file_labels = Object.keys(files);
  const image_labels = file_labels.filter(label => label.toLowerCase() !== 'invoice');

  const images: Record<string, FileData[]> = {};
  image_labels.forEach((label) => {
    if (Array.isArray(files[label])) throw makeError('user', 'File array detected!');

    const label_split = label.split('.');
    if (label_split.length < 2) throw makeError('user', 'Invalid image name provided');

    const image_label = label_split.slice(0, label_split.length - 1).join();
    const file_info = parse_file(files[label] as File);

    if (image_label in images) {
      images[image_label].push(file_info);
    } else {
      images[image_label] = [file_info];
    }
  })

  return Object.keys(images).map((label) => {
    return {
      name: label,
      alternates: images[label],
    }
  }) 
}

