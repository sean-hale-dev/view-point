import { Alternate, Commission, Entity, Image } from '@prisma/client';
import useAPI from './useAPI';

type APIResult = (Commission & {thumbnail?: Image & {files: Alternate[]}, artist: Entity})[];

const jsonReviveCommission = (key: string, value: any) => {
  if (["dateCommissioned", "dateReceived"].includes(key)) {
    return new Date(value);
  }

  return value
}

const useCommissions = (inputData: APIResult | string) => {
  const { data, error, refetch } = useAPI<APIResult>('/api/commission', inputData, jsonReviveCommission);

  return {
    commissions: data,
    error,
    refetchCommissions: refetch
  };
}

export default useCommissions;
