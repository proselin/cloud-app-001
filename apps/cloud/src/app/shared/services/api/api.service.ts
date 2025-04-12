import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {}


  sayHello(): void {
    this.http.get('/api/sayHello').subscribe({
      next: () => {
        console.log('Hello');}
    })
  }
}
