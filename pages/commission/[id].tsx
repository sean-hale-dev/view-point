import { Dialog } from '@headlessui/react';
import classNames from 'classnames';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useMemo, useState } from 'react';
import CompleteCommissionForm from '../../components/completeCommissionForm';
import EditCommissionForm from '../../components/editCommissionForm';
import HostedImage from '../../components/hostedImage';
import IconBrush from '../../components/icons/brush';
import IconDelete from '../../components/icons/delete';
import IconInvoice from '../../components/icons/invoice';
import IconPencil from '../../components/icons/pencil';
import IconUser from '../../components/icons/user';
import CustomNav from '../../components/nav';
import { getCommission } from '../../controllers/commission';
import useGlobalState from '../../hooks/useGlobalState';
import useCommission, { CommissionDetailResult } from '../../hooks/useCommission';
import useModifyCommission from '../../hooks/useModifyCommission';
import { UserError } from '../../util/error';
import Head from 'next/head';

interface CommissionDisplayProps {
  commission: CommissionDetailResult;
}

type CompleteCommissionDisplayProps = CommissionDisplayProps &
{
  refetch: () => Promise<void>,
  updateCommission: (args: Partial<{ title: string, description: string, nsfw: boolean }>) => Promise<any>,
  deleteCommission: () => Promise<void>,
}

type IncompleteCommissionDisplayProps = CommissionDisplayProps &
{
  refetch: () => Promise<void>,
  deleteCommission: () => Promise<void>,
  completeCommission: (args: FormData) => Promise<any>,
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const commissionId = context.params!.id;
  if (!commissionId || Array.isArray(commissionId)) throw new Error('Could not parse ID');

  try {
    const commission = await getCommission(+commissionId);

    return {
      props: {
        commissionId,
        inputCommission: JSON.stringify(commission),
      }
    };
  } catch (e) {
    if (e instanceof UserError) return { notFound: true };
    else return { redirect: { destination: '/500', permanent: false } };
  }
};

const get_days_between_dates = (d1: Date, d2: Date = new Date()) => {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
};

const CommissionNav: FC = () => {
  const links = [
    { label: 'Art', href: '/commissions' },
  ];

  return <CustomNav links={links} />;
};

const CharacterDisplay: FC<{ characters: { name: string, id: number }[], size: string }> = ({ characters, size }) => {
  const div_classes = classNames('flex space-x-2 lg:space-x-4 items-center hover:cursor-pointer', size);
  return (
    <div className={div_classes}>
      <IconUser className='text-west-cream hover:cursor-auto' />
      {characters.map(c => <Link key={`cdk${c.id}`} href={`/entity/${c.id}`}><p className='text-west-teal'>{c.name}</p></Link>)}
    </div>
  );
};

const ArtistDisplay: FC<{ name: string, id: number, size: string }> = ({ name, id, size }) => {
  const div_classes = classNames('flex flex-wrap space-x-2 lg:space-x-4 items-center hover:cursor-pointer', size);
  return (
    <div className={div_classes}>
      <IconBrush className='text-west-cream hover:cursor-auto' />
      <Link href={`/entity/${id}`}><p className='text-west-teal'>{name}</p></Link>
    </div>
  );
};

const EntityDisplay: FC<{ artist: { name: string, id: number }, characters: { name: string, id: number }[], size: string }> = ({ artist, characters, size }) => {
  return (
    <section className='flex flex-col lg:flex-row gap-2 lg:gap-4 lg:items-center'>
      <ArtistDisplay {...artist} size={size} />
      <p className={`text-west-brown hidden lg:block ${size}`}>&#124;</p>
      <CharacterDisplay characters={characters} size={size} />
    </section>
  );
};

