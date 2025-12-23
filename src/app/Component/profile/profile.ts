import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../Services/users';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
   styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {

  user: any;
  loading = true;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (res) => {
        this.user = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Profile error', err);
        this.loading = false;
      }
    });
  }
}
