import { ChangeDetectorRef, Component } from '@angular/core';
import { IProperty } from '../../models/iproperty';
import { PropertyٍService } from '../../Services/property';

@Component({
  selector: 'app-buy',
  imports: [],
  templateUrl: './buy.html',
  styleUrl: './buy.css',
})
export class Buy {
   buyproperties!:IProperty[];
    constructor(private buyservice:PropertyٍService,private cdn:ChangeDetectorRef)
     {

     }
      ngOnInit(): void
  {
    this.buyservice.getPropertyForBuy().subscribe((data)=>
    {
      console.log(data);
      this.buyproperties=data;
      this.cdn.detectChanges();
    });
  }


}
