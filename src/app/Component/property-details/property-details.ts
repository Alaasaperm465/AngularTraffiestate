import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IProperty, phone, email } from '../../models/iproperty';
import { PropertyService } from '../../Services/property';
import { FavoriteService } from '../../Services/favorite-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { ReviewStats } from '../../Services/reviw-service';
// import { ReviewService } from '../../Services/reviw-service';
// import { ReviewService, ReviewStats } from '../../Services/review-service';
import { ReviewService, ReviewStats } from '../../Services/reviw-service';


@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css',
})
export class PropertyDetails implements OnInit {
  propertyId!: number;
  property!: IProperty;
  mainImageUrl!: string;

  // استخدم هذه المتغيرات كـ default values
  defaultPhone = '+201200003943';
  defaultEmail = email;

  // Rating System
  userRating: number = 0;
  averageRating: number = 4.5;
  totalRatings: number = 120;
  hoverRating: number = 0;
  hasRated: boolean = false;
  reviewStats!: ReviewStats;
  selectedRating: number = 0;
  isSubmittingRating = false;
  userHasRated: boolean = false; // هل المستخدم قيم قبل كده؟




  // Visit Form
  visitForm = {
    name: '',
    email: '',
    phone: '',
    date: '',
    message: ''
  };

  // Similar Properties
  similarProperties: IProperty[] = [];

