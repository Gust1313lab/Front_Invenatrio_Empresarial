import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import {
  CreateInventoryPayload,
  InventoryItem,
  InventoryService,
  UpdateInventoryPayload,
} from '../core/inventory.service';
import {
  CreateProductPayload,
  Product,
  ProductService,
  UpdateProductPayload,
} from '../core/product.service';

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
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly inventoryService = inject(InventoryService);

  readonly sidebarCollapsed = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly searchTerm = signal('');
  readonly loadingProducts = signal(false);
  readonly loadingInventory = signal(false);
  readonly actionMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly selectedProductId = signal<string | number | null>(null);
  readonly selectedInventoryId = signal<string | number | null>(null);
  readonly products = signal<Product[]>([]);
  readonly inventory = signal<InventoryItem[]>([]);
  readonly activePanel = signal<'products' | 'inventory' | 'users'>('products');

  readonly productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    sku: ['', [Validators.required, Validators.minLength(2)]],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  readonly inventoryForm = this.fb.nonNullable.group({
    product_id: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    warehouse_location: ['', [Validators.required, Validators.minLength(2)]],
    min_stock: [0, [Validators.min(0)]],
  });

  readonly registerUserForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['employee', [Validators.required]],
  });

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

  ngOnInit(): void {
    this.loadProducts();
    this.loadInventory();
  }

  get displayName(): string {
    return this.authService.getRole() ? 'Usuario autenticado' : 'Invitado';
  }

  get displayEmail(): string {
    return this.authService.getRole() ? 'Acceso por JWT' : 'Dashboard público';
  }

  get displayRole(): string {
    const role = this.authService.getRole();

    if (!role) {
      return 'guest';
    }

    return role;
  }

  get permissionsLabel(): string {
    if (this.authService.canManageUsers()) {
      return 'Admin: usuarios, productos e inventario';
    }

    if (this.authService.canManageProducts()) {
      return 'Empleado: productos e inventario';
    }

    return 'Sin sesión: acceso solo lectura';
  }

  canManageUsers(): boolean {
    return this.authService.canManageUsers();
  }

  canManageProducts(): boolean {
    return this.authService.canManageProducts();
  }

  canManageInventory(): boolean {
    return this.authService.canManageInventory();
  }

  canEditProducts(): boolean {
    return this.authService.canEditProducts();
  }

  canEditInventory(): boolean {
    return this.authService.canEditInventory();
  }

  canDeleteProducts(): boolean {
    return this.authService.canDeleteProducts();
  }

  selectPanel(panel: 'products' | 'inventory' | 'users'): void {
    this.activePanel.set(panel);
  }

  loadProducts(): void {
    this.loadingProducts.set(true);

    this.productService
      .getProducts()
      .pipe(finalize(() => this.loadingProducts.set(false)))
      .subscribe({
        next: (items) => this.products.set(items ?? []),
        error: () => this.actionError.set('No se pudieron cargar los productos.'),
      });
  }

  loadInventory(): void {
    this.loadingInventory.set(true);

    this.inventoryService
      .getInventory()
      .pipe(finalize(() => this.loadingInventory.set(false)))
      .subscribe({
        next: (items) => this.inventory.set(items ?? []),
        error: () => this.actionError.set('No se pudo cargar el inventario.'),
      });
  }

  startEditProduct(product: Product): void {
    this.selectedProductId.set(product.id);
    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      price: product.price,
      category: product.category,
      description: (product.description as string | undefined) ?? '',
    });
    this.selectPanel('products');
  }

  startEditInventory(item: InventoryItem): void {
    this.selectedInventoryId.set(item.id);
    this.inventoryForm.patchValue({
      product_id: String(item.product_id),
      quantity: item.quantity,
      warehouse_location: item.warehouse_location,
      min_stock: item.min_stock ?? 0,
    });
    this.selectPanel('inventory');
  }

  submitProduct(): void {
    if (!this.canManageProducts()) {
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const payload = this.productForm.getRawValue() as CreateProductPayload;
    const selectedProductId = this.selectedProductId();
    if (selectedProductId && !this.canEditProducts()) {
      return;
    }
    const request = selectedProductId
      ? this.productService.updateProduct(selectedProductId, payload as UpdateProductPayload)
      : this.productService.createProduct(payload);

    this.actionError.set(null);
    this.actionMessage.set(null);

    request.subscribe({
      next: () => {
        this.actionMessage.set(selectedProductId ? 'Producto actualizado.' : 'Producto creado.');
        this.productForm.reset({ name: '', sku: '', price: 0, category: '', description: '' });
        this.selectedProductId.set(null);
        this.loadProducts();
      },
      error: () => this.actionError.set('No se pudo guardar el producto.'),
    });
  }

  submitInventory(): void {
    if (!this.canManageInventory()) {
      return;
    }

    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    const rawValue = this.inventoryForm.getRawValue();
    const payload: CreateInventoryPayload = {
      product_id: rawValue.product_id,
      quantity: rawValue.quantity,
      warehouse_location: rawValue.warehouse_location,
      min_stock: rawValue.min_stock ?? undefined,
    };
    const selectedInventoryId = this.selectedInventoryId();
    if (selectedInventoryId && !this.canEditInventory()) {
      return;
    }
    const request = selectedInventoryId
      ? this.inventoryService.updateInventory(selectedInventoryId, {
          quantity: payload.quantity,
          warehouse_location: payload.warehouse_location,
          min_stock: payload.min_stock,
        })
      : this.inventoryService.createInventory(payload);

    this.actionError.set(null);
    this.actionMessage.set(null);

    request.subscribe({
      next: () => {
        this.actionMessage.set(selectedInventoryId ? 'Inventario actualizado.' : 'Inventario creado.');
        this.inventoryForm.reset({ product_id: '', quantity: 0, warehouse_location: '', min_stock: 0 });
        this.selectedInventoryId.set(null);
        this.loadInventory();
      },
      error: () => this.actionError.set('No se pudo guardar el inventario.'),
    });
  }

  submitRegisterUser(): void {
    if (!this.canManageUsers()) {
      return;
    }

    if (this.registerUserForm.invalid) {
      this.registerUserForm.markAllAsTouched();
      return;
    }

    this.actionError.set(null);
    this.actionMessage.set(null);

    this.authService.register(this.registerUserForm.getRawValue()).subscribe({
      next: () => {
        this.actionMessage.set('Usuario registrado.');
        this.registerUserForm.reset({ username: '', email: '', password: '', role: 'employee' });
      },
      error: () => this.actionError.set('No se pudo registrar el usuario.'),
    });
  }

  deleteProduct(product: Product): void {
    if (!this.canDeleteProducts()) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.actionMessage.set('Producto desactivado.');
        this.loadProducts();
      },
      error: () => this.actionError.set('No se pudo desactivar el producto.'),
    });
  }

  clearProductForm(): void {
    this.selectedProductId.set(null);
    this.productForm.reset({ name: '', sku: '', price: 0, category: '', description: '' });
  }

  clearInventoryForm(): void {
    this.selectedInventoryId.set(null);
    this.inventoryForm.reset({ product_id: '', quantity: 0, warehouse_location: '', min_stock: 0 });
  }

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