import { Dialog } from '@headlessui/react';
import { Entity } from '@prisma/client';
import { NextPage } from 'next';
import Link from 'next/link';
import { FC, useMemo, useState } from 'react';
import EntityForm from '../components/entityForm';
import IconAdd from '../components/icons/add';
import IconRefresh from '../components/icons/refresh';
import CustomNav from '../components/nav';
import { getEntities } from '../controllers/entity';
import useCreateEntity from '../hooks/useCreateEntity';
import useEntities from '../hooks/useEntities';
import useGlobalState from '../hooks/useGlobalState';

export async function getServerSideProps() {
  const entites = await getEntities();

  return {
    props: {
      inputEntities: entites
    }
  };
}

const EntityButton: FC<{ entity: Entity }> = ({ entity }) => {
  return (
    <Link href={`/entity/${entity.id}`}>
      <div className='bg-west-brown text-west-cream p-2 hover:cursor-pointer text-lg lg:text-xl border-2 h-fit border-transparent hover:border-west-cream whitespace-nowrap'>
        {entity.name}
      </div>
    </Link>
  );
};

const EntitiesPage: NextPage<{ inputEntities: string }> = ({ inputEntities }) => {
  const { data: entities, refetch: refetchEntities } = useEntities(inputEntities);
  const { addEntity } = useCreateEntity(refetchEntities);
  const { auth } = useGlobalState();

  const { artists, characters } = useMemo(() => {
    const artists = entities!.filter(e => e.type === 'ARTIST').sort((a, b) => a.name < b.name ? -1 : 1);
    const characters = entities!.filter(e => e.type === 'CHARACTER').sort((a, b) => a.name < b.name ? -1 : 1);

    return { artists, characters };
  }, [ entities ]);
  const [ entityForm, setEntityForm ] = useState(false);

  const links = [{ label: 'Art', href: '/commissions' }];

  return (
    <main>
      <CustomNav links={links} />

      <section className='flex justify-between items-center'>
        <div className='flex space-x-4 content-center py-2 lg:py-4'>
          <h1>Entities</h1>
          <button className='text-west-teal text-lg lg:text-2xl' onClick={async () => await refetchEntities()}><IconRefresh /></button>
        </div>
        {
          auth && <button type='button' onClick={() => setEntityForm(true)} className='text-west-teal text-2xl lg:text-4xl hover:text-west-brown'><IconAdd /></button>
        }
      </section>

      <section className='border-b-2 border-west-brown pb-4 space-y-2 lg:space-y-4'>
        <h2>Artists</h2>
        <div id='artists' className='flex gap-2 lg:gap-4 flex-wrap'>
          {
            artists.map((artist, idx) => <EntityButton key={`eak${idx}`} entity={artist} />)
          }
        </div>
      </section>

      <section className='pt-2 lg:pt-4 space-y-2 lg:space-y-4'>
        <h2>Characters</h2>
        <div id='characters' className='flex gap-2 lg:gap-4 flex-wrap'>
          {
            characters.map((character, idx) => <EntityButton key={`eck${idx}`} entity={character} />)
          }
        </div>
      </section>

      <Dialog open={entityForm} onClose={() => setEntityForm(false)} className='fixed inset-0'>
        <div className='fixed inset-0 bg-black/40' />
        <div className='fixed inset-0 inset-y-2 overflow-y-auto'>
          <Dialog.Panel className='relative p-4 lg:mx-8 bg-west-red border-8 border-west-brown rounded xl:container xl:mx-auto'>
            <Dialog.Title>Add Entity</Dialog.Title>
            <EntityForm refetch={refetchEntities} closeForm={() => setEntityForm(false)} action={addEntity} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </main>
  );
};

export default EntitiesPage;
