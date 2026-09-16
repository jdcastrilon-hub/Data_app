import { Routes } from '@angular/router';
import { BODEGA_ROUTES } from './modules/Bodega/bodega.routes';
import { COMPRAS_ROUTES } from './modules/compras/compras.routes';
import { COMERCIAL_ROUTES } from './modules/Comercial/comercial.routes';
import { TESORERIA_ROUTES } from './modules/tesoreria/tesoreria.routes';
import { ADMINISTRACION_ROUTES } from './modules/administracion/administracion.routes';
import { LoginComponent } from './core/login/login.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { NoAutorizadoComponent } from './modules/resources/no-autorizado/no-autorizado.component';

export const routes: Routes = [
    // 1. Ruta pública e independiente a pantalla completa
    {
        path: 'login',
        component: LoginComponent,
        title: 'Iniciar sesión'
    },
    // 2. Rutas protegidas bajo el diseño del menú (MatToolbar)
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            ...BODEGA_ROUTES,
            ...COMPRAS_ROUTES,
            ...COMERCIAL_ROUTES,
            ...TESORERIA_ROUTES,
            ...ADMINISTRACION_ROUTES,
            { path: 'login', component: LoginComponent, title: 'Iniciar sesión' },
            { path: 'no-autorizado', component: NoAutorizadoComponent, title: 'No autorizado' },
        ]
    },

    // Redirección comodín en caso de escribir cualquier otra ruta inexistente
    {
        path: '**',
        redirectTo: 'login'
    }
];
