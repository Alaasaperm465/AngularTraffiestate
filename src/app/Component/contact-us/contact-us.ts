import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule, TranslateModule],
  templateUrl: './contact-us.html',
  styleUrls: ['./contact-us.css']
})
export class ContactUs implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';
  placeholders: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private translate: TranslateService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadPlaceholders();
  }

  loadPlaceholders(): void {
    const placeholderKeys = [
      'contact.form.name_placeholder',
      'contact.form.email_placeholder',
      'contact.form.phone_placeholder',
      'contact.form.subject_placeholder',
      'contact.form.message_placeholder'
    ];
    
    placeholderKeys.forEach(key => {
      this.placeholders[key] = this.translate.instant(key);
    });
    
    this.translate.onLangChange.subscribe(() => {
      placeholderKeys.forEach(key => {
        this.placeholders[key] = this.translate.instant(key);
      });
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      this.submitError = false;
      this.submitSuccess = false;
      this.errorMessage = '';

      const contactData = {
        name: this.contactForm.value.name,
        email: this.contactForm.value.email,
        phone: this.contactForm.value.phone,
        subject: this.contactForm.value.subject,
        message: this.contactForm.value.message
      };

      console.log('Sending data:', contactData);
      console.log('API URL:', `${environment.apiUrl}/Contact/send`);

      this.http.post(`${environment.apiUrl}/Contact/send`, contactData)
        .subscribe({
          next: (response: any) => {
            console.log(' Email sent successfully:', response);
            this.isSubmitting = false;
            this.submitSuccess = true;
            this.contactForm.reset();
            
            setTimeout(() => {
              this.submitSuccess = false;
            }, 5000);
          },
          error: (error) => {
            console.error(' Error sending email:', error);
            console.error('Error details:', error.error);
            console.error('Status:', error.status);
            
            this.isSubmitting = false;
            this.submitError = true;
            
            if (error.status === 0) {
              this.errorMessage = 'لا يمكن الاتصال بالسيرفر. تأكد من تشغيل API';
            } else if (error.status === 500) {
              this.errorMessage = error.error?.message || 'حدث خطأ في السيرفر أثناء إرسال الإيميل';
            } else {
              this.errorMessage = error.error?.message || 'حدث خطأ أثناء إرسال الرسالة. برجاء المحاولة مرة أخرى.';
            }
            
            setTimeout(() => {
              this.submitError = false;
              this.errorMessage = '';
            }, 7000);
          }
        });

    } else {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  get name() { return this.contactForm.get('name'); }
  get email() { return this.contactForm.get('email'); }
  get phone() { return this.contactForm.get('phone'); }
  get subject() { return this.contactForm.get('subject'); }
  get message() { return this.contactForm.get('message'); }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}