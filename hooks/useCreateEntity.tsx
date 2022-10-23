interface AddEntityArgs {
  name: string;
  value: string;
  socials: {
    type: string;
    name: string;
    value: string;
  }[];
}

const useCreateEntity = (refetch?: () => Promise<void>) => {
  const apiURI = '/api/entity';

  const callRefetch = async () => {
    if (typeof refetch !== 'undefined') return refetch();
  }

  const addEntity = async (args: AddEntityArgs) => {
    const response = await fetch(apiURI, {
      method: 'POST',
      mode: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args)
    });

    const json = await response.json();

    if (response.status !== 200) throw { code: response.status, resp: json };
    await callRefetch();

    return json;
  }

  return {
    addEntity
  };
}

export default useCreateEntity;