const IncompleteCommissionPage: FC<IncompleteCommissionDisplayProps> = ({ commission, refetch, completeCommission, deleteCommission }) => {
  const { auth } = useGlobalState();
  const [completeCommissionOpen, setCompleteCommissionOpen] = useState(false);

  const { artist, dateCommissioned, invoice, price, characters } = commission;
  const dateCommissionedStr = `${dateCommissioned.getMonth() + 1}/${dateCommissioned.getDate()}/${dateCommissioned.getFullYear()}`;
  const daysSinceCommissioned = get_days_between_dates(dateCommissioned);

  return (
    <main>
      <CommissionNav />
      <Dialog open={completeCommissionOpen} onClose={() => setCompleteCommissionOpen(false)} className='fixed inset-0'>
        <div className='fixed inset-0 bg-black/40' />

        <div className='fixed inset-0 inset-y-2 overflow-y-auto'>
          <Dialog.Panel className='relative p-4 lg:mx-8 bg-west-red border-8 border-west-brown rounded xl:container xl:mx-auto'>
            <Dialog.Title>Complete Commission</Dialog.Title>
            <CompleteCommissionForm commissionID={commission.id} refetch={refetch} closeForm={() => setCompleteCommissionOpen(false)} completeCommission={completeCommission} />
          </Dialog.Panel>
        </div>
      </Dialog>

      {
        auth ? (
          <section className='flex justify-between items-center'>
            <h1>Pending Commission</h1>
            <div className='flex w-fit space-x-2 lg:space-x-4'>
              <button type='button' onClick={() => setCompleteCommissionOpen(true)} className='text-west-teal text-2xl lg:text-4xl hover:text-west-brown'><IconPencil /></button>
              <button type='button' onClick={deleteCommission} className='text-west-teal text-2xl lg:text-4xl hover:text-west-brown'><IconDelete /></button>
            </div>
          </section>
        ) : <h1>Pending Commission</h1>
      }
      <EntityDisplay artist={artist} characters={characters} size='text-xl lg:text-3xl' />

      <section className='border-t-2 border-west-brown pt-2 lg:pt-4 flex flex-col lg:flex-row lg:gap-4'>
        <p className='text-west-cream'>{`${daysSinceCommissioned} days since paying.`}</p>
        <p className='text-west-cream'>Commissioned on: {dateCommissionedStr}.</p>
      </section>

      {
        auth &&
        <section className='border-t-2 border-west-brown pt-2 lg:pt-4 flex flex-wrap gap-4 items-center'>
          <Link href={`/api/file/${invoice.bucketId}`}>
            <div className='text-west-cream flex items-center gap-2 bg-west-brown p-2 rounded-sm'>
              <IconInvoice />
              <p>View invoice</p>
            </div>
          </Link>
          <p className='text-west-cream'>Cost: ${price}</p>
        </section>
      }
    </main>
  );
};

const displayByteSize = (inputBytes: number): string => {
  let bytes = inputBytes;
  const valid_suffixes = ['B', 'KB', 'MB', 'GB'];
  let suffixIdx = 0;

  while (bytes > 1024 && suffixIdx < valid_suffixes.length) {
    bytes = bytes / 1024;
    suffixIdx += 1;
  }

  return `${bytes % 1 === 0 ? bytes : bytes.toFixed(2)} ${valid_suffixes[suffixIdx]}`;
};

