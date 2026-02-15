import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  links = [
    { title: 'Manage Gifts', url: '/manager/manage-gifts', color: 'purple' },
    { title: 'Buy / Donate', url: '/buying', color: 'green' },
    { title: 'Raffle & Winners', url: '/manager/raffle', color: 'purple' },
    { title: 'Reports', url: '/manager/revenue', color: 'green' }
  ];
}
