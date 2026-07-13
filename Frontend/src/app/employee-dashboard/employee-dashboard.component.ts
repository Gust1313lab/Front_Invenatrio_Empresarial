import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { InventoryItem, InventoryService } from '../core/inventory.service';
import { CreateProductPayload, Product, ProductService } from '../core/product.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.css',
})
export class EmployeeDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly inventoryService = inject(InventoryService);
  private readonly router = inject(Router);

  readonly loadingProducts = signal(false);
  readonly loadingInventory = signal(false);
  readonly actionMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly products = signal<Product[]>([]);
  readonly inventory = signal<InventoryItem[]>([]);

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

  ngOnInit(): void {
    this.loadProducts();
    this.loadInventory();
  }

  get roleLabel(): string {
    return this.authService.isEmployee() ? 'Empleado' : 'Acceso general';
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

  submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.actionError.set(null);
    this.actionMessage.set(null);

    const payload = this.productForm.getRawValue() as CreateProductPayload;

    this.productService.createProduct(payload).subscribe({
      next: () => {
        this.actionMessage.set('Producto agregado para revisión.');
        this.productForm.reset({ name: '', sku: '', price: 0, category: '', description: '' });
        this.loadProducts();
      },
      error: () => this.actionError.set('No se pudo crear el producto.'),
    });
  }

  submitInventory(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    this.actionError.set(null);
    this.actionMessage.set(null);

    this.inventoryService.createInventory(this.inventoryForm.getRawValue()).subscribe({
      next: () => {
        this.actionMessage.set('Inventario agregado para revisión.');
        this.inventoryForm.reset({ product_id: '', quantity: 0, warehouse_location: '', min_stock: 0 });
        this.loadInventory();
      },
      error: () => this.actionError.set('No se pudo crear el inventario.'),
    });
  }

  signOut(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  @HostListener('document:keydown.escape')
  closeShortcuts(): void {
    this.actionMessage.set(null);
    this.actionError.set(null);
  }
}