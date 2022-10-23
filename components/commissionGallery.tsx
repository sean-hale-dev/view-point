import { Alternate, Commission, Entity, Image } from '@prisma/client';
import { FC, useMemo } from 'react';
import classNames from 'classnames';
import HostedImage from './hostedImage';
import Link from 'next/link';
import useGlobalState from '../hooks/useGlobalState';
import { getAspectRatio, getDimensions } from '../util/image';

type ExtendedCommission = Commission & { artist?: Entity, thumbnail?: Image & {files: Alternate[]} };

interface Props {
  commissions: ExtendedCommission[];
}

const isDefined = (value: Image | null | undefined): value is null | undefined => {
  return value !== null && value !== undefined;
};

const targetHeight = 350;

const PendingCommissionCard: FC<{commission: ExtendedCommission}> = ({ commission }) => {
  const commissioned_on_str = `${commission.dateCommissioned.getMonth() + 1}/${commission.dateCommissioned.getDate()}/${commission.dateCommissioned.getFullYear()}`;
  return (
    <Link href={`/commission/${commission.id}`}>
      <div className='bg-west-brown text-west-cream p-1 rounded-sm border-2 border-transparent hover:border-west-cream hover:cursor-pointer'>
        <p>{commission.artist?.name}</p>
        <p>{commissioned_on_str}</p>
      </div>
    </Link>
  );
};

const CompletedCommissionCard: FC<{commission: ExtendedCommission, showNSFW: boolean, isBig: boolean}> = ({ commission, showNSFW, isBig }) => {
  if (!commission.thumbnail || commission.thumbnail.files.length === 0) {
    throw new Error('Attempting to render thumbnail of incomplete commission');
  }

  const smallest_alt = commission.thumbnail.files.sort((f1, f2) => f1.size - f2.size)[0];
  const aspectRatio = getAspectRatio(smallest_alt.width, smallest_alt.height);
  const { height, width } = getDimensions(aspectRatio, targetHeight);

  const classes = classNames('fit flex flex-col items-center space-y-2 justify-center bg-west-brown text-west-cream pb-2 border-2 hover:cursor-pointer border-transparent hover:border-west-cream',
    {
      'md:col-span-2': isBig,
    }
  );

  return (
    !showNSFW && commission.nsfw ? null :
      <Link href={`/commission/${commission.id}`}>
        <figure className={classes}>
          <HostedImage src={smallest_alt.bucketId} width={width} height={height} placeholder='blur' blurDataURL={commission.thumbnail.placeholderURI} />
          <figcaption>{commission.title}</figcaption>
        </figure>
      </Link>
  );
};

const Gallery: FC<Props> = ({ commissions }) => {
  const { showNSFW, setShowNSFW } = useGlobalState();

  const { pendingCommissions, completedCommissions } = useMemo(() => {
    const sortedComms = commissions.sort((c1, c2) => c2.dateCommissioned.getTime() - c1.dateCommissioned.getTime());
    const pendingCommissions = sortedComms.filter(c => !isDefined(c.thumbnail) );
    const completedCommissions = sortedComms.filter(c => {
      if (!isDefined(c.thumbnail)) return false;
      return true;
    }).sort((c1, c2) => c2.dateReceived!.getTime() - c1.dateReceived!.getTime()).map((c) => {
      return { ...c, isBig: Math.random() < 0.2 };
    });

    return {
      pendingCommissions,
      completedCommissions,
    };
  }, [ commissions ]);

  return (
    <section>
      <button className='text-west-cream bg-west-brown w-fit p-2 flex gap-4 rounded-sm select-none' onClick={() => setShowNSFW(old => !old)}>
        <input className='accent-west-teal' type='checkbox' id='toggleNSFW' name='toggleNSFW' checked={showNSFW} readOnly />
        { showNSFW ? 'Showing NSFW' : 'Not showing NSFW' }
      </button>
      {
        pendingCommissions.length > 0 &&
        <section id='pendingCommissionGallery' className='border-b-2 py-2 lg:py-4 border-west-brown'>
          <h2>In the Works</h2>

          <section className='flex space-x-2 lg:space-x-4 overflow-x-scroll scrollbar-hidden'>
            { pendingCommissions.map((comm, idx) => <PendingCommissionCard key={`pck${idx}`} commission={comm} /> ) }
          </section>
        </section>
      }

      {
        completedCommissions.length > 0 &&
        <section id='completedCommissionGallery' className='flex flex-wrap justify-evenly xl:justify-between py-2 lg:py-4 gap-2 lg:gap-4'>
          { completedCommissions.map((comm, idx) => <CompletedCommissionCard key={`cck${idx}`} commission={comm} showNSFW={showNSFW} isBig={comm.isBig} />) }
        </section>
      }

    </section>
  );
};

export default Gallery;
