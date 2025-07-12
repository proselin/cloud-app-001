import { inject, Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { ResponseMapper } from "../models";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'})
export class ConfigService {
 private readonly apiUrl = 'http://localhost:19202/api/v1/';

 private readonly HttpClient  = inject(HttpClient);

 config: Record<string, any> = {};


 getFileIoSavedFilePath(): Observable<ResponseMapper<string>> {
   return this.httpClientClient.get<ResponseMapper<string>>(`${this.env.apiUrl}file-io/saved-file-path`).pipe(
     map((response: ResponseMapper<string>) => {
          this.config['fileIoSavedFilePath'] = response.data;
          return response;
     })
    )
  }

}
