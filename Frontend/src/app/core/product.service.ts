import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

export interface Product {
  id: string | number;
  name: string;
  sku: string;
  price: number;
  category: string;
  description?: string;
  [key: string]: unknown;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  price: number;
  category: string;
  description?: string;
}

export interface UpdateProductPayload {
  name?: string;
  sku?: string;
  price?: number;
  category?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DeleteProductResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = 'https://202302713.aplicacionesweb2026.com/api';

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiBaseUrl}/products`, this.withAuth());
  }

  getProductById(id: string | number): Observable<Product> {
    return this.http.get<Product>(`${this.apiBaseUrl}/products/${id}`, this.withAuth());
  }

  createProduct(payload: CreateProductPayload): Observable<Product> {
    return this.http.post<Product>(`${this.apiBaseUrl}/products`, payload, this.withAuth());
  }

  updateProduct(id: string | number, payload: UpdateProductPayload): Observable<Product> {
    return this.http.put<Product>(`${this.apiBaseUrl}/products/${id}`, payload, this.withAuth());
  }

  deleteProduct(id: string | number): Observable<DeleteProductResponse> {
    return this.http.delete<DeleteProductResponse>(`${this.apiBaseUrl}/products/${id}`, this.withAuth());
  }

  private withAuth(): { headers?: HttpHeaders } {
    const headers = this.authService.getAuthHeaders();

    return headers ? { headers } : {};
  }
}