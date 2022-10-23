import { Entity } from "@prisma/client";
import useAPI from "./useAPI";

type APIResult = Entity[]

export const useEntities = (inputData?: APIResult | string) => {
  const { data, error, refetch, loading } = useAPI<APIResult>('/api/entity', inputData);

  return {
    data,
    error,
    refetch,
    loading,
  }
}

export default useEntities;
