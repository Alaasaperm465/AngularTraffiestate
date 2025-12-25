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

  callNow(): void {
    Swal.fire({
      title: 'Call Us',
      html: `<p>Phone: <strong>${this.phone}</strong></p>`,
      icon: 'info',
      confirmButtonText: 'Copy',
      confirmButtonColor: '#E2B43B',
      showCancelButton: true,
      cancelButtonText: 'Close',
      didOpen: () => {
        const confirmBtn = document.querySelector('.swal2-confirm') as HTMLElement;
        if (confirmBtn) {
          confirmBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(this.phone);
            Swal.fire({
              title: 'Copied!',
              text: 'Phone number copied to clipboard',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          });
        }
      }
    });
  }
}
