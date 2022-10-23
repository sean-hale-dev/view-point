import Link from 'next/link';
import useGlobalState from '../hooks/useGlobalState';

const CustomNav: React.FC<{links: {label: string, href: string}[]}> = ({ links }) => {
  const { auth } = useGlobalState();

  return (
    <nav>
      <div className='flex gap-2 lg:gap-4'>
        <Link href='/'>&lt; Home</Link>
        <p className='text-west-brown'>&#124;</p>
        { links.map((l, idx) => <Link key={`cnlk${idx}`} href={l.href}>{l.label}</Link>) }
      </div>

      { !auth && <Link href='/auth'>Login</Link> }
    </nav>
  );
};

export default CustomNav;
