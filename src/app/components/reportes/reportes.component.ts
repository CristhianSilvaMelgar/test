import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PdfMakeWrapper,Table,ITable, Columns, Txt } from 'pdfmake-wrapper';
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import firebase from 'firebase/app';
import { map, repeat } from 'rxjs/operators';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';
import { Column, TableCell } from 'pdfmake/interfaces';
import { keyframes } from '@angular/animations';

interface Reporte{
  key:String,
  fecha:String,
  estado:string,
  precio:Number,
  activo:string
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  itemsRef: AngularFireList<Reporte>;
  items: Observable<Reporte[]>;
  data:Reporte[]=[];
  data2:Reporte[]=[];
  Table:Table;
  constructor(
    private db: AngularFireDatabase,
  ) { 
    this.itemsRef = this.db.list('Pedidos');
    this.items = this.itemsRef.snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ key: c.payload.key as string,
          fecha: c.payload.child('FechaPedido').val() as string,
          estado: c.payload.child('estado').val() as string,
          precio: c.payload.child('Precio Total').val() as Number,
          activo: c.payload.child('activo').val() as string,  }))
      )
      );
      this.items.subscribe(x=>{
        x.forEach(item=>{
          this.data.push(item);
        })
      })
  }
  generate(){
    PdfMakeWrapper.setFonts(pdfFonts);
    const pdf = new PdfMakeWrapper();
    let total=0;
    pdf.header(new Txt('\nBamboo Reporte Mensual\n\n\n').alignment('center').italics().end);
    pdf.add('');
    
    pdf.add("Fecha\t\t\t\t"+"Estado\t\t\t\t"+"Precio Total\t\t\t");
    pdf.defaultStyle({
      bold: true,
      fontSize: 15,
      margin:5
    });
    this.data2.forEach(x=>{
      if (x.estado=="true" && x.activo=="true") {
        pdf.add(`${new Date(Number(x.fecha)).toLocaleDateString('en-US')}\t\tCompletado\t\t${x.precio}`);
        var precio=x.precio.toString().split(" ");
        console.log(precio[0]);
        total+=Number(precio[0]);
      }      
    })
    pdf.add('');
    pdf.add(new Txt(`\nGanancia total del mes: ${total} Bs.`).alignment('right').end);
    pdf.footer(new Txt(`Bamboo Store Todos los derechos reservados 2021`).alignment('center').end);
    pdf.create().download();
  }


  ngOnInit(): void {
  }
  onChange(value){
    this.data2=[];
    this.data.forEach(x=>{
      if (new Date(Number(x.fecha)).getMonth() === Number(value)) {
        this.data2.push(x);
      }
    });
  }
  onChangeA(value){
    this.data2=[];
    this.data.forEach(x=>{
        if (new Date(Number(x.fecha)).getFullYear() === Number(value)) {
          this.data2.push(x);
        }
    });
  }
}
