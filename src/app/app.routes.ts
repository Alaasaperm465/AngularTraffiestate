import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Home } from './Component/home/home';
import { Login } from './Component/login/login';
import { Register } from './Component/register/register';
// import { OwnerDashboard } from './Component/owner-dashboard/owner-dashboard';
import { Rent } from './Component/rent/rent';
import { Buy } from './Component/buy/buy';
import { AddProperty } from './Component/add-property/add-property';
import { authGuardGuard } from './guards/auth-guard-guard';
import { roleGuardGuard } from './guards/role-guard-guard';
import { NotFound } from './Component/not-found/not-found';
import { PropertyDetails } from './Component/property-details/property-details';
import { ForgetPassword } from './Component/forget-password/forget-password';
import { ResetPassword } from './Component/reset-password/reset-password';
import { FaviroteCom } from './Component/favirote-com/favirote-com';
import { SuccessComponent } from './Component/success/success';
import { OwnerDashboardComponent } from './Component/owner-dashboard/owner-dashboard';
import { Land } from './land/land';
import { ProfileComponent } from './Component/profile/profile';
import { EditProfile } from './Component/edit-profile/edit-profile';
import { ContactUs } from './Component/contact-us/contact-us';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home, title: 'home Page' },
  { path: 'login', component: Login, title: 'Login Page' },
  { path: 'register', component: Register, title: 'register' },
  {path :'property/:id',component:PropertyDetails, title:'Property Details' },
  {path:'favorites',component:FaviroteCom,title:'My Favorites'},
  {path:'land',component:Land,title:'Land Properties'},
  {path: 'rent',component: Rent,title: 'Rent Properties'},
  { path: 'buy', component: Buy, title: 'Buy Properties' },
  { path: 'addproperty', component: AddProperty, title: 'Add Property' },
  { path: 'ownerDashboard', component: OwnerDashboardComponent, title: 'Owner Dashboard' },
  { path: 'profile', component: ProfileComponent, title: 'User Profile' },
  { path: 'userProfile', component: ProfileComponent, title: 'User Profile' },
  { path: 'edit-profile', component: EditProfile, title: 'Edit Profile' },
  { path: 'editProfile', component: EditProfile, title: 'Edit Profile' },
  { path: 'forget-password', component: ForgetPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: 'contact-us', component: ContactUs },
  { path: 'success', component: SuccessComponent },
  { path: '**', component: NotFound },

  //************************************************************************************************************************** */
  // { path: '', redirectTo: '/client', pathMatch: 'full' },

  // Client Routes
  //   {
  //     path: 'client',
  //     loadComponent: () => import('./layouts/client-layout/client-layout.component').then(m => m.ClientLayoutComponent),
  //     children: [
  //       { path: '', redirectTo: 'home', pathMatch: 'full' },
  //       { path: 'home', loadComponent: () => import('./pages/client/home/home.component').then(m => m.HomeComponent) },
  //       { path: 'properties', loadComponent: () => import('./pages/client/properties-list/properties-list.component').then(m => m.PropertiesListComponent) },
  //       { path: 'properties/:id', loadComponent: () => import('./pages/client/property-details/property-details.component').then(m => m.PropertyDetailsComponent) },
  //       { path: 'favorites', loadComponent: () => import('./pages/client/favorites/favorites.component').then(m => m.FavoritesComponent) },
  //       { path: 'profile', loadComponent: () => import('./pages/client/profile/profile.component').then(m => m.ProfileComponent) },
  //       { path: 'contact', loadComponent: () => import('./pages/client/contact/contact.component').then(m => m.ContactComponent) },
  //     ]
  //   },

  //   // Owner Routes
  //   {
  //     path: 'owner',
  //     loadComponent: () => import('./layouts/owner-layout/owner-layout.component').then(m => m.OwnerLayoutComponent),
  //     children: [
  //       { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  //       { path: 'dashboard', loadComponent: () => import('./pages/owner/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  //       { path: 'my-properties', loadComponent: () => import('./pages/owner/my-properties/my-properties.component').then(m => m.MyPropertiesComponent) },
  //       { path: 'add-property', loadComponent: () => import('./pages/owner/add-property/add-property.component').then(m => m.AddPropertyComponent) },
  //       { path: 'edit-property/:id', loadComponent: () => import('./pages/owner/edit-property/edit-property.component').then(m => m.EditPropertyComponent) },
  //       { path: 'requests', loadComponent: () => import('./pages/owner/requests/requests.component').then(m => m.RequestsComponent) },
  //       { path: 'analytics', loadComponent: () => import('./pages/owner/analytics/analytics.component').then(m => m.AnalyticsComponent) },
  //       { path: 'profile', loadComponent: () => import('./pages/owner/profile/profile.component').then(m => m.ProfileComponent) },
  //     ]
  //   },

  //   // Auth Routes
  //   { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  //   { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },

  //   // 404
  //   { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
