import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import NS_Ref from '../public/assets/NoSwift.png';
import NS_RefNSFW from '../public/assets/NoSwiftNSFW.png';
import S_Ref from '../public/assets/Shika.jpg';

const RefPage: NextPage = () => {
  return (
    <main>
      <nav>
        <Link href='/'>&lt; Home</Link>
      </nav>

      <h1>Refsheet</h1>
      <section className='md:flex md:space-x-8 pt-2 md:pt-4 border-b-2 border-west-brown pb-2 md:pb-4'>
        <Link href='/assets/NoSwift.png'>
          <figure className='md:w-1/2 hover:cursor-pointer'>
            <Image src={NS_Ref} quality={25} placeholder='blur' alt='SFW reference sheet of West the deer by NoSwift' />
            <figcaption className='text-center text-west-cream'>SFW Ref</figcaption>
          </figure>
        </Link>
        <Link href='/assets/NoSwiftNSFW.png'>
          <figure className='md:w-1/2 hover:cursor-pointer'>
            <Image src={NS_RefNSFW} quality={25} placeholder='blur' alt='NSFW reference sheet of West the deer by NoSwift' />
            <figcaption className='text-center text-west-cream'>NSFW Ref</figcaption>
          </figure>
        </Link>
      </section>

      <h2>Old Refsheets</h2>
      <p className='text-west-cream italic text-sm'>These refsheets are not to be used for color or figure reference. They are here for pattern references and archival purposes only</p>
      <section className='pt-2 md:pt-4'>
        <Link href='/assets/Shika.jpg'>
          <figure className='md:w-1/3 mx-auto hover:cursor-pointer'>
            <Image src={S_Ref} quality={10} placeholder='blur' alt='SFW reference of West the deer by Shika' />
            <figcaption className='text-center text-west-cream'>Shika Ref</figcaption>
          </figure>
        </Link>
      </section>
    </main>
  );
};

export default RefPage;
