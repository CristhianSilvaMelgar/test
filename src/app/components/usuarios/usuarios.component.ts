import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { Categorias } from 'src/app/models/categorias';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  index:number=0;
  name: string;
  itemsRef: AngularFireList<Categorias>;
  items: Observable<Categorias[]>;
  tableItems:Categorias[]=[];

  displayedColumns: string[] = ['nombre', 'activo','operations'];
  dataSource:MatTableDataSource<Categorias>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public dialog: MatDialog,
    db: AngularFireDatabase) { 
    this.itemsRef = db.list('Categorias');
    this.items = this.itemsRef.snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ id: c.payload.key as string,
          nombre: c.payload.child('nombre').val() as string,
          fotoUrl: c.payload.child('fotoUrl').val() as string,
          activo: c.payload.child('activo').val() as boolean,
        }))
      )
    );
    this.items.subscribe(
      x => {
        this.dataSource= new MatTableDataSource(x);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      err => console.error('Observer got an error: ' + err),
      () => console.log('Observer got a complete notification')
    );
    console.log(this.index);
    this.dataSource= new MatTableDataSource(this.tableItems);
  }
  
  ngOnInit(): void {
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }


  openDialog(row?: Categorias): void {
    if (row) {
      const dialogRef = this.dialog.open(DialogUsuarios, {
        width: '400px',
        data: {id:row.id,nombre:row.nombre,fotoUrl:row.fotoUrl,activo:row.activo}
      });
    }
    else{
      const dialogRef = this.dialog.open(DialogUsuarios, {
        width: '400px',
        data: {id:'' ,nombre:'',fotoUrl:'',activo:null}
      });
    }
  }
  
}
@Component({
  selector: 'dialog-categorias',
  templateUrl: 'dialog-usuarios.html',
  styleUrls: ['./usuarios.component.css']
})
export class DialogUsuarios{
  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  itemsRef: AngularFireList<any>;

  DialogCategoriasForm = new FormGroup({
    nombre: new FormControl(this.data.nombre,Validators.required),
    fotoUrl: new FormControl(this.data.fotoUrl,Validators.required),
    activo: new FormControl(this.data.activo,Validators.required)
  });
  fotoUrl: string;
  fotoUrlEx:string=this.data.fotoUrl;

  constructor(
    public dialogRef: MatDialogRef<DialogUsuarios>,
    @Inject(MAT_DIALOG_DATA) public data: Categorias,
    db: AngularFireDatabase,
      private storage: AngularFireStorage) {
      this.itemsRef = db.list('Categorias');
      this.fotoUrl;
      console.log(this.DialogCategoriasForm.get('activo').value)
    }
    uploadFile(event) {
      const file = event.target.files[0];
      const filePath = 'Categorias/'+ Date.now();;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);
  
      // observe percentage changes
      this.uploadPercent = task.percentageChanges();
      // get notified when the download URL is available
      task.snapshotChanges().pipe(
          finalize(() => {
            this.downloadURL = fileRef.getDownloadURL();
            fileRef.getDownloadURL().subscribe(value=>{
              this.fotoUrl=value
              this.DialogCategoriasForm.setValue({nombre:this.DialogCategoriasForm.get('nombre').value,fotoUrl:this.fotoUrl,activo:this.DialogCategoriasForm.get('activo').value});
            });
          })
       )
      .subscribe();
    }
  onNoClick(): void {
    this.dialogRef.close();
  }
  aceptar(){
    if (this.data.id!=='') {
      console.log(this.DialogCategoriasForm.get('fotoUrl').value);
      this.updateItem(this.data.id,
        this.DialogCategoriasForm.get('nombre').value,
        this.DialogCategoriasForm.get('fotoUrl').value,
        this.DialogCategoriasForm.get('activo').value);
    }else{
      this.addItem(this.DialogCategoriasForm.get('nombre').value,this.DialogCategoriasForm.get('fotoUrl').value,this.DialogCategoriasForm.get('activo').value);
    }
    this.dialogRef.close();
  }

  updateItem(id: string, nombre: string,fotoUrl: string,activo: boolean) {
    this.itemsRef.update(id, { nombre: nombre, fotoUrl:fotoUrl, activo:activo });
  }
  addItem(nombre: string,fotoUrl: string,activo: boolean) {
    this.itemsRef.push({nombre:nombre,fotoUrl:fotoUrl,activo:activo });
  }


}
