import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

interface RequestOptions {
  params?: HttpParams;
  withCredentials?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, {
      params: options?.params,
      withCredentials: options?.withCredentials,
    });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, {
      params: options?.params,
      withCredentials: options?.withCredentials,
    });
  }

  patch<T>(path: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body, {
      params: options?.params,
      withCredentials: options?.withCredentials,
    });
  }

  delete<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, {
      params: options?.params,
      withCredentials: options?.withCredentials,
    });
  }
}
