import { Routes } from '@angular/router';
import { Login } from './features/auth/login';
import { roleGuard } from './core/guards/role.guard';
import { authGuard } from './core/guards/auth.guard';


export const routes: Routes = [
    { path: '', loadComponent: ()=> import('./features/landing/landing').then(m => m.Landing)},
    { path: 'login', component: Login},
    {
        path: 'admin',
        canActivate: [authGuard, roleGuard('ADMIN')],
        loadComponent: () =>
        import('./features/admin/pages/dashboard/admin')
            .then(m => m.Admin)
    },

    {
        path: 'employee',
        canActivate: [authGuard, roleGuard('EMPLOYEE')],
        loadComponent: () =>
        import('./features/employee/kanban/employee')
            .then(m => m.Employee)
    },
];
