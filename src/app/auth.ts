// import { Injectable, signal } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class Auth {
//     currentUser = signal<{username:string, role:'ADMIN'|'EMPLOYEE'} | null>(null);

//   login(username:string){

//     if(username === 'admin'){
//       this.currentUser.set({username:'admin', role:'ADMIN'});
//     }else{
//       this.currentUser.set({username, role:'EMPLOYEE'});
//     }
//   }

//   logout(){
//     this.currentUser.set(null);
//   }
// }
