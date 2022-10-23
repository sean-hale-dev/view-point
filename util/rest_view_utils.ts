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

  if (!Array.isArray(fields.artistId)) throw makeError('user', 'Failed to parse artistID');
  artistId = +fields.artistId[0];

  if (!Array.isArray(fields.price)) throw makeError('user', 'Failed to parse price');
  price = +fields.price[0]

  if (!Array.isArray(fields.characterIds)) throw makeError('user', 'Failed to parse characterIds');
  characterIds = JSON.parse(fields.characterIds[0])

  if (!Array.isArray(fields.dateCommissioned)) throw makeError('user', 'Failed to parse dateCommissioned');
  dateCommissioned = fields.dateCommissioned[0];

  return {artistId, characterIds, price, dateCommissioned};
}

export const parse_supplimental_fields = (fields: Fields): Partial<SupplimentalFields> => {
  const parsed: Partial<SupplimentalFields> = {};

  if (fields.title) {
    if (!Array.isArray(fields.title)) throw makeError('user', 'Failed to parse title');
    parsed.title = fields.title[0];
  }

  if (fields.description) {
    if (!Array.isArray(fields.description)) throw makeError('user', 'Failed to parse description');
    parsed.description = fields.description[0];
  }

  if (fields.thumbnailLabel) {
    if (!Array.isArray(fields.thumbnailLabel)) throw makeError('user', 'Failed to parse thumbnailLabel');
    parsed.thumbnailLabel = fields.thumbnailLabel[0];
  }

  if (fields.dateReceived) {
    if (!Array.isArray(fields.dateReceived)) throw makeError('user', 'Failed to parse dateReceived');
    parsed.dateReceived = fields.dateReceived[0];
  }

  if (fields.nsfw) {
    if (!Array.isArray(fields.nsfw)) throw makeError('user', 'Failed to parse nsfw');
    parsed.nsfw = fields.nsfw[0].toLowerCase() === 'true';
  }

  return parsed;
}

export const parse_all_supplimental_fields = (fields: Fields): SupplimentalFields => {
  if (!fields.title || !fields.description || !fields.dateReceived || !fields.thumbnailLabel || !fields.nsfw) throw makeError('user', 'Missing required field');

  if (!Array.isArray(fields.title) || fields.title.length !== 1) throw makeError('user', 'Failed to parse title')
  const title = fields.title[0];

  if (!Array.isArray(fields.description) || fields.description.length !== 1) throw makeError('user', 'Failed to parse description')
  const description = fields.description[0];

  if (!Array.isArray(fields.dateReceived) || fields.dateReceived.length !== 1) throw makeError('user', 'Failed to parse dateReceived')
  const dateReceived = fields.dateReceived[0];

  if (!Array.isArray(fields.nsfw) || fields.nsfw.length !== 1) throw makeError('user', 'Failed to parse nsfw')
  const nsfw = fields.nsfw[0].toLowerCase() === 'true';

  if (!Array.isArray(fields.thumbnailLabel) || fields.thumbnailLabel.length !== 1) throw makeError('user', 'Failed to parse thumbnailLabel')
  const thumbnailLabel = fields.thumbnailLabel[0];

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
  if (!Array.isArray(files.invoice) || files.invoice.length > 1) throw makeError('user', 'Must provide only 1 invoice');

  const invoice = files.invoice[0];

  return parse_file(invoice);
}

export const parse_images = (files: Files): ImageData[] => {
  const file_labels = Object.keys(files);
  const image_labels = file_labels.filter(label => label.toLowerCase() !== 'invoice');

  return image_labels.map((label) => {
    const associated_files = files[label];
    const file_info = Array.isArray(associated_files) ? associated_files.map(f => parse_file(f)) : [parse_file(associated_files)] ;

    return {
      name: label,
      alternates: file_info
    }
  })
}

