import type { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import HigsbyImg from '../public/assets/higsby.png';
import { getAspectRatio, getDimensions } from '../util/image';
const hero_aspect_ratio = getAspectRatio(801, 1266);

const links = [
  { name: 'Art', href: '/commissions' },
  { name: 'Refsheets', href: '/ref' },
  { name: 'Cloud', href: 'https://cloud.deers.io/' },
  { name: 'Git', href: 'https://git.deers.io/' },
  { name: 'Twitter', href: 'https://twitter.com/walkingcoatrack' },
  { name: 'Telegram', href: 'https://t.me/walkingcoatrack' },
  { name: 'Email', href: 'mailto:west@hoof.dev' },
  { name: 'PayPal', href: 'https://paypal.me/antlerboys' },
];

const Home: NextPage = () => {
  const hero_dimensions = getDimensions(hero_aspect_ratio, 800);

  return (
    <section className='xl:container xl:mx-auto flex flex-col justify-evenly min-h-screen pb-8'>
      <div className='w-fit mx-auto'> <Image src={HigsbyImg} {...hero_dimensions} quality={50} alt='West with one hoof up. The word West on the bottom on the image' placeholder='blur' /> </div>
      <nav className='text-xl grid grid-cols-4 xl:grid-cols-8 text-center gap-4'>
        { links.map((link, idx) => <Link href={link.href} key={`homelink${idx}`}>{link.name}</Link>) }
      </nav>
    </section>
  );
};

export default Home;