  // Gallery Images
  galleryImages: string[] = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
  ];

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
    private favoriteService: FavoriteService,

    private ReviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPropertyDetails();
    this.loadSimilarProperties();

    //********************************** */
        // جلب إحصائيات التقييم
        this.propertyId = Number(this.route.snapshot.paramMap.get('id'));

  // جلب Review stats
  this.ReviewService.getPropertyStats(this.propertyId).subscribe({
    next: (res) => {
      if(res) {
        this.reviewStats = res;
      }
    },
    error: (err) => console.error(err)
  });

  // جلب الريتينج اللي عمله المستخدم (لو عندك API لذلك)
   this.ReviewService.getUserPropertyRating(this.propertyId).subscribe(
    (userRating) => {
      if(userRating) {
        this.selectedRating = userRating.rating;
        this.userHasRated = true;
      }
    }
  );

  }

  loadPropertyDetails(): void {
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (res: IProperty) => {
        this.property = res;
        this.mainImageUrl = this.property.imageUrl || this.galleryImages[0];
        console.log('Property loaded:', this.property);
      },
      error: (err: any) => {
        console.error('Error loading property:', err);
      }
    });
  }

  loadSimilarProperties(): void {
    this.propertyService.getPropertyForBuy().subscribe({
      next: (properties: IProperty[]) => {
        this.similarProperties = properties
          .filter((p: IProperty) => p.id !== this.propertyId)
          .slice(0, 3);

        if (this.similarProperties.length < 3) {
          this.propertyService.getPropertyForRent().subscribe({
            next: (rentProps: IProperty[]) => {
              const additionalProps = rentProps
                .filter((p: IProperty) => p.id !== this.propertyId)
                .slice(0, 3 - this.similarProperties.length);
              this.similarProperties = [...this.similarProperties, ...additionalProps];
            },
            error: (err: any) => console.error('Error loading rent properties:', err)
          });
        }
      },
      error: (err: any) => {
        console.error('Error loading similar properties:', err);
      }
    });
  }

  // ===== IMAGE GALLERY =====
  changeMainImage(imgUrl: string): void {
    this.mainImageUrl = imgUrl;
  }

  // ===== FAVORITES =====
  toggleFavorite(event?: Event): void {
    if (event) event.stopPropagation();

    if (this.property.isFavorite) {
      this.favoriteService.removeFromFavorites(this.property.id).subscribe({
        next: () => {
          this.property.isFavorite = false;
        },
        error: (err: any) => console.error('Error removing favorite:', err)
      });
    } else {
      this.favoriteService.addToFavorites(this.property.id).subscribe({
        next: () => {
          this.property.isFavorite = true;
        },
        error: (err: any) => console.error('Error adding favorite:', err)
      });
    }
  }

  // ===== RATING SYSTEM =====
  setRating(rating: number): void {
    if (this.hasRated) return;

    this.userRating = rating;
    this.hasRated = true;

    console.log('User rated:', rating);

    this.totalRatings++;
    this.averageRating = ((this.averageRating * (this.totalRatings - 1)) + rating) / this.totalRatings;
  }

  setHoverRating(rating: number): void {
    if (!this.hasRated) {
      this.hoverRating = rating;
    }
  }

  clearHoverRating(): void {
    this.hoverRating = 0;
  }

  getStarClass(star: number): string {
    const rating = this.hoverRating || this.userRating || this.averageRating;

    if (rating >= star) {
      return 'bi-star-fill';
    } else if (rating >= star - 0.5) {
      return 'bi-star-half';
    }
    return 'bi-star';
  }

  // ===== SHARE PROPERTY =====
  shareProperty(): void {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: this.property.title,
        text: `Check out this property: ${this.property.title}`,
        url: url
      }).catch((err: any) => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  }

  // ===== VISIT FORM =====
  submitVisitRequest(): void {
    if (!this.visitForm.name || !this.visitForm.email || !this.visitForm.phone || !this.visitForm.date) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('Visit request submitted:', this.visitForm);
    alert('Visit request submitted successfully! We will contact you soon.');

    this.visitForm = {
      name: '',
      email: '',
      phone: '',
      date: '',
      message: ''
    };
  }

  // ===== CONTACT ACTIONS - تم التعديل هنا =====
  callNow(): void {
    // استخدم الرقم الافتراضي
    const phoneNumber = this.defaultPhone;
    window.location.href = `tel:${phoneNumber}`;
  }

  

  openWhatsApp(): void {
    // استخدم الرقم الافتراضي
    const phoneNumber = this.defaultPhone;
    const message = encodeURIComponent(`Hi, I'm interested in the property: ${this.property.title}\nLocation: ${this.property.area}, ${this.property.city}`);
    window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
  }

  // ===== UTILITIES =====
  getPropertyPurposeLabel(): string {
    return this.property.purpose.toLowerCase() === 'rent' ? 'For Rent' : 'For Sale';
  }

  getPriceLabel(): string {
    return this.property.purpose.toLowerCase() === 'rent' ? 'Per Month' : 'Total Price';
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
//add property review
submitRating() {
  if (!this.selectedRating) return;

  this.isSubmittingRating = true;

  const dto = {
    propertyId: this.propertyId,
    rating: this.selectedRating
  };

  this.ReviewService.addReview(dto).subscribe({
    next: () => {
      alert('Rating added successfully ⭐');
      this.isSubmittingRating = false;
      this.userHasRated = true;  // المستخدم قيم
      // تحديث متوسط الريتينج
      this.ReviewService.getPropertyStats(this.propertyId).subscribe(
        stats => this.reviewStats = stats
      );
    },
    error: (err) => {
      console.error(err);
      alert(err.error?.message || 'You already rated this property');
      this.isSubmittingRating = false;
      this.userHasRated = true; // لو حاول مرة تانية
    }
  });
}

showCallModal: boolean = false;

openCallModal() {
  this.showCallModal = true;
}

closeCallModal() {
  this.showCallModal = false;
}

makeCall() {
  window.location.href = `tel:${this.defaultPhone}`;
}
sendEmail(): void {
  const receiverEmail = 'yourgmail@gmail.com'; // غيريه لجيميلك
  const subject = 'Property Inquiry';
  const body =
    `Hello,

I am interested in this property:
${this.property?.title}

Location: ${this.property?.area}, ${this.property?.city}
Price: ${this.property?.price}

Thank you.`;

  const gmailUrl =
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(receiverEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(gmailUrl, '_blank');
}

}
