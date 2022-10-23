interface UpdateArgs {
  title: string;
  description: string;
  nsfw: boolean;
};

const useModifyCommission = (commissionID: number, refetch?: () => Promise<void>) => {
  const apiURI = `/api/commission/${commissionID}`;

  const callRefetch = async () => {
    if (typeof refetch !== 'undefined') return refetch();
  }

  const updateCommission = async (args: Partial<UpdateArgs>) => {
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

  const completeCommission = async (args: FormData) => {
    const response = await fetch(apiURI, {
      method: 'PUT',
      mode: 'same-origin',
      body: args
    });

    const json = await response.json();

    if (response.status !== 200) throw { code: response.status, resp: json };
    await callRefetch();

    return json;
  }

  const deleteCommission = async () => {
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
    completeCommission,
    deleteCommission,
    updateCommission,
  }
}

export default useModifyCommission;
