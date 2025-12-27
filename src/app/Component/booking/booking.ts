import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../Services/payment-service';
import { CreatePaymentDto } from '../../models/create-payment-dto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../Services/PropertyService/property';
import { BookedDateRange, BookingService } from '../../Services/booking-service';
import Swal from 'sweetalert2';

interface BookedDate {
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-booking',
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
})

export class Booking implements OnInit {
  propertyId!: number;
  property: any;
  startDate: string = '';
  endDate: string = '';
  pricePerDay = 0;
  totalPrice = 0;
  isLoading = false;
  isLoadingProperty = true;

  // Calendar
  currentMonth: Date = new Date();
  calendarDays: any[] = [];
  bookedDates: BookedDate[] = [];
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private propertyService: PropertyService,
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProperty();
    this.loadBookedDates();
    this.generateCalendar();
  }

  loadProperty() {
    this.isLoadingProperty = true;
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data) => {
        this.property = data;
        this.pricePerDay = data.price;
        this.isLoadingProperty = false;
        console.log('Property loaded:', this.property);
      },
      error: (err) => {
        console.error('Error loading property:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load property details',
          confirmButtonColor: '#E2B43B'
        });
        this.isLoadingProperty = false;
      }
    });
  }

  loadBookedDates() {
    this.bookingService.getBookedDates(this.propertyId).subscribe({
      next: (dates: BookedDateRange[]) => {
        this.bookedDates = dates.map(d => ({
          startDate: new Date(d.startDate),
          endDate: new Date(d.endDate)
        }));
        console.log('Booked dates loaded:', this.bookedDates);
        this.generateCalendar();
      },
      error: (err) => {
        console.error('Error loading booked dates:', err);
        // Still generate calendar even if API fails
        this.generateCalendar();
      }
    });
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    this.calendarDays = [];

    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
      this.calendarDays.push({ date: null, disabled: true });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isBooked = this.isDateBooked(date);
      const isPast = this.isPastDate(date);
      const isSelected = this.isDateSelected(date);
      const isInRange = this.isDateInRange(date);

      this.calendarDays.push({
        date: day,
        fullDate: date,
        disabled: isBooked || isPast,
        isBooked,
        isPast,
        isSelected,
        isInRange
      });
    }
  }

  isDateBooked(date: Date): boolean {
    return this.bookedDates.some(booked => {
      const bookStart = new Date(booked.startDate);
      const bookEnd = new Date(booked.endDate);
      bookStart.setHours(0, 0, 0, 0);
      bookEnd.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return date >= bookStart && date <= bookEnd;
    });
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  }

  isDateSelected(date: Date): boolean {
    if (!this.selectedStartDate && !this.selectedEndDate) return false;

    const dateStr = this.formatDate(date);
    const startStr = this.selectedStartDate ? this.formatDate(this.selectedStartDate) : null;
    const endStr = this.selectedEndDate ? this.formatDate(this.selectedEndDate) : null;

    return dateStr === startStr || dateStr === endStr;
  }

  isDateInRange(date: Date): boolean {
    if (!this.selectedStartDate || !this.selectedEndDate) return false;

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(this.selectedStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.selectedEndDate);
    end.setHours(0, 0, 0, 0);

    return d > start && d < end;
  }

  selectDate(day: any) {
    if (day.disabled || !day.date) return;

    const selectedDate = day.fullDate;

    // If no start date or both dates are selected, start fresh
    if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
      this.selectedStartDate = selectedDate;
      this.selectedEndDate = null;
      this.startDate = this.formatDate(selectedDate);
      this.endDate = '';
    }
    // If start date exists but no end date
    else if (this.selectedStartDate && !this.selectedEndDate) {
      if (selectedDate > this.selectedStartDate) {
        // Check if there's any booked date in between
        if (!this.hasBookedDateInRange(this.selectedStartDate, selectedDate)) {
          this.selectedEndDate = selectedDate;
          this.endDate = this.formatDate(selectedDate);
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Some dates in this range are already booked',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#fff',
            color: '#2c3e50',
            iconColor: '#E2B43B'
          });
          return;
        }
      } else {
        // Selected date is before start, make it the new start
        this.selectedStartDate = selectedDate;
        this.startDate = this.formatDate(selectedDate);
      }
    }

    this.generateCalendar();
    this.calculateTotal();
  }

  hasBookedDateInRange(start: Date, end: Date): boolean {
    const current = new Date(start);
    current.setDate(current.getDate() + 1); // Start from day after start

    while (current < end) {
      if (this.isDateBooked(current)) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  }

  previousMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.generateCalendar();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMonthName(): string {
    return this.currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  calculateTotal() {
    if (!this.startDate || !this.endDate || !this.pricePerDay) {
      this.totalPrice = 0;
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (end <= start) {
      this.totalPrice = 0;
      return;
    }

    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    this.totalPrice = days * this.pricePerDay;
  }

  getDays(): number {
    if (!this.startDate || !this.endDate) return 0;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  clearDates() {
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.startDate = '';
    this.endDate = '';
    this.totalPrice = 0;
    this.generateCalendar();
  }

  async bookNow() {
    if (!this.startDate || !this.endDate || this.totalPrice <= 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please select booking dates first',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#fff',
        color: '#2c3e50',
        iconColor: '#E2B43B'
      });
      return;
    }

    this.isLoading = true;

    const dto: CreatePaymentDto = {
      propertyId: this.propertyId,
      startDate: this.startDate,
      endDate: this.endDate
    };

    try {
      const res = await this.paymentService.createPaymentSession(dto);

      if (!res?.url) {
        throw new Error('No payment URL received');
      }

      // Redirect to Stripe
      window.location.href = res.url;
    } catch (err: any) {
      console.error('Payment session creation failed:', err);

      Swal.fire({
        icon: 'error',
        title: 'Payment Error',
        text: err?.error?.message || 'Failed to create payment session',
        confirmButtonColor: '#E2B43B'
      });

      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/property', this.propertyId]);
  }
}
