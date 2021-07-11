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
import { SubCategorias } from 'src/app/models/subcategorias';
import { circle, latLng, marker, polygon, tileLayer } from 'leaflet';
import * as L from 'leaflet';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})

export class PedidosComponent implements OnInit {
  
  index: number = 0;
  name: string;
  itemsRef: AngularFireList<any>;
  items: Observable<any[]>;
  itemsRef2: AngularFireList<any>;
  items2: Observable<any[]>;
  tableItems: any[] = [];
  filtro:string;
  categoriaF = new FormControl('');

  dataSource: MatTableDataSource<SubCategorias>;
  displayedColumns: string[] = ['fecha','activo','estado','precio','operations'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public dialog: MatDialog,
    db: AngularFireDatabase) {
    this.itemsRef = db.list('Pedidos');

    this.items = this.itemsRef.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({
          id: c.payload.key as string,
          fecha: c.payload.child('FechaPedido').val() as string,
          dly: c.payload.child('DLY').val() as string,
          producto: c.payload.child('Producto').val(),
          ubicacion: c.payload.child('idUbicacion').val() as boolean,
          estado: c.payload.child('estado').val() as boolean,
          precio: c.payload.child('Precio Total').val() as boolean,
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

    this.itemsRef2 = db.list('Usuario');
    this.items2 = this.itemsRef2.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({
          id: c.payload.key as string,
          nombre: c.payload.child('nombre').val() as string,
          tipo:c.payload.child('tipo').val() as string
        }))
      )
    );
    console.log(this.index);
    this.dataSource = new MatTableDataSource(this.tableItems);
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onChange(event) {
    this.dataSource.filter = event;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openDialog(row?: any,tipo?:string): void {
    if (tipo === 'detalles') {
      const dialogRef = this.dialog.open(DialogPedidos, {
        width: '400px',
        data: { 
          fecha: row.fecha,
          dly: row.dly,
          producto:row.producto,
          activo: row.activo,
          estado: row.estado,
          precio:row.precio }
      });
    }
    else if(tipo === 'ubicacion'){
      const dialogRef = this.dialog.open(DialogUbicacion, {
        width: '400px',
        data: { id: row.ubicacion }
      });
    }
  }


}
interface product{
  id:string;
  cantidad:string;
}
interface products{
  id:string;
  nombre:string,
  precio:string,
  cantidad:string;
}
@Component({
  selector: 'dialog-pedidos',
  templateUrl: 'dialog-pedidos.html',
  styleUrls: ['./pedidos.component.css']
})
export class DialogPedidos {
  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  itemsRef: AngularFireList<any>;
  itemsRef2: AngularFireList<products>;
  items: Observable<products[]>;
  items2: Observable<any[]>;

  products:product[]=[];

  DialogSubCategoriasForm = new FormGroup({
    nombre: new FormControl(this.data.fecha, Validators.required),
    fotoUrl: new FormControl(this.data.dly, Validators.required),
    activo: new FormControl(this.data.producto, Validators.required),
    categoria: new FormControl(this.data.categoria, Validators.required),
  });
  fotoUrl: string;
  fotoUrlEx: string = this.data.fotoUrl;
  

