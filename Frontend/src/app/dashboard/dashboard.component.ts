import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

interface MetricCard {
  label: string;
  value: string;
  change: string;
  tone: string;
}

interface ActivityItem {
  title: string;
  meta: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly sidebarCollapsed = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly searchTerm = signal('');

  readonly metrics: MetricCard[] = [
    { label: 'Revenue', value: '$124.8k', change: '+12.6%', tone: 'from-cyan-400/20 to-sky-400/10' },
    { label: 'Active users', value: '18.2k', change: '+8.4%', tone: 'from-emerald-400/20 to-teal-400/10' },
    { label: 'Conversion', value: '4.91%', change: '+1.8%', tone: 'from-violet-400/20 to-fuchsia-400/10' },
    { label: 'Support SLA', value: '99.2%', change: '+0.4%', tone: 'from-amber-400/20 to-orange-400/10' },
  ];

  readonly activities: ActivityItem[] = [
    { title: 'Enterprise account approved', meta: '12 minutes ago', status: 'Completed' },
    { title: 'Quarterly sync report generated', meta: '39 minutes ago', status: 'Ready' },
    { title: 'New API token rotated', meta: '2 hours ago', status: 'Secure' },
    { title: 'Payment reconciliation queue', meta: 'Today, 08:40', status: 'Processing' },
  ];

  readonly tableRows = [
    { customer: 'Atlas Labs', plan: 'Growth', amount: '$2,480', state: 'Paid' },
    { customer: 'Northstar Health', plan: 'Enterprise', amount: '$8,240', state: 'Pending' },
    { customer: 'Horizon Studio', plan: 'Starter', amount: '$920', state: 'Paid' },
    { customer: 'Zenith Retail', plan: 'Scale', amount: '$4,180', state: 'Delayed' },
  ];

  readonly navItems = [
    { label: 'Overview', icon: 'M4 6h16v12H4z M4 10h16' },
    { label: 'Analytics', icon: 'M5 18V9m5 9V5m5 13v-7m5 7V8' },
    { label: 'Customers', icon: 'M7 20v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2 M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M17 11h4' },
    { label: 'Billing', icon: 'M3 8h18M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z' },
    { label: 'Settings', icon: 'M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.5-3.5-.9-.52a7.7 7.7 0 0 0 0-1l.9-.52a1 1 0 0 0 .37-1.37l-1-1.73a1 1 0 0 0-1.28-.43l-1 .43a7.38 7.38 0 0 0-.87-.5l-.14-1.06A1 1 0 0 0 14.63 4h-2a1 1 0 0 0-.99.84L11.5 5.9a7.38 7.38 0 0 0-.87.5l-1-.43a1 1 0 0 0-1.28.43l-1 1.73A1 1 0 0 0 7.72 9.5l.9.52a7.7 7.7 0 0 0 0 1l-.9.52a1 1 0 0 0-.37 1.37l1 1.73a1 1 0 0 0 1.28.43l1-.43c.28.19.57.36.87.5l.14 1.06a1 1 0 0 0 .99.84h2a1 1 0 0 0 .99-.84l.14-1.06c.3-.14.59-.31.87-.5l1 .43a1 1 0 0 0 1.28-.43l1-1.73a1 1 0 0 0-.37-1.37z' },
  ];

  readonly chartBars = [42, 68, 54, 82, 76, 90, 64, 96, 58, 74, 88, 70];

  constructor(private readonly authService: AuthService) {}

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  signOut(): void {
    this.authService.logout();
    this.closeProfileMenu();
  }

  @HostListener('document:click')
  handleDocumentClick(): void {
    this.closeProfileMenu();
  }
}