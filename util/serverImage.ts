import sharp from "sharp"
import { getDimensions } from "./image";

const convertToB64 = async (filepath: string) => {
  const processor = sharp(filepath);
  
  const { width, height, format } = await processor.metadata();
  if (!width || !height || !format) {
    throw new Error("Unable to retrieve image metadata");
  }

  const aspectRatio = width / height;
  const dimensions = getDimensions(aspectRatio, 32); 

  const smallImage = await processor.resize(dimensions.width, dimensions.height).toBuffer();
  const b64 = smallImage.toString('base64');
  
  const data_url = `data:image/${format};base64,${b64}`;
  return data_url;
}

const getImageMetadata = async (filepath: string) => {
  const metadata = await sharp(filepath).metadata();

  return metadata;
}

export {
  convertToB64,
  getImageMetadata,
}
