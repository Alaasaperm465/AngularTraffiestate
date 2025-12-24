import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contact-us.html',
  styleUrls: ['./contact-us.css']
})
export class ContactUs implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;

      const v = this.contactForm.value;
      const mailto = this.createMailtoLink(v);

      // Open user's mail client (fallback) with prefilled email
      try {
        window.open(mailto, '_blank');
      } catch (e) {
        window.location.href = mailto;
      }

      // show success feedback and reset form
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();
        setTimeout(() => {
          this.submitSuccess = false;
        }, 3000);
      }, 500);
    } else {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  private createMailtoLink(v: any): string {
    const to = 'abrarbadr02@gmail.com';
    const subject = encodeURIComponent(v.subject || 'Contact Form Submission');
    const bodyLines = [
      `Name: ${v.name || ''}`,
      `Email: ${v.email || ''}`,
      `Phone: ${v.phone || ''}`,
      '',
      `${v.message || ''}`
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}