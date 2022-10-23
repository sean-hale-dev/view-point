import { randomUUID } from "crypto";
import { createReadStream } from "fs"
import { Client } from "minio";
import { Readable } from "stream";
import { APIServiceError, makeError } from "./error";
import logger from "./winston";

const bucket_name = "deersio";

const minioClient = new Client({
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
  endPoint: process.env.MINIO_HOST!,
  port: +process.env.MINIO_PORT!,
  useSSL: false,
});

const store_stream = async (file: {stream: Readable, size: number, contentType: string}) => {
  const file_uuid = randomUUID();

  try {
    await minioClient.putObject(bucket_name, file_uuid, file.stream, file.size, { contentType: file.contentType })
    return file_uuid
  } catch (e) {
    logger.error(`store_file - minio error - ${e}`);
    throw makeError('server');
  }
}

const store_file = async (file: {filepath: string, size: number, contentType: string}) => {
  const f_stream = createReadStream(file.filepath);

  return store_stream({stream: f_stream, ...file});
}

const delete_file = async (fileID: string) => {
  try {
    await minioClient.removeObject(bucket_name, fileID);
  } catch (e) {
    logger.error(`delete_file - minio error - ${e}`);
    throw makeError('server');
  }
}

const delete_files = async (filesIDs: string[]) => {
  try {
    await minioClient.removeObjects(bucket_name, filesIDs);
  } catch (e) {
    logger.error(`delete_files - minio error - ${e}`);
    throw makeError('server');
  }
}

const get_file = async (fileID: string) => {
  try {
    const file = await minioClient.getObject(bucket_name, fileID);
    const metadata = await minioClient.statObject(bucket_name, fileID);
    if (!metadata.metaData.contenttype) throw makeError('server', 'Content type missing from object metadata');

    return {
      file,
      metadata: { contentType: metadata.metaData.contenttype, size: metadata.size }
    };
  } catch (e) {
    if (e instanceof APIServiceError) throw e;

    logger.error(`get_file - minio error - ${e}`);
    throw makeError('server');
  }
}

export {
  delete_file,
  delete_files,
  get_file,
  store_stream,
  store_file
}
