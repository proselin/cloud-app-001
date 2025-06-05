export function isPromise(value: any) : value is Promise<any> {
  //eslint-disable-next-line
  // @ts-ignore
  return Boolean(value && "then" in value && typeof value.then === "function" );
}