const CompleteCommissionPage: FC<CompleteCommissionDisplayProps> = ({ commission, refetch, deleteCommission, updateCommission }) => {
  const { auth } = useGlobalState();
  const thumbnailDisplay = commission.images.find(ci => ci.thumbnailForCommissionID === commission.id) ?? commission.images[0];
  const [displayLabel, setDisplayLabel] = useState<string>(thumbnailDisplay.name);
  const [editCommissionOpen, setEditCommissionOpen] = useState(false);

  const { displayImage, displayFile, displayResolutions } = useMemo(() => {
    if (commission.images.length === 0) throw new Error('Something has gone very wrong');

    const display = commission.images.find(i => i.name.toLowerCase() === displayLabel)!;
    const resolutions = display.files.filter(f => f.userProvided).map(f => ({ bucketId: f.bucketId, resolution: `${f.width}x${f.height}`, size: displayByteSize(f.size) }));

    return {
      displayImage: display,
      displayFile: display!.files.filter(f => f.userProvided).sort((f1, f2) => f1.size - f2.size)[0],
      displayResolutions: resolutions
    };
  }, [commission, displayLabel]);

  const figureClasses = classNames('w-full', {
    'xl:w-4/5': displayFile.width > displayFile.height,
    'xl:w-1/2': displayFile.width <= displayFile.height,
  });

  return (
    <main>
      <Head>
        <title>{commission.title}</title>

        {/* OpenGraph meta cards */}
        <meta prefix='og: http://ogp.me/ns#' />
        <meta property='og:title' content={commission.title!} />
        <meta property='og:description' content={commission.description!} />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={`https://deers.io/commission/${commission.id}`} />
        <meta property='og:image' content={`https://deers.io/api/file/${commission.images[0].files.find(f => !f.userProvided)?.bucketId ?? commission.images[0].files[0].bucketId}?width=256&quality=50`} />

        {/* Twitter meta cards */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='walkingcoatrack' />
        <meta name='twitter:image' content={`https://deers.io/api/file/${commission.images[0].files.find(f => !f.userProvided)?.bucketId ?? commission.images[0].files[0].bucketId}?width=256&quality=50`} />
        <meta property='twitter:title' content={commission.title!} />
        <meta property='twitter:description' content={commission.description!} />
      </Head>

      <CommissionNav />
      <Dialog open={editCommissionOpen} onClose={() => setEditCommissionOpen(false)} className='fixed inset-0'>
        <div className='fixed inset-0 bg-black/40' />

        <div className='fixed inset-0 inset-y-2 overflow-y-auto'>
          <Dialog.Panel className='relative p-4 lg:mx-8 bg-west-red border-8 border-west-brown rounded xl:container xl:mx-auto'>
            <Dialog.Title>Edit Commission</Dialog.Title>
            <EditCommissionForm closeForm={() => setEditCommissionOpen(false)} commissionID={commission.id} title={commission.title!} description={commission.description!} nsfw={commission.nsfw} refetch={refetch} updateCommission={updateCommission} />
          </Dialog.Panel>
        </div>
      </Dialog>

      {
        auth ?
          (
            <section className='flex justify-between items-center'>
              <h1>{commission.title}</h1>
              <div className='flex w-fit space-x-2 lg:space-x-4'>
                <button onClick={() => setEditCommissionOpen(true)} className='text-west-teal text-2xl lg:text-4xl hover:text-west-brown'><IconPencil /></button>
                <button onClick={deleteCommission} className='text-west-teal text-2xl lg:text-4xl hover:text-west-brown'><IconDelete /></button>
              </div>
            </section>
          ) : <h1>{commission.title}</h1>
      }

      <section className='flex flex-col xl:flex-row gap-2 xl:gap-4 items-center xl:items-start'>
        <figure className={figureClasses}>
          <HostedImage src={displayFile.bucketId} width={displayFile.width} height={displayFile.height} quality={80} placeholder='blur' blurDataURL={displayImage.placeholderURI} alt={commission.title!} layout='responsive' />

        </figure>
        <section className='space-y-2 lg:space-y-4 w-full lg:w-2/5'>
          <div>
            <h2 className='underline'>Information</h2>
            <p className='text-west-cream'>{commission.description}</p>
          </div>

          <EntityDisplay artist={commission.artist} characters={commission.characters} size='text-md lg:text-lg' />

          <div className='text-west-cream'>
            <p>Commissioned: {`${commission.dateCommissioned.getMonth() + 1}/${commission.dateCommissioned.getDate()}/${commission.dateCommissioned.getFullYear()}`}</p>
            <p>Received: {`${commission.dateReceived!.getMonth() + 1}/${commission.dateReceived!.getDate()}/${commission.dateReceived!.getFullYear()}`}</p>
            <p>Total days: {get_days_between_dates(commission.dateCommissioned, commission.dateReceived!)}</p>
          </div>

          {
            auth &&
            <div className='text-west-cream'>
              <h2 className='underline'>Financials</h2>
              <p>Cost: ${commission.price}</p>
              <Link href={`/api/file/${commission.invoice.bucketId}`}>
                <div className='text-west-cream flex items-center gap-2 bg-west-brown p-1 lg:p-2 rounded-sm w-fit hover:cursor-pointer'>
                  <IconInvoice />
                  <p>View invoice</p>
                </div>
              </Link>
            </div>
          }

          <div>
            <h2 className='underline'>Selected Image</h2>
            {commission.images.length > 1 && <span className='text-west-cream flex space-x-1'><p>Selected image is:</p><p className='italic'>{displayImage.name}</p></span>}
            <h3 className='text-west-cream text-lg lg:text-2xl'>Available Resolutions</h3>
            <div className='flex text-west-teal space-x-2 lg:space-x-4'>
              {displayResolutions.map(f => <Link key={`dirk${f.bucketId}`} href={`/api/file/${f.bucketId}?useRaw=true`}>{`${f.resolution} (${f.size})`}</Link>)}
            </div>
          </div>

          {
            commission.images.length > 1 &&
            <div className="space-y-2 lg:space-y-4">
              <h2 className='underline'>Alternates</h2>
              <div className='flex gap-2 lg:gap-4'>
                {
                  commission.images.map(i => {
                    const selected_file = i.files.sort((f1, f2) => f1.width - f2.width)[0];
                    return <div key={`altkey${selected_file.id}`} className='w-24' onClick={() => setDisplayLabel(i.name)}>
                      <HostedImage src={selected_file.bucketId} width={selected_file.width} height={selected_file.height} quality={25} alt="commission alternate image" />
                    </div>;
                  })
                }
              </div>
            </div>
          }
        </section>
      </section>
    </main>
  );
};

const CommissionPage: NextPage<{ commissionId: number, inputCommission: string }> = ({ commissionId, inputCommission }) => {
  const { data: commission, refetch: refetchCommission } = useCommission(commissionId, inputCommission);
  const { deleteCommission, updateCommission, completeCommission } = useModifyCommission(commissionId, refetchCommission);
  const router = useRouter();

  const handleDeletion = async () => {
    try {
      await deleteCommission();
      router.push('/commissions');
    } catch (e) {
      console.error('Delete commission error', e);
    }
  };

  return commission!.dateReceived === undefined || commission!.dateReceived === null ?
    <IncompleteCommissionPage commission={commission!} refetch={refetchCommission} deleteCommission={handleDeletion} completeCommission={completeCommission} /> :
    <CompleteCommissionPage commission={commission!} refetch={refetchCommission} deleteCommission={handleDeletion} updateCommission={updateCommission} />;
};

export default CommissionPage;
