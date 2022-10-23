import { useEffect, useState } from "react";

function useAPI<S>(apiPath: string, initialData: S | string | undefined, transformer?: (key: string, value: any) => any) {
  let inputData;
  if (typeof initialData === 'string' && typeof transformer !== "undefined") {
    inputData = JSON.parse(initialData, transformer)
  } else {
    inputData = initialData;
  }

  const [data, setData] = initialData ? useState<S>(inputData) : useState<S>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAPI = async () => {
    setLoading(true);

    const response = await fetch(apiPath);
    let json;
    if (typeof transformer !== "undefined") {
      const body = await response.text();
      json = JSON.parse(body, transformer);
    } else {
      json = await response.json();
    }

    if (response.status !== 200) {
      setError(json.error);
    } else {
      setData(json);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (initialData === undefined) {
      fetchAPI();
    }
  }, [apiPath]);

  const refetch = async () => {
    await fetchAPI();
  }

  return {
    data, error, loading, refetch
  }
}

export default useAPI;
