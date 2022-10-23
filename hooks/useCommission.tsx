import { Alternate, Commission, Entity, Image, Invoice } from '@prisma/client';
import useAPI from './useAPI';

type EnhancedImage = Image & { files: Alternate[] };
export type CommissionDetailResult = Commission & { artist: Entity, characters: Entity[], images: EnhancedImage[], invoice: Invoice };

const jsonRevive = (key: string, value: any) => {
  if (["dateCommissioned", "dateReceived"].includes(key) && typeof value === 'string') {
    return new Date(value);
  }

  return value
}

const useCommission = (commissionId: number, inputData?: CommissionDetailResult | string) => {
  const { data, error, refetch } = useAPI<CommissionDetailResult>(`/api/commission/${commissionId}`, inputData, jsonRevive)

  return {
    data,
    error,
    refetch
  };
}

export default useCommission;
