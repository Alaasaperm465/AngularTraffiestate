import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IProperty, phone, email } from '../../models/iproperty';
import { PropertyService } from '../../Services/property';
import { FavoriteService } from '../../Services/favorite-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { loadStripe, Stripe } from '@stripe/stripe-js';

// import { ReviewStats } from '../../Services/reviw-service';
// import { ReviewService } from '../../Services/reviw-service';
// import { ReviewService, ReviewStats } from '../../Services/review-service';
import { ReviewService, ReviewStats } from '../../Services/reviw-service';
import Swal from 'sweetalert2';
import { PaymentService } from '../../Services/payment-service';
// declare var Stripe: any; // هنا نستخدم Stripe كـ any

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
  bookedDates: string[] = []; // Array of booked dates (YYYY-MM-DD format)

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
  isRentalProperty: boolean = false; // افتراضي false

  //paymment
  // private stripePromise: Promise<any>; // أي شيء يسمح لنا باستعمال redirectToCheckout
  // private stripe: any;

  // Visit Form
  visitForm = {
    name: '',
    email: '',
    phone: '',
    date: '',
    message: '',
  };

  // Similar Properties
  similarProperties: IProperty[] = [];

  // Gallery Images
  galleryImages: string[] = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  ];

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
    private favoriteService: FavoriteService,

    private ReviewService: ReviewService,
    private paymentService: PaymentService
  ) {
    // this.stripePromise = loadStripe('pk_test_51Si3QQDbqOF4TUI3uDFSl1T4YZPwcEyIhtuj0mO4zBdHgrnNM4I91ZWKpvbtIPFXKsFCis7xtlOT3Wfr17l3LAxg00psroH3d5');
  }

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
        if (res) {
          this.reviewStats = res;
        }
      },
      error: (err) => console.error(err),
    });

    // جلب الريتينج اللي عمله المستخدم (لو عندك API لذلك)
    this.ReviewService.getUserPropertyRating(this.propertyId).subscribe((userRating) => {
      if (userRating) {
        this.selectedRating = userRating.rating;
        this.userHasRated = true;
      }
    });
  }

  loadPropertyDetails(): void {
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (res: IProperty) => {
        this.property = res;
        this.mainImageUrl = this.property.imageUrl || this.galleryImages[0];
        this.isRentalProperty = this.property.purpose.toLowerCase() === 'rent';
        this.loadBookedDates();

        console.log('Property loaded:', this.property);
      },
      error: (err: any) => {
        console.error('Error loading property:', err);
      },
    });
  }

  // Load booked dates for this property
  loadBookedDates(): void {
    this.propertyService.getBookedDates(this.propertyId).subscribe({
      next: (dates) => {
        this.bookedDates = dates;
        console.log('Booked dates loaded:', this.bookedDates);
      },
      error: (err) => {
        console.error('Error loading booked dates:', err);
        // If API fails, use empty array (all dates available)
        this.bookedDates = [];
      },
    });
  }

  // Check if a date is booked
  isDateBooked(dateString: string): boolean {
    return this.bookedDates.includes(dateString);
  }

  // Get all dates between two dates
  getDatesBetween(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  // Check if any date in range is booked
  isDateRangeBooked(startDate: string, endDate: string): boolean {
    const datesInRange = this.getDatesBetween(startDate, endDate);
    return datesInRange.some((date) => this.isDateBooked(date));
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
            error: (err: any) => console.error('Error loading rent properties:', err),
          });
        }
      },
      error: (err: any) => {
        console.error('Error loading similar properties:', err);
      },
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
        error: (err: any) => console.error('Error removing favorite:', err),
      });
    } else {
      this.favoriteService.addToFavorites(this.property.id).subscribe({
        next: () => {
          this.property.isFavorite = true;
        },
        error: (err: any) => console.error('Error adding favorite:', err),
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
    this.averageRating =
      (this.averageRating * (this.totalRatings - 1) + rating) / this.totalRatings;
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

  shareProperty(): void {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: this.property.title,
          text: `Check out this property: ${this.property.title}`,
          url: url,
        })
        .catch((err: any) => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(url).then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Link copied to clipboard!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: '#fff',
          color: '#2c3e50',
          iconColor: '#E2B43B',
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          },
        });
      });
    }
  }

  // ===== VISIT FORM =====
  submitVisitRequest(): void {
    if (
      !this.visitForm.name ||
      !this.visitForm.email ||
      !this.visitForm.phone ||
      !this.visitForm.date
    ) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please fill in all required fields',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#fff',
        color: '#2c3e50',
        iconColor: '#E2B43B',
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
      });
      return;
    }

    console.log('Visit request submitted:', this.visitForm);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Visit request submitted successfully! We will contact you soon.',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#fff',
      color: '#2c3e50',
      iconColor: '#E2B43B',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });

    this.visitForm = {
      name: '',
      email: '',
      phone: '',
      date: '',
      message: '',
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
    const message = encodeURIComponent(
      `Hi, I'm interested in the property: ${this.property.title}\nLocation: ${this.property.area}, ${this.property.city}`
    );
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
      rating: this.selectedRating,
    };

    this.ReviewService.addReview(dto).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Rating added successfully ⭐',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: '#fff',
          color: '#2c3e50',
          iconColor: '#E2B43B',
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          },
        });
        this.isSubmittingRating = false;
        this.userHasRated = true; // المستخدم قيم
        // تحديث متوسط الريتينج
        this.ReviewService.getPropertyStats(this.propertyId).subscribe(
          (stats) => (this.reviewStats = stats)
        );
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: err.error?.message || 'You already rated this property',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: '#fff',
          color: '#2c3e50',
          iconColor: '#E2B43B',
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          },
        });
        this.isSubmittingRating = false;
        this.userHasRated = true; // لو حاول مرة تانية
      },
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
    const receiverEmail = 'salmaesam344@gmail.com'; // غيريه لجيميلك
    const subject = 'Property Inquiry';
    const body = `Hello,

I am interested in this property:
${this.property?.title}

Location: ${this.property?.area}, ${this.property?.city}
Price: ${this.property?.price}

Thank you.`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      receiverEmail
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, '_blank');
  }
  //payment
  // في Angular - property-details.ts
  async payNow(propertyId: number) {
    try {
      // Create payment DTO with default dates (30 days rental period)
      const paymentDto = {
        propertyId: propertyId,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      const session = await this.paymentService.createPaymentSession(paymentDto);

      if (!session?.url) {
        alert('حدث خطأ أثناء إنشاء جلسة الدفع');
        return;
      }

      // تحويل مباشر لصفحة Stripe
      window.location.href = session.url;
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الاتصال بالسيرفر');
    }
  }

  // ===== BOOKING WITH DATES DIALOG =====
  openBookingDialog(propertyId: number) {
    Swal.fire({
      title: 'Select Booking Dates',
      html: `
      <div style="text-align: left; padding: 30px 20px; width: 100%;">
        <div style="margin-bottom: 25px;">
          <label style="display: block; text-align: left; margin-bottom: 10px; font-weight: 700; color: #2c3e50; font-size: 15px; letter-spacing: 0.5px;">Check-in Date</label>
          <input id="startDate" type="date" class="swal2-input" style="width: 100%; padding: 12px 15px; border-radius: 8px; border: 2px solid #E2B43B; font-size: 15px; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(226, 180, 59, 0.1);" placeholder="Arrival Date">
          <small id="startDateError" style="color: #dc3545; display: none; margin-top: 5px; font-size: 12px;"></small>
        </div>
        <div>
          <label style="display: block; text-align: left; margin-bottom: 10px; font-weight: 700; color: #2c3e50; font-size: 15px; letter-spacing: 0.5px;">Check-out Date</label>
          <input id="endDate" type="date" class="swal2-input" style="width: 100%; padding: 12px 15px; border-radius: 8px; border: 2px solid #E2B43B; font-size: 15px; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(226, 180, 59, 0.1);" placeholder="Departure Date">
          <small id="endDateError" style="color: #dc3545; display: none; margin-top: 5px; font-size: 12px;"></small>
        </div>
        <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #E2B43B; display: none;" id="bookedWarning">
          <small style="color: #856404; font-weight: 600;">⚠️ Some dates in this range are already booked</small>
        </div>
      </div>
    `,
      icon: 'question',
      iconColor: '#E2B43B',
      showCancelButton: true,
      confirmButtonText: 'Confirm Booking',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#E2B43B',
      cancelButtonColor: '#6c757d',
      focusConfirm: false,
      width: '450px',
      padding: '0',
      backdrop: true,
      allowOutsideClick: false,
      customClass: {
        popup: 'swal2-custom-popup',
        htmlContainer: 'swal2-custom-container',
        confirmButton: 'swal2-custom-confirm-btn',
        cancelButton: 'swal2-custom-cancel-btn',
      } as any,
      willOpen: (popup: any) => {
        popup.style.borderRadius = '12px';
        popup.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.2)';

        const confirmBtn = popup.querySelector('.swal2-custom-confirm-btn') as HTMLElement;
        if (confirmBtn) {
          confirmBtn.style.backgroundColor = '#E2B43B';
          confirmBtn.style.color = '#fff';
          confirmBtn.style.fontWeight = '700';
          confirmBtn.style.padding = '12px 28px';
          confirmBtn.style.borderRadius = '8px';
          confirmBtn.style.border = 'none';
          confirmBtn.style.fontSize = '14px';
          confirmBtn.style.transition = 'all 0.3s ease';
          confirmBtn.style.cursor = 'pointer';
        }

        const cancelBtn = popup.querySelector('.swal2-custom-cancel-btn') as HTMLElement;
        if (cancelBtn) {
          cancelBtn.style.backgroundColor = '#f8f9fa';
          cancelBtn.style.color = '#6c757d';
          cancelBtn.style.fontWeight = '600';
          cancelBtn.style.padding = '12px 28px';
          cancelBtn.style.borderRadius = '8px';
          cancelBtn.style.border = '2px solid #e0e0e0';
          cancelBtn.style.fontSize = '14px';
          cancelBtn.style.transition = 'all 0.3s ease';
          cancelBtn.style.cursor = 'pointer';
        }
      },
      didOpen: () => {
        const startDateInput = document.getElementById('startDate') as HTMLInputElement;
        const endDateInput = document.getElementById('endDate') as HTMLInputElement;
        const bookedWarning = document.getElementById('bookedWarning') as HTMLElement;
        const startDateError = document.getElementById('startDateError') as HTMLElement;
        const endDateError = document.getElementById('endDateError') as HTMLElement;

        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;

        startDateInput.focus();

        startDateInput.addEventListener('change', () => {
          startDateError.style.display = 'none';

          if (startDateInput.value) {
            // Check if start date is booked
            if (this.isDateBooked(startDateInput.value)) {
              startDateError.textContent = 'This date is already booked';
              startDateError.style.display = 'block';
              startDateInput.value = '';
              return;
            }

            endDateInput.min = startDateInput.value;

            // Check if end date range has booked dates
            if (
              endDateInput.value &&
              this.isDateRangeBooked(startDateInput.value, endDateInput.value)
            ) {
              bookedWarning.style.display = 'block';
            } else {
              bookedWarning.style.display = 'none';
            }
          }
        });

        endDateInput.addEventListener('change', () => {
          endDateError.style.display = 'none';

          if (endDateInput.value) {
            // Check if end date is booked
            if (this.isDateBooked(endDateInput.value)) {
              endDateError.textContent = 'This date is already booked';
              endDateError.style.display = 'block';
              endDateInput.value = '';
              return;
            }

            // Check if any date in range is booked
            if (
              startDateInput.value &&
              this.isDateRangeBooked(startDateInput.value, endDateInput.value)
            ) {
              bookedWarning.style.display = 'block';
            } else {
              bookedWarning.style.display = 'none';
            }
          }
        });
      },
      preConfirm: () => {
        const startDateInput = document.getElementById('startDate') as HTMLInputElement;
        const endDateInput = document.getElementById('endDate') as HTMLInputElement;

        if (!startDateInput.value) {
          Swal.showValidationMessage('Please select check-in date');
          return null;
        }
        if (!endDateInput.value) {
          Swal.showValidationMessage('Please select check-out date');
          return null;
        }

        if (this.isDateBooked(startDateInput.value)) {
          Swal.showValidationMessage('Check-in date is already booked');
          return null;
        }

        if (this.isDateBooked(endDateInput.value)) {
          Swal.showValidationMessage('Check-out date is already booked');
          return null;
        }

        if (new Date(startDateInput.value) >= new Date(endDateInput.value)) {
          Swal.showValidationMessage('Check-out date must be after check-in date');
          return null;
        }

        if (this.isDateRangeBooked(startDateInput.value, endDateInput.value)) {
          Swal.showValidationMessage('Some dates in this range are already booked');
          return null;
        }

        return {
          startDate: startDateInput.value,
          endDate: endDateInput.value,
        };
      },
    }).then((result: any) => {
      if (result.isConfirmed && result.value) {
        this.proceedWithBooking(propertyId, result.value.startDate, result.value.endDate);
      }
    });
  }

  async proceedWithBooking(propertyId: number, startDate: string, endDate: string) {
    try {
      const paymentDto = {
        propertyId: propertyId,
        startDate: startDate,
        endDate: endDate,
      };

      const session = await this.paymentService.createPaymentSession(paymentDto);

      if (!session?.url) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Error creating booking session',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: '#fff',
          color: '#2c3e50',
          iconColor: '#dc3545',
        });
        return;
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Dates selected: ${startDate} to ${endDate}`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#fff',
        color: '#2c3e50',
        iconColor: '#28a745',
      });

      // Redirect to payment after showing the toast
      setTimeout(() => {
        window.location.href = session.url;
      }, 3000);
    } catch (error) {
      console.error(error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Connection error',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#fff',
        color: '#2c3e50',
        iconColor: '#dc3545',
      });
    }
  }
}
