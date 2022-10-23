import Image, { ImageProps } from 'next/image';
import { FC } from 'react';

const customLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
  return `/api/file/${src}?width=${width}&quality=${quality || 50}`;
};

const HostedImage: FC<ImageProps> = (props) => {
  return (
    <Image
      loader={customLoader}
      alt={props.alt}
      {...props}
    />
  );
};

export default HostedImage;
