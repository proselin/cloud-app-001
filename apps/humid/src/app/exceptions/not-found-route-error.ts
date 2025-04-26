export class NotFoundRouteError extends Error {
  constructor(route: string) {
    super(`[ERROR] ${route} not found in humit projects`);
  }

}
