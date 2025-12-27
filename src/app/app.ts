import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './Component/navbar/navbar';
import { Footer } from "./Component/footer/footer";
import { LanguageService } from './Services/language';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AngularTraffieEstate');
  private languageService = inject(LanguageService);

  constructor() {
    console.log('🌍 Language service initialized');
  }
}