  constructor(
    public dialogRef: MatDialogRef<DialogPedidos>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    db: AngularFireDatabase,
    private storage: AngularFireStorage) {
    this.itemsRef = db.list('Usuario');
    this.itemsRef2 = db.list('Producto');
    
    this.fotoUrl;
    this.items = this.itemsRef2.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({
          id: c.payload.key as string,
          nombre: c.payload.child('nombre').val() as string,
          cantidad: c.payload.child('nombre').val() as string,
          precio:c.payload.child('precio').val() as string,
        }))
      )
    );

    for (let key of Object.keys(this.data.producto)) {
      let detail:product = { id: key, cantidad: (Object.values(this.data.producto[key])[0]) as string };  
      this.products.push(detail);
    }
    this.products.forEach((data)=>{
      console.log(data.id+" : " +data.cantidad);
    });

    this.items2 = this.itemsRef.snapshotChanges().pipe(
      map(changes=>
        changes.map(c=>({
          id:c.payload.key as string,
          nombre:c.payload.child('nombre').val() as string
        }))
      )
    )
  }
  uploadFile(event) {
    const file = event.target.files[0];
    const filePath = 'SubCategorias/' + Date.now();;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    // observe percentage changes
    this.uploadPercent = task.percentageChanges();
    // get notified when the download URL is available
    task.snapshotChanges().pipe(
      finalize(() => {
        this.downloadURL = fileRef.getDownloadURL();
        fileRef.getDownloadURL().subscribe(value => {
          this.fotoUrl = value
          this.DialogSubCategoriasForm.setValue({
            nombre: this.DialogSubCategoriasForm.get('nombre').value,
            fotoUrl: this.fotoUrl,
            activo: this.DialogSubCategoriasForm.get('activo').value,
            categoria: this.DialogSubCategoriasForm.get('categoria').value
          });
        });
      })
    )
      .subscribe();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  aceptar() {
    this.dialogRef.close();
  }
  updateItem(id: string, nombre: string, fotoUrl: string, activo: boolean, categoria: string) {
    this.itemsRef.update(id, { nombre: nombre, fotoUrl: fotoUrl, activo: activo, categoria: categoria, descripcion: '' });
  }
  addItem(nombre: string, fotoUrl: string, activo: boolean, categoria: string) {
    this.itemsRef.push({ nombre: nombre, fotoUrl: fotoUrl, activo: activo, categoria: categoria, descripcion: '' });
  }
}

@Component({
  selector: 'dialog-ubicacion',
  templateUrl: 'dialog-ubicacion.html',
  styleUrls: ['./pedidos.component.css']
})
export class DialogUbicacion {
  latitude='';
  longitude='';
  direccion='';
  referencia='';
  celular='';
  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  itemsRef: AngularFireList<any>;
  itemsRef2: AngularFireList<any>;
  items: Observable<any[]>;  
  options;
  layers;
  map: L.Map;

  constructor(
    public dialogRef: MatDialogRef<DialogPedidos>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    db: AngularFireDatabase,
    private storage: AngularFireStorage) {
    this.itemsRef = db.list('Usuario');
    this.itemsRef2 = db.list('Ubicacion');
    this.items = this.itemsRef2.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({
          id: c.payload.key as string,
          latitude: c.payload.child('latitude').val() as string,
          longitude: c.payload.child('longitude').val() as string,
          direccion:c.payload.child('direccion').val() as string,
          referencia:c.payload.child('referencia').val() as string,
          celular:c.payload.child('celreferencia').val() as string,
        }))
      )
    );
    this.options = {
      layers: [
        tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', 
        {  maxZoom: 20,
           attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
           accessToken: 'pk.eyJ1IjoiY3Jpc3NpbHZhIiwiYSI6ImNrbTVzN2tqYzBoZDkyeW85bzBqOHZ3NXkifQ.mC5GUucKLrEg-yVBlxTWLw',
           id: 'mapbox/streets-v11',
           tileSize: 512,
           zoomOffset: -1,
          })
      ],
      zoom: 16,
      center: latLng(Number(this.latitude), Number(this.longitude)),
      zoomControl:false,
      dragging:false,
      scrollWheelZoom: false
    };
    this.layers = [
      marker([Number(this.latitude), Number(this.longitude)])
    ];
  }
  onMapReady(map: L.Map) {
    this.map = map;
  }
  changeView() {
    this.map.panTo(new L.LatLng(Number(this.latitude), Number(this.longitude)));
  } 

  onNoClick(): void {
    this.dialogRef.close();
  }
  aceptar() {
    this.dialogRef.close();
  }
  setCoords(latitude,longitude,direccion,referencia,celular){
    this.latitude=latitude;
    this.longitude=longitude;
    this.changeView();
    this.layers = [
      marker([Number(this.latitude), Number(this.longitude)])
    ];
    this.direccion=direccion;
    this.referencia=referencia;
    this.celular=celular;
  }
}
