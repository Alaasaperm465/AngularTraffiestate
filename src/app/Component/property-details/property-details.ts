import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IProperty } from '../../models/iproperty';
import { PropertyService } from '../../Services/property';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-property-details',
  imports: [CommonModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css',
})
export class PropertyDetails  implements OnInit {
   propertyId!: number;
     property!: IProperty;
       mainImageUrl!: string; // <-- الصورة المعروضة حاليا

     constructor(private route: ActivatedRoute,private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));

    this.propertyService.getPropertyById(this.propertyId)
      .subscribe({
        next: (res) => {
          this.property = res;
          // تعيين الصورة الرئيسية للصورة الرئيسية الحالية
          this.mainImageUrl = this.property.imageUrl || 'assets/images/default-property.jpg';
        },
        error: (err) => console.error(err)
      });
  }

  toggleFavorite(property: IProperty, event?: Event) {
    if(event) event.stopPropagation();
    property.isFavorite = !property.isFavorite;
  }
   changeMainImage(imgUrl: string) {
    this.mainImageUrl = imgUrl;
  }

}
