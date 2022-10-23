import { NextPage } from 'next';
import Image from 'next/image';
import NotFoundImage from '../public/assets/not_found.webp';

const NotFoundPage: NextPage = () => {
  return (
    <section className='text-center'>
      <div className='w-fit mx-auto'><Image src={NotFoundImage} alt='Sticker of west surrounded by question marks' /></div>
      <h1>404 - Where are you trying to go???</h1>
    </section>
  );
};

export default NotFoundPage;
