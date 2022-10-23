import { Social, SocialType } from '@prisma/client';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { FC, useState } from 'react';
import Gallery from '../../components/commissionGallery';
import IconFuraffinity from '../../components/icons/furaffinity';
import IconTelegram from '../../components/icons/telegram';
import IconTwitter from '../../components/icons/twitter';
import IconWeb from '../../components/icons/web';
import { getEntity } from '../../controllers/entity';
import useEntity from '../../hooks/useEntity';
import classNames from 'classnames';
import CustomNav from '../../components/nav';
import useGlobalState from '../../hooks/useGlobalState';
import IconRefresh from '../../components/icons/refresh';
import IconPencil from '../../components/icons/pencil';
import { Dialog } from '@headlessui/react';
import EntityForm from '../../components/entityForm';
import IconDelete from '../../components/icons/delete';
import useModifyEntity from '../../hooks/useModifyEntity';
import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const entityId = context.params!.id;
  if (!entityId || Array.isArray(entityId)) throw new Error('Could not parse ID');

  const entity = await getEntity(+entityId);

  return {
    props: {
      entityId,
      inputEntity: JSON.stringify(entity, null, 2)
    }
  };
};

type EntityInput = {name: string; type: string; socials: {name: string | null; type: string; value: string; id: number | undefined}[]};
const transformEntity = (initialEntity: EntityInput, updateEntity: EntityInput) => {
  const findSocial = (social: any, socials: any[]) => {
    for (let arrSocial of socials) {
      if (arrSocial.type === social.type && arrSocial.value === social.value) {
        if (arrSocial.type === 'CUSTOM') {
          return arrSocial.name === social.name;
        } else return true;
      }
    }

    return false;
  };

  const socials = {
    add: updateEntity.socials.filter(s => !findSocial(s, initialEntity.socials)).map(s => ({ name: s.name, type: s.type, value: s.value })),
    remove: initialEntity.socials.filter(s => !findSocial(s, updateEntity.socials)).map(s => s.id!),
  };

  const entity = {
    name: updateEntity.name,
    type: updateEntity.type,
    socials,
  };

  return entity;
};

const SocialIcon: FC<{type: SocialType}> = ({ type }) => {
  switch (type) {
  case 'FURAFFINITY':
    return <IconFuraffinity />;
  case 'TWITTER':
    return <IconTwitter />;
  case 'WEBSITE':
    return <IconWeb />;
  case 'TELEGRAM':
    return <IconTelegram />;
  default:
    return null;
  }
};

const Social: FC<{social: Social}> = ({ social }) => {
  const get_social_uri = (social: Social) => {
    switch (social.type) {
    case 'TELEGRAM':
      return `https://t.me/${social.value}`;
    case 'WEBSITE':
      return `https://${social.value}`;
    case 'TWITTER':
      return `https://twitter.com/${social.value}`;
    case 'FURAFFINITY':
      return `https://furaffinity.net/user/${social.value}`;
    default:
      return social.value;
    }
  };

  const social_uri = get_social_uri(social);

  return social.type === 'CUSTOM' ? (
    <Link href={social_uri}>
      <div className='text-lg text-west-teal hover:cursor-pointer'>
        {social.name}
      </div>
    </Link>
  ) : (
    <Link href={social_uri}>
      <div className='text-4xl text-west-teal hover:cursor-pointer'>
        <SocialIcon type={social.type} />
      </div>
    </Link>
  );
};

const Socials: FC<{socials: Social[]}> = ({ socials }) => {
  return socials.length > 0 ? (
    <section className='flex gap-4 py-2 lg:py-4 content-center align-middle'>
      { socials.map((social, idx) => <Social key={`sk${idx}`} social={social} />) }
    </section>
  ) : null;
};

const EntityPage: NextPage<{entityId: number, inputEntity: string}> = ({ entityId, inputEntity }) => {
  const { auth } = useGlobalState();
  const { entity, refetchEntity } = useEntity(inputEntity, entityId);
  const { updateEntity, deleteEntity } = useModifyEntity(entity!.id);
  const router = useRouter();

  const [ entityForm, setEntityForm ] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteEntity();
      router.back();
    } catch (e) {
      console.error('Delete entity error', e);
    }
  };

  const links = [{ label: 'Entities', href: '/entities' }];

  return (
    <main>
      <CustomNav links={links} />

      <section className='flex justify-between items-center'>
        <div className='flex space-x-4 content-center'>
          <h1>{entity!.name}</h1>
          <button className='text-west-teal text-lg lg:text-2xl' onClick={refetchEntity}><IconRefresh /></button>
        </div>
        {
          auth &&
          <div className='space-x-2 lg:space-x-4'>
            <button type='button' onClick={() => setEntityForm(true)} className='text-west-teal text-2xl lg:text-4xl hover:text-west-brown'><IconPencil /></button>
            <button type='button' onClick={handleDelete} className='text-west-teal text-2xl lg:text-4xl hover:text-west-brown'><IconDelete /></button>
          </div>
        }
      </section>

      <h2>{entity!.type === 'CHARACTER' ? 'Character' : 'Artist'}</h2>
      <section className='border-b-4 border-west-brown'>
        <Socials socials={entity!.socials} />
      </section>

      {
      entity!.type === 'ARTIST' && entity!.commissionsDrawn.length > 0 &&
        <section className={classNames({ 'border-b-2 border-west-brown': entity!.commissionsIn.length > 0 })}>
          <h2>{`Art made by ${entity!.name}:`}</h2>
          <Gallery commissions={entity!.commissionsDrawn} />
        </section>
      }

      {
      entity!.commissionsIn.length > 0 &&
        <section className='py-2 lg:py-4'>
          <h2>{`Art of ${entity!.name}:`}</h2>
          <Gallery commissions={entity!.commissionsIn} />
        </section>
      }
      <Dialog open={entityForm} onClose={() => setEntityForm(false)} className='fixed inset-0'>
        <div className='fixed inset-0 bg-black/40' />
        <div className='fixed inset-0 inset-y-2 overflow-y-auto'>
          <Dialog.Panel className='relative p-4 lg:mx-8 bg-west-red border-8 border-west-brown rounded xl:container xl:mx-auto'>
            <Dialog.Title>Edit Entity</Dialog.Title>
            <EntityForm refetch={refetchEntity} closeForm={() => setEntityForm(false)} action={async (updateEntityValue: EntityInput) => {
              const update = transformEntity(entity!, updateEntityValue);
              return updateEntity(update);
            }} entity={entity} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </main>
  );
};

export default EntityPage;
