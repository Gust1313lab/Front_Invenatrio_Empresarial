import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login',
	},
	{
		path: 'login',
		loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
	},
	{
		path: 'dashboard',
		canActivate: [authGuard],
		loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];
