import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  private readonly STORAGE_KEY = 'lang';

  constructor() {
  const savedLang = localStorage.getItem(this.STORAGE_KEY);

  const lang: 'ar' | 'en' =
    savedLang === 'en' || savedLang === 'ar' ? savedLang : 'ar';

  this.setLanguage(lang);
}

  setLanguage(lang: 'ar' | 'en') {
    this.translate.use(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const html = document.documentElement;

    html.lang = lang;
    html.dir = dir;
    
    // Log for debugging
    console.log(`🌐 Language changed to: ${lang}`);
  }

  toggleLanguage() {
    const current = this.translate.currentLang || 'ar';
    const newLang = current === 'ar' ? 'en' : 'ar';
    console.log(`🔄 Toggling language from ${current} to ${newLang}`);
    this.setLanguage(newLang);
  }

  get currentLang() {
    return this.translate.currentLang || 'ar';
  }
}
