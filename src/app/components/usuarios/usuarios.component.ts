import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { FormControl, FormGroup, MinLengthValidator, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import firebase from 'firebase/app';
import { Usuarios } from 'src/app/models/usuarios';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  index: number = 0;
  name: string;
  itemsRef: AngularFireList<Usuarios>;
  items: Observable<Usuarios[]>;
  tableItems: Usuarios[] = [];
  categoriaF = new FormControl('');

  dataSource: MatTableDataSource<Usuarios>;
  displayedColumns: string[] = ['Nombre', 'Tipo','activo', 'operations'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public dialog: MatDialog,
    db: AngularFireDatabase) {
    this.itemsRef = db.list('Usuario');
    this.items = this.itemsRef.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({
          key: c.payload.key as string,
          Nombre: c.payload.child('nombre').val() as string,
          Tipo: c.payload.child('tipo').val() as string,
          activo: c.payload.child('activo').val() as boolean,
        }))
      )
    );
    this.items.subscribe(
      x => {
        this.dataSource = new MatTableDataSource(x);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      err => console.error('Observer got an error: ' + err),
      () => console.log('Observer got a complete notification')
    );
    this.dataSource = new MatTableDataSource(this.tableItems);
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    this.dataSource.filterPredicate = function (data, filter) {
      // Transform the data into a lowercase string of all property values.
      /** @type {?} */
      var dataStr = Object.keys(data).reduce(function (currentTerm, key) {
          // Use an obscure Unicode character to delimit the words in the concatenated string.
          // This avoids matches where the values of two columns combined will match the user's query
          // (e.g. `Flute` and `Stop` will match `Test`). The character is intended to be something
          // that has a very low chance of being typed in by somebody in a text field. This one in
          // particular is "White up-pointing triangle with dot" from
          // https://en.wikipedia.org/wiki/List_of_Unicode_characters
          return currentTerm + ((/** @type {?} */ (data)))[key] + '◬';
      }, '').toLowerCase();
      // Transform the filter by converting it to lowercase and removing whitespace.
      /** @type {?} */
      var transformedFilter = filter.trim().toLowerCase();
      return dataStr.indexOf(transformedFilter) != -1;
    };
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onChange(event) {
    this.dataSource.filterPredicate=(data:Usuarios,filter:string)=>{
      return data.Tipo==filter;
    }
    this.dataSource.filter = event;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openDialog(row?: Usuarios): void {
    if (row) {
      const dialogRef = this.dialog.open(DialogUsuarios, {
        width: '400px',
        data: { key: row.key, Nombre: row.Nombre, Tipo: row.Tipo, activo: row.activo}
      });
    }
    else {
      const dialogRef = this.dialog.open(DialogUsuarios, {
        width: '400px',
        data: { key: '', Nombre: '', Tipo: '', activo: null }
      });
    }
  }


}

@Component({
  selector: 'dialog-usuarios',
  templateUrl: 'dialog-usuarios.html',
  styleUrls: ['./usuarios.component.css']
})
export class DialogUsuarios {
  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  itemsRef: AngularFireList<any>;
  itemsRef2: AngularFireList<any>;
  items: Observable<any[]>;

  DialogUsuariosForm = new FormGroup({
    nombre: new FormControl(this.data.Nombre, Validators.required),
    tipo: new FormControl(this.data.Tipo, Validators.required),
    email: new FormControl("alguien@example.com", [Validators.required,Validators.email]),
    password: new FormControl("123456", [Validators.required,Validators.minLength(6)]),
    activo: new FormControl(this.data.activo, Validators.required)
  });

  constructor(
    private afAuth: AngularFireAuth,
    public dialogRef: MatDialogRef<DialogUsuarios>,
    @Inject(MAT_DIALOG_DATA) public data: Usuarios,
    db: AngularFireDatabase,
    private storage: AngularFireStorage) {
      this.itemsRef = db.list('Usuario');
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  aceptar() {
    if (this.data.key !== '') {
      this.updateItem(this.data.key,
        this.DialogUsuariosForm.get('nombre').value,
        this.DialogUsuariosForm.get('tipo').value,
        this.DialogUsuariosForm.get('activo').value)
    } else {
      this.addItem(this.DialogUsuariosForm.get('nombre').value,
        this.DialogUsuariosForm.get('tipo').value,
        this.DialogUsuariosForm.get('activo').value,
        this.DialogUsuariosForm.get('email').value,
        this.DialogUsuariosForm.get('password').value);
    }
    this.dialogRef.close();
  }
  updateItem(id: string, nombre: string, tipo: string, activo: boolean) {
    this.itemsRef.update(id, { nombre: nombre, tipo: tipo, activo: activo});
  }
  addItem(nombre: string, tipo: string, activo: boolean,email: string, password:string) {
    this.afAuth.createUserWithEmailAndPassword(email,password)
    .then(res => {
      this.itemsRef.update(firebase.auth().currentUser.uid, { nombre: nombre, tipo: tipo, activo: activo});
      })
      .catch(err => {
      console.log('Something is wrong:',err.message);
      });     
  }
}
