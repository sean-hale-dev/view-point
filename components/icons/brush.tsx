// icon:brush | Teeny Icons https://teenyicons.com/ | Anja van Staden
import * as React from 'react';

function IconBrush(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill='none' viewBox='0 0 15 15' height='1em' width='1em' {...props}>
      <path
        fill='currentColor'
        fillRule='evenodd'
        d='M1 2.5A2.5 2.5 0 013.5 0H5v5h1V0h1v3h1V0h3.5A2.5 2.5 0 0114 2.5v7a2.5 2.5 0 01-2.5 2.5H9v1.5a1.5 1.5 0 01-3 0V12H3.5A2.5 2.5 0 011 9.5v-7zM2 8v1.5A1.5 1.5 0 003.5 11H7v2.5a.5.5 0 001 0V11h3.5A1.5 1.5 0 0013 9.5V8H2z'
        clipRule='evenodd'
      />
    </svg>
  );
}

export default IconBrush;
