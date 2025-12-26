import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Language } from '@ngx-translate/core';
import { LanguageService } from '../../Services/language';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="lang-btn" (click)="toggle()">
      {{ lang === 'ar' ? 'English' : 'العربية' }}
    </button>
  `,
  styles: [`
    .lang-btn {
      padding: 6px 14px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      background: #111;
      color: #fff;
      font-weight: 600;
    }
  `]
})
export class LanguageSwitcherComponent {
  constructor(private langService: LanguageService) {}

  get lang() {
    return this.langService.currentLang;
  }

  toggle() {
    this.langService.toggleLanguage();
  }
}
