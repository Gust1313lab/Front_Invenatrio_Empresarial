import { Routes } from '@angular/router';

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
		loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
	},
	{
		path: 'employee-dashboard',
		loadComponent: () => import('./employee-dashboard/employee-dashboard.component').then((m) => m.EmployeeDashboardComponent),
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];
