// icon:user-3-fill | Remix Icon https://remixicon.com/ | Remix Design
import * as React from 'react';

function IconUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      height='1em'
      width='1em'
      {...props}
    >
      <path fill='none' d='M0 0h24v24H0z' />
      <path d='M20 22H4v-2a5 5 0 015-5h6a5 5 0 015 5v2zm-8-9a6 6 0 110-12 6 6 0 010 12z' />
    </svg>
  );
}

export default IconUser;
