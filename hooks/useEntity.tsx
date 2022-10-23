import { Alternate, Commission, Entity, Image, Social } from "@prisma/client";
import useAPI from "./useAPI";

type IncludedCommission = Commission & { artist: Entity, thumbnail: Image & { files: Alternate[] } }
type APIResult = Entity & { socials: Social[], commissionsDrawn: IncludedCommission[], commissionsIn: IncludedCommission[] }

const jsonRevive = (key: string, value: any) => {
  if (["dateCommissioned", "dateReceived"].includes(key)) {
    return new Date(value);
  }

  return value
}

const useEntity = (inputData: APIResult | string | undefined, entityId: number) => {
  const { data, error, refetch } = useAPI<APIResult>(`/api/entity/${entityId}`, inputData, jsonRevive);

  return {
    entity: data,
    error,
    refetchEntity: refetch
  }
}

export default useEntity;
