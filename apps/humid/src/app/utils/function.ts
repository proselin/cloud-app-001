import { createHash } from "node:crypto";

export function createShake256Hash(data: string | Buffer, len: number) {
  return createHash("shake256", { outputLength: len }).update(data).digest("hex");
}


export async function runWithConcurrency<T = unknown>(tasks: Promise<T>[], limit: number) {
  const results: Awaited<typeof tasks> = [];
  const executing: typeof tasks= [];

  for (const task of tasks) {
    const p = task.then(res => {
      executing.splice(executing.indexOf(p), 1);
      return res;
    });

    results.push(p);
    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing); // wait for any to finish
    }
  }

  return Promise.all(results);
}
