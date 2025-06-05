import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { isPromise } from 'rxjs/internal/util/isPromise';

export type Nullable<T> = T | null;

export async function responseMapper<Res = any, Err = any>(
  response: Promise<Res> | Observable<Res> | Res
): Promise<ReturnType<typeof responseNormalize>> {
  if (isObservable(response)) {
    return handlePromiseResponse(firstValueFrom(response));
  }

  if (isPromise(response)) {
    return handlePromiseResponse(response);
  }

  return responseNormalize(response, null);
}

async function handlePromiseResponse(response: Promise<any>) {
  try {
    return responseNormalize(await response, null);
  } catch (err) {
    return responseNormalize(null, err);
  }
}

function responseNormalize<Res = any>(response: Nullable<Res>, error: Nullable<any>) {
    return {
      response,
      error
    }
}
