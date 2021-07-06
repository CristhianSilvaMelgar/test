import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFireModule } from '@angular/fire';
import { environment } from '../environments/environment';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { PERSISTENCE } from '@angular/fire/auth';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './components/login/login.component';
import { MainComponent } from './components/main/main.component';
import { AuthGuard } from './auth.guard';
import { AngularFireStorageModule } from '@angular/fire/storage';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatSidenavModule} from '@angular/material/sidenav'; 
import { MatListModule } from '@angular/material/list';
import { FormsModule} from '@angular/forms';
import { CategoriasComponent, DialogCategorias } from './components/categorias/categorias.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DialogSubCategorias, SubcategoriasComponent } from './components/subcategorias/subcategorias.component';
import { DialogProductos ,ProductosComponent } from './components/productos/productos.component';
import { DialogUsuarios, UsuariosComponent } from './components/usuarios/usuarios.component';
import { PedidosComponent } from './components/pedidos/pedidos.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    DialogCategorias,
    CategoriasComponent,
    SubcategoriasComponent,
    DialogSubCategorias,
    ProductosComponent,
    DialogProductos,
    UsuariosComponent,
    DialogUsuarios,
    PedidosComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    RouterModule.forRoot([
      {path: 'login', component: LoginComponent},
      {path: 'main', component: MainComponent, canActivate: [AuthGuard], children:[
        {path: 'categorias', component:CategoriasComponent ,canActivate: [AuthGuard]},
        {path: 'subcategorias', component:SubcategoriasComponent ,canActivate: [AuthGuard]},
        {path: 'productos', component:ProductosComponent ,canActivate: [AuthGuard]},
        {path: 'usuarios', component:UsuariosComponent ,canActivate: [AuthGuard]},
        {path: 'pedidos', component:PedidosComponent ,canActivate: [AuthGuard]},
      ]},
      {path: '', redirectTo: '/login', pathMatch: 'full'},
    ]),
    ReactiveFormsModule,
    FormsModule,
    MatToolbarModule,
    MatInputModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatListModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatFormFieldModule,
  ],
  providers: [
    { provide: PERSISTENCE, useValue: 'session' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
