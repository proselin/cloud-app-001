export function generateImageLink(host: string, fileName?: string): string  {
  if(!fileName) {
    return "";
  }
  return host + '/' +  fileName;
}
