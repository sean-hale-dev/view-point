import { NextPage } from 'next';
import Gallery from '../components/commissionGallery';
import IconRefresh from '../components/icons/refresh';
import useCommissions from '../hooks/useCommissions';
import { getCommissions } from '../controllers/commission';
import CustomNav from '../components/nav';
import IconAdd from '../components/icons/add';
import useGlobalState from '../hooks/useGlobalState';
import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import AddCommissionForm from '../components/addCommissionForm';
import useCreateCommission from '../hooks/useCreateCommission';

export async function getServerSideProps() {
  const commissions = await getCommissions();

  return {
    props: {
      inputCommissions: JSON.stringify(commissions)
    }
  };
}

const CommissionPage: NextPage<{ inputCommissions: string }> = ({ inputCommissions }) => {
  const { commissions, refetchCommissions } = useCommissions(inputCommissions);
  const { addCommission } = useCreateCommission(refetchCommissions);
  const { auth } = useGlobalState();

  const [ addCommissionOpen, setAddCommissionOpen ] = useState(false);

  const links = [
    { label: 'Entities', href: '/entities' },
  ];
  
  return (
    <main>
      <CustomNav links={links} />
      {
        auth ?
          <section className='flex justify-between content-center'>
            <div className='flex content-center space-x-4'>
              <h1>Commissions</h1>
              <button className='text-west-teal text-2xl' onClick={async () => await refetchCommissions()}><IconRefresh /></button>
            </div>
            <div className='flex content-center'>
              <button className='text-west-teal text-3xl' type='button' onClick={() => setAddCommissionOpen(true)}><IconAdd /></button>
            </div>
          </section>
          :
          <section className='flex content-center space-x-4'>
            <h1>Commissions</h1>
            <button className='text-west-teal text-2xl' onClick={async () => await refetchCommissions()}><IconRefresh /></button>
          </section>
      }
      
      <Gallery commissions={commissions!} />

      <Dialog open={addCommissionOpen} onClose={() => setAddCommissionOpen(false)} className='fixed inset-0'>
        <div className='fixed inset-0 bg-black/40' />

        <div className='fixed inset-0 inset-y-2 overflow-y-auto'>
          <Dialog.Panel className='relative p-4 lg:mx-8 bg-west-red border-8 border-west-brown rounded xl:container xl:mx-auto'>
            <Dialog.Title>Add Commission</Dialog.Title>
            <AddCommissionForm refetch={refetchCommissions} closeForm={() => setAddCommissionOpen(false)} addCommission={addCommission}  />
          </Dialog.Panel>
        </div>
      </Dialog>
    </main>
  );
};

export default CommissionPage;
