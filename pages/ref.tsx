import { NextPage } from 'next';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import NS_Ref from '../public/assets/NoSwift.png';
import NS_RefNSFW from '../public/assets/NoSwiftNSFW.png';
import S_Ref from '../public/assets/Shika.jpg';

const RefCard: React.FC<{ image: StaticImageData, alt: string, caption: string, href: string }> = ({ image, alt, caption, href }) => {
  return (
    <Link href={href}>
      <figure className='hover:cursor-pointer'>
        <Image src={image} quality={25} placeholder='blur' alt={alt} />
        <figcaption className='text-center text-west-cream'>{caption}</figcaption>
      </figure>
    </Link>
  );
}

const RefPage: NextPage = () => {
  const current_cards = [
    { image: NS_Ref, alt: 'SFW reference sheet of West the deer by NoSwift', caption: 'SFW Ref', href: '/assets/NoSwift.png' },
    { image: NS_RefNSFW, alt: 'NSFW reference sheet of West the deer by NoSwift', caption: 'NSFW Ref', href: '/assets/NoSwiftNSFW.png' },
  ]

  const old_cards = [
    { image: S_Ref, alt: 'SFW reference sheet of West the deer by Shika', caption: 'Shika Ref', href: '/assets/Shika.jpg' },
  ]

  return (
    <main>
      <nav>
        <Link href='/'>&lt; Home</Link>
      </nav>

      <h1>Refsheet</h1>
      <section className='border-b-2 border-west-brown pb-2 md:pb-4 md:flex md:justify-between md:gap-2 lg:gap-4'>
        { current_cards.map((c, idx) => <RefCard key={`curr_ref_card_${idx}`} {...c} />) }
      </section>

      <h2>Old Refsheets</h2>
      <p className='text-west-cream italic text-sm'>These refsheets are not to be used for color or figure reference. They are here for pattern references and archival purposes only</p>
      <section className='pt-2 md:pt-4 md:flex justify-center'>
        { old_cards.map((c, idx) => <div key={`old_ref_card_${idx}`} className='w-1/2'><RefCard  {...c} /></div>) }
      </section>
    </main>
  );
};

export default RefPage;
