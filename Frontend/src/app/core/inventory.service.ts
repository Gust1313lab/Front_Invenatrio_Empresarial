import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

export interface InventoryItem {
  id: string | number;
  product_id: string | number;
  quantity: number;
  warehouse_location: string;
  min_stock?: number;
  [key: string]: unknown;
}

export interface CreateInventoryPayload {
  product_id: string | number;
  quantity: number;
  warehouse_location: string;
  min_stock?: number;
}

export interface UpdateInventoryPayload {
  quantity?: number;
  warehouse_location?: string;
  min_stock?: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = 'https://202302713.aplicacionesweb2026.com/api';

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiBaseUrl}/inventory`, this.withAuth());
  }

  getInventoryById(id: string | number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiBaseUrl}/inventory/${id}`, this.withAuth());
  }

  createInventory(payload: CreateInventoryPayload): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiBaseUrl}/inventory`, payload, this.withAuth());
  }

  updateInventory(id: string | number, payload: UpdateInventoryPayload): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiBaseUrl}/inventory/${id}`, payload, this.withAuth());
  }

  private withAuth(): { headers?: HttpHeaders } {
    const headers = this.authService.getAuthHeaders();

    return headers ? { headers } : {};
  }
}