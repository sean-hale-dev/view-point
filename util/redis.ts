import Redis from "ioredis";

const client = new Redis(process.env.REDIS_URL!);

const readKey = async (key: string) => {
  const value = await client.get(key);

  return value
}

const writeKey = async (key: string, value: string) => {
  const reply = await client.set(key, value);

  return reply
}

export {
  readKey,
  writeKey,
}
