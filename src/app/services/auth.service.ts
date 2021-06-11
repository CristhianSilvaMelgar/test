import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';

import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { Usuarios } from '../models/usuarios';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<Usuarios>;
  itemsRef: AngularFireList<Usuarios>;
  items: Observable<Usuarios[]>;
  user:Usuarios = {
    Nombre: '',
    Tipo:'',
    key:''
  }; 
  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private router: Router
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
          // Logged in
        if (user) {
          this.itemsRef = this.db.list('Usuario');
          // Use snapshotChanges().map() to store the key
          this.items = this.itemsRef.snapshotChanges().pipe(
            map(changes => 
              changes.map(c => ({ key: c.payload.key as string,Nombre:c.payload.child('nombre').val() as string, Tipo: c.payload.child('tipo').val() as string }))
            )
            );
            this.items.forEach(item =>{
              item.forEach(item2=>{
                if(item2.key === firebase.auth().currentUser.uid && item2.Tipo === 'ADM'){
                  this.user={
                    Nombre: item2.Nombre,
                    Tipo: item2.Tipo,
                    key: item2.key
                  };
                }
              });
              if(this.user.Tipo === ''){
                this.logout()
              }
            });
          return db.object<Usuarios>(`Usuario/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    )
  }
  login(email,password) {
    this.afAuth.signInWithEmailAndPassword(email,password)
    .then(res => {
      this.itemsRef = this.db.list('Usuario');
      // Use snapshotChanges().map() to store the key
      this.items = this.itemsRef.snapshotChanges().pipe(
        map(changes => 
          changes.map(c => ({ key: c.payload.key as string,Nombre:c.payload.child('nombre').val() as string, Tipo: c.payload.child('tipo').val() as string }))
        )
        );
        this.items.forEach(item =>{
          item.forEach(item2=>{
            if(item2.key === firebase.auth().currentUser.uid && item2.Tipo === 'ADM'){
              this.user={
                Nombre: item2.Nombre,
                Tipo: item2.Tipo,
                key: item2.key
              };
            }
          });
          if(this.user.Tipo === ''){
            this.logout();
          }else{
            this.router.navigate(['/main']);
          }
        });
      })
      .catch(err => {
      console.log('Something is wrong:',err.message);
      });
  }
  logout() {
    this.afAuth.signOut();
    this.user= {
      Nombre: '',
      Tipo:'',
      key:''
    }; 

    this.router.navigate(['/login']);
  }
}
