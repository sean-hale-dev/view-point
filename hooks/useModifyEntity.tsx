
interface UpdateArgs {
  name: string;
  type: string;
  socials: {
    add: {
      type: string;
      name: string | null;
      value: string;
    }[];
    remove: number[];
  };
};

const useModifyEntity = (entityID: number, refetch?: () => Promise<void>) => {
  const apiURI = `/api/entity/${entityID}`;

  const callRefetch = async () => {
    if (typeof refetch !== 'undefined') return refetch();
  }

  const updateEntity = async (args: Partial<UpdateArgs>) => {
    const response = await fetch(apiURI, {
      method: 'PATCH',
      mode: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });

    const json = await response.json();

    if (response.status !== 200) throw { code: response.status, resp: json };
    await callRefetch();

    return json;
  }

  const deleteEntity = async () => {
    const response = await fetch(apiURI, {
      method: 'DELETE',
      mode: 'same-origin',
    });

    if (response.status !== 200) {
      const json = await response.json();
      throw { code: response.status, resp: json };
    }

    await callRefetch();
  }

  return {
    deleteEntity,
    updateEntity,
  }
}

export default useModifyEntity;
