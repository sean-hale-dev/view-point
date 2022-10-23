const useCreateCommission = (refetch?: () => Promise<void>) => {
  const apiURI = '/api/commission';

  const callRefetch = async () => {
    if (typeof refetch !== 'undefined') return refetch();
  }

  const addCommission = async (args: FormData) => {
    const response = await fetch(apiURI, {
      method: 'POST',
      mode: 'same-origin',
      body: args
    });

    const json = await response.json();

    if (response.status !== 200) throw { code: response.status, resp: json };
    await callRefetch();

    return json;
  }

  return {
    addCommission
  };
}

export default useCreateCommission;
