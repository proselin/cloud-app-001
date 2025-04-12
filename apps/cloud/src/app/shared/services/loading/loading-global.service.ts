import {Injectable, signal} from '@angular/core';
import {defer, finalize, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingGlobalService {
  count = signal(0)


  public setLoading(loading:boolean){
    if(loading){
      this.count.update((count :number)=> count + 1)
      return
    }
    this.count.update((count: number)=> {
      if(count == 0) return 0
      return count - 1
    })
  }

  wrapLoading<T>(observable: Observable<T>): Observable<T> {
    return defer(() => {
      this.setLoading(true)
      return observable.pipe(
        finalize(() => this.setLoading(false))
      )
    })
  }

}
