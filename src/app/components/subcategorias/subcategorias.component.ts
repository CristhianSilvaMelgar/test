import { Component, OnInit, AfterViewInit, ViewChild, Inject } from '@angular/core';
import { FormControl, FormGroup, RequiredValidator, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { SubCategorias } from 'src/app/models/sub-categorias';

@Component({
  selector: 'app-subcategorias',
  templateUrl: './subcategorias.component.html',
  styleUrls: ['./subcategorias.component.css']
})
export class SubcategoriasComponent implements OnInit {

  index:number=0;
  name: string;
  itemsRef: AngularFireList<SubCategorias>;
  items: Observable<SubCategorias[]>;
  tableItems:SubCategorias[]=[];

  dataSource:MatTableDataSource<SubCategorias>;
  displayedColumns: string[] = ['nombre','activo','categoria','operations'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public dialog: MatDialog,
    db: AngularFireDatabase) {
    this.itemsRef = db.list('SubCategorias');

    this.items = this.itemsRef.snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ id: c.payload.key as string,
          nombre: c.payload.child('nombre').val() as string,
          fotoUrl: c.payload.child('fotoUrl').val() as string,
          activo: c.payload.child('activo').val() as boolean,
          categoria: c.payload.child('categoria').val() as string,
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

  openDialog(row?: SubCategorias): void {
    if (row) {
      const dialogRef = this.dialog.open(DialogSubCategorias, {
        width: '400px',
        data: {id:row.id,nombre:row.nombre,fotoUrl:row.fotoUrl,activo:row.activo,categoria:row.categoria}
      });
    }
    else{
      const dialogRef = this.dialog.open(DialogSubCategorias, {
        width: '400px',
        data: {id:'' ,nombre:'',fotoUrl:'',activo:null,categoria:''}
      });
    }
  }

  
}

@Component({
  selector: 'dialog-subcategorias',
  templateUrl: 'dialog-subcategorias.html',
  styleUrls: ['./subcategorias.component.css']
})
export class DialogSubCategorias {
  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  itemsRef: AngularFireList<any>;
  itemsRef2: AngularFireList<any>;
  items: Observable<any[]>;

  DialogSubCategoriasForm = new FormGroup({
    nombre: new FormControl(this.data.nombre,Validators.required),
    fotoUrl: new FormControl(this.data.fotoUrl,Validators.required),
    activo: new FormControl(this.data.activo,Validators.required),
    categoria: new FormControl(this.data.categoria,Validators.required),
  });
  fotoUrl: string;
  fotoUrlEx:string=this.data.fotoUrl;

  constructor(
    public dialogRef: MatDialogRef<DialogSubCategorias>,
    @Inject(MAT_DIALOG_DATA) public data: SubCategorias,
      db: AngularFireDatabase,
      private storage: AngularFireStorage) {
      this.itemsRef = db.list('SubCategorias');
      this.itemsRef2 = db.list('Categorias');
      this.fotoUrl;
      this.items = this.itemsRef2.snapshotChanges().pipe(
        map(changes => 
          changes.map(c => ({ id: c.payload.key as string,
            nombre: c.payload.child('nombre').val() as string
          }))
        )
      );
    }
    uploadFile(event) {
      const file = event.target.files[0];
      const filePath = 'SubCategorias/'+ Date.now();;
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
              this.DialogSubCategoriasForm.setValue({nombre:this.DialogSubCategoriasForm.get('nombre').value,
              fotoUrl:this.fotoUrl,
              activo:this.DialogSubCategoriasForm.get('activo').value,
              categoria:this.DialogSubCategoriasForm.get('categoria').value});
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
        console.log(this.DialogSubCategoriasForm.get('fotoUrl').value);
        this.updateItem(this.data.id,
          this.DialogSubCategoriasForm.get('nombre').value,
          this.DialogSubCategoriasForm.get('fotoUrl').value,
          this.DialogSubCategoriasForm.get('activo').value,
          this.DialogSubCategoriasForm.get('categoria').value)
      }else{
        this.addItem(this.DialogSubCategoriasForm.get('nombre').value,
        this.DialogSubCategoriasForm.get('fotoUrl').value,
        this.DialogSubCategoriasForm.get('activo').value,
        this.DialogSubCategoriasForm.get('categoria').value);
      }
      this.dialogRef.close();
    }
    updateItem(id: string, nombre: string,fotoUrl: string,activo: boolean,categoria:string) {
      this.itemsRef.update(id, { nombre: nombre, fotoUrl:fotoUrl, activo:activo, categoria: categoria,descripcion:''});
    }
    addItem(nombre: string,fotoUrl: string,activo: boolean,categoria:string) {
      this.itemsRef.push({nombre:nombre,fotoUrl:fotoUrl,activo:activo,categoria:categoria,descripcion:''});
    }

}

