import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {

  const http = inject(HttpClient);

  const token = localStorage.getItem('access_token');

  let clonedReq = req;

  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(

    catchError(error => {

      // 🔴 If access token expired
      if (error.status === 401) {

        return http.post<any>('http://localhost:3000/refresh', {}, {
          withCredentials: true   // IMPORTANT for cookie
        }).pipe(

          switchMap(res => {

            localStorage.setItem('access_token', res.accessToken);

            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.accessToken}`
              }
            });

            return next(retryReq);
          })

        );
      }
      return throwError(() => error);
    })

  );
};
