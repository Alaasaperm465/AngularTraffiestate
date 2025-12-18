import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PropertyٍService } from '../../Services/property';
import { IProperty } from '../../models/iproperty';

@Component({
  selector: 'app-rent',
  imports: [],
  templateUrl: './rent.html',
  styleUrl: './rent.css',
})
export class Rent implements OnInit
 {
  rentproperties!:IProperty[];
  constructor(private rentserv:PropertyٍService,private cdn:ChangeDetectorRef)
  {

  }
  ngOnInit(): void
  {
    this.rentserv.getPropertyForRent().subscribe((data)=>
    {
      console.log(data);
      this.rentproperties=data;
      this.cdn.detectChanges();
    });
  }



}
