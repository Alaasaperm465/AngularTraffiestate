import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  phone: string = '+201098280551'; // Replace with actual phone number
  email: string = 'basem.abulgheit@gmail.com'; // Replace with actual email
  showCallModal: boolean = false;

  openCallModal(): void {
    this.showCallModal = true;
  }

  closeCallModal(): void {
    this.showCallModal = false;
  }

  makeCall(): void {
    window.location.href = `tel:${this.phone}`;
  }

  callNow(): void {
    this.openCallModal();
  }
}
