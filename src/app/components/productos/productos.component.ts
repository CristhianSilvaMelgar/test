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
import { Productos } from 'src/app/models/productos';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {

  index:number=0;
  name: string;
  itemsRef: AngularFireList<Productos>;
  items: Observable<Productos[]>;
  itemsRef2: AngularFireList<any>;
  items2: Observable<any[]>;
  tableItems:Productos[]=[];
  categoriaF = new FormControl('');

  dataSource:MatTableDataSource<Productos>;
  displayedColumns: string[] = ['nombre','descripcion','stock','precio','activo','operations'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public dialog: MatDialog,
    db: AngularFireDatabase) {
    this.itemsRef = db.list('Producto');


    this.items = this.itemsRef.snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ id: c.payload.key as string,
          nombre: c.payload.child('nombre').val() as string,
          fotoUrl: c.payload.child('fotoUrl').val() as string,
          descripcion: c.payload.child('descripcion').val() as string,
          stock: c.payload.child('stock').val() as number,
          precio: c.payload.child('precio').val() as number,
          activo: c.payload.child('activo').val() as boolean,
          subCategoria: c.payload.child('subCategoria').val() as string,
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

    this.itemsRef2 = db.list('SubCategorias');
    this.items2 = this.itemsRef2.snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ id: c.payload.key as string,
          nombre: c.payload.child('nombre').val() as string
        }))
      )
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

  onChange(event){
    this.dataSource.filter = event;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openDialog(row?: Productos): void {
    if (row) {
      const dialogRef = this.dialog.open(DialogProductos, {
        width: '400px',
        data: {id:row.id,
          nombre:row.nombre,
          descripcion:row.descripcion,
          stock:row.stock,
          precio:row.precio,
          fotoUrl:row.fotoUrl,
          activo:row.activo,
          subCategoria:row.subCategoria}
      });
    }
    else{
      const dialogRef = this.dialog.open(DialogProductos, {
        width: '400px',
        data: {id:'',
          nombre:'',
          descripcion:'',
          stock:0,
          precio:0,
          fotoUrl:'',
          activo:null,
          subCategoria:''}
      });
    }
  }

  
}

@Component({
  selector: 'dialog-productos',
  templateUrl: 'dialog-productos.html',
  styleUrls: ['./productos.component.css']
})
export class DialogProductos {
  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  itemsRef: AngularFireList<any>;
  itemsRef2: AngularFireList<any>;
  items: Observable<any[]>;

  DialogProductosForm = new FormGroup({
    nombre: new FormControl(this.data.nombre,Validators.required),
    fotoUrl: new FormControl(this.data.fotoUrl,Validators.required),
    descripcion: new FormControl(this.data.descripcion,Validators.required),
    precio: new FormControl(this.data.precio,[Validators.required]),
    stock: new FormControl(this.data.stock,[Validators.required]),
    activo: new FormControl(this.data.activo,Validators.required),
    subcategoria: new FormControl(this.data.subCategoria,Validators.required),
  });
  fotoUrl: string;
  fotoUrlEx:string=this.data.fotoUrl;

  constructor(
    public dialogRef: MatDialogRef<DialogProductos>,
    @Inject(MAT_DIALOG_DATA) public data: Productos,
      db: AngularFireDatabase,
      private storage: AngularFireStorage) {
      this.itemsRef = db.list('Producto');
      this.itemsRef2 = db.list('SubCategorias');
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
      const filePath = 'Producto/'+ Date.now();;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);
  
      // observe percentage changes
      this.uploadPercent = task.percentageChanges();
      // get notified when the download URL is available
      task.snapshotChanges().pipe(
          finalize(() => {
            this.downloadURL = fileRef.getDownloadURL();
            fileRef.getDownloadURL().subscribe(value=>{
              this.fotoUrl=value;
              this.DialogProductosForm.setValue({nombre:this.DialogProductosForm.get('nombre').value,
              fotoUrl:this.fotoUrl,
              descripcion:this.DialogProductosForm.get('descripcion').value,
              stock:this.DialogProductosForm.get('stock').value as number,
              precio:this.DialogProductosForm.get('precio').value as number,
              activo:this.DialogProductosForm.get('activo').value,
              subcategoria:this.DialogProductosForm.get('subcategoria').value});
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
        console.log(this.DialogProductosForm.get('fotoUrl').value);
        this.updateItem(this.data.id,
          this.DialogProductosForm.get('nombre').value,
          this.DialogProductosForm.get('fotoUrl').value,
          this.DialogProductosForm.get('descripcion').value,
          this.DialogProductosForm.get('stock').value as number,
          this.DialogProductosForm.get('precio').value as number,
          this.DialogProductosForm.get('activo').value,
          this.DialogProductosForm.get('subcategoria').value)
      }else{
        this.addItem(this.DialogProductosForm.get('nombre').value,
        this.DialogProductosForm.get('fotoUrl').value,
        this.DialogProductosForm.get('descripcion').value,
        this.DialogProductosForm.get('stock').value as number,
        this.DialogProductosForm.get('precio').value as number,
        this.DialogProductosForm.get('activo').value,
        this.DialogProductosForm.get('subcategoria').value);
      }
      this.dialogRef.close();
    }
    updateItem(id: string,
       nombre: string,
       fotoUrl: string,
       descripcion: string,
       stock: number,
       precio: number,
       activo: boolean,
       subCategoria:string) {
      this.itemsRef.update(id, { 
         nombre: nombre,
         fotoUrl:fotoUrl,
         descripcion:descripcion,
         stock:stock,
         precio:precio, 
         activo:activo, 
         subCategoria: subCategoria});
    }
    addItem(nombre: string,
      fotoUrl: string,
      descripcion: string,
      stock: number,
      precio: number,
      activo: boolean,
      subCategoria:string) {
      this.itemsRef.push({
        nombre:nombre,
        fotoUrl:fotoUrl,
        descripcion:descripcion,
        stock:stock,
        precio:precio, 
        activo:activo,
        subCategoria:subCategoria});
    }
}


