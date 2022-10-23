// icon:add-box-fill | Remix Icon https://remixicon.com/ | Remix Design
import * as React from 'react';

function IconAdd(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      height='1em'
      width='1em'
      {...props}
    >
      <path fill='none' d='M0 0h24v24H0z' />
      <path d='M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm7 8H7v2h4v4h2v-4h4v-2h-4V7h-2v4z' />
    </svg>
  );
}

export default IconAdd;
