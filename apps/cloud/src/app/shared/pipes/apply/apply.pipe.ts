import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'apply'
})
export class ApplyPipe implements PipeTransform {

  transform<Result, Args extends any[]>(fn: (...args: Args) => Result, ...args: Args): Result {
    if (typeof fn !== 'function') throw Error('First argument must be a function');
    return fn.apply(null, args);
  }

}
