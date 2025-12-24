import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about-us',
  imports: [CommonModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs implements OnInit {

  team = [
    {
      name: 'Bassem Mohamed',
      role: 'Full Stack .NET Developer',
      image: 'assets/img/bassem.jpg',
      description: 'Full Stack Developer with ASP.NET Core, Angular, and APIs.',
      linkedin: 'https://linkedin.com/in/bassem-mohamed-a6597935a',
      github: 'https://github.com/bassem-mohamad',
      cv: 'https://drive.google.com/file/d/YOUR_FILE_ID_HERE/view?usp=sharing'
    },
    {
      name: 'Mahmoud Ashraf',
      role: 'Full Stack .NET Developer',
      image: 'assets/img/mahmoud.jpg',
      description: 'Full Stack Developer with ASP.NET Core, Angular, and APIs.',
      linkedin: 'https://linkedin.com/in/mahmoud-achraf',
      github: 'https://github.com/mahmoud-achraf',
      cv: 'https://drive.google.com/file/d/YOUR_FILE_ID_HERE/view?usp=sharing'
    },
    {
      name: 'Abrar Badr',
      role: 'Full Stack .NET Developer',
      image: 'assets/img/abrar.jpg',
      description: 'Full Stack Developer with ASP.NET Core, Angular, and APIs.',
      linkedin: 'https://linkedin.com/in/abrar-badr',
      github: 'https://github.com/abrar-badr',
      cv: 'https://drive.google.com/file/d/YOUR_FILE_ID_HERE/view?usp=sharing'
    },
    {
      name: 'Salma Essam',
      role: 'Full Stack .NET Developer',
      image: 'assets/img/salma.jpg',
      description: 'Full Stack Developer with ASP.NET Core, Angular, and APIs.',
      linkedin: 'https://linkedin.com/in/salma-essam',
      github: 'https://github.com/salma-essam',
      cv: 'https://drive.google.com/file/d/YOUR_FILE_ID_HERE/view?usp=sharing'
    },
    {
      name: 'Amr Essam',
      role: 'Full Stack .NET Developer',
      image: 'assets/img/amr.jpg',
      description: 'Full Stack Developer with ASP.NET Core, Angular, and APIs.',
      linkedin: 'https://linkedin.com/in/amr-essam',
      github: 'https://github.com/amr-essam',
      cv: 'https://drive.google.com/file/d/YOUR_FILE_ID_HERE/view?usp=sharing'
    },
    {
      name: 'Alaa Saber',
      role: 'Full Stack .NET Developer',
      image: 'assets/img/alaa.jpg',
      description: 'Full Stack Developer with ASP.NET Core, Angular, and APIs.',
      linkedin: 'https://linkedin.com/in/alaa-saber',
      github: 'https://github.com/alaa-saber',
      cv: 'https://drive.google.com/file/d/YOUR_FILE_ID_HERE/view?usp=sharing'
    }
  ];

  ngOnInit(): void {
    // No AOS initialization needed
  }
}
