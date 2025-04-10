import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { CycleInventoryView } from '../../../models/cycle.model';

@Component({
  selector: 'app-cycle-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cycle-details-container" *ngIf="cycle">
      <div class="cycle-header">
        <button class="back-button" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Back to Inventory
        </button>
      </div>

      <div class="cycle-content">
        <div class="cycle-image">
          <img [src]="cycle.imageUrl || 'assets/images/default-cycle.png'" [alt]="cycle.model">
        </div>

        <div class="cycle-info">
          <h1 class="cycle-title">{{cycle.model}}</h1>
          <div class="cycle-meta">
            <span class="brand">{{cycle.brand}}</span>
            <span class="type">{{cycle.type}}</span>
          </div>

          <div class="cycle-price">
            <h2>₹{{cycle.price.toFixed(2)}}</h2>
            <span class="cost-price">Cost: ₹{{cycle.costPrice.toFixed(2)}}</span>
          </div>

          <div class="stock-info">
            <div class="stock-status" [class.low-stock]="cycle.stockQuantity <= cycle.reorderThreshold">
              <span class="label">Stock Level:</span>
              <span class="value">{{cycle.stockQuantity}}</span>
            </div>
            <div class="reorder-info">
              <span class="label">Reorder Threshold:</span>
              <span class="value">{{cycle.reorderThreshold}}</span>
            </div>
            <div class="location">
              <span class="label">Warehouse Location:</span>
              <span class="value">{{cycle.warehouseLocation}}</span>
            </div>
          </div>

          <div class="cycle-description">
            <h3>Description</h3>
            <p>{{cycle.description}}</p>
          </div>

          <div class="additional-info">
            <p><strong>SKU:</strong> {{cycle.sku}}</p>
            <p><strong>Last Stock Update:</strong> {{cycle.lastStockUpdate | date:'medium'}}</p>
            <p><strong>Status:</strong> <span [class.inactive]="!cycle.isActive">{{cycle.isActive ? 'Active' : 'Inactive'}}</span></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cycle-details-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .cycle-header {
      margin-bottom: 2rem;
    }

    .back-button {
      padding: 0.5rem 1rem;
      background: none;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .back-button:hover {
      background: #f5f5f5;
    }

    .cycle-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .cycle-image {
      img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    }

    .cycle-info {
      .cycle-title {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .cycle-meta {
        margin-bottom: 1rem;
        span {
          margin-right: 1rem;
          padding: 0.25rem 0.5rem;
          background: #f0f0f0;
          border-radius: 4px;
        }
      }

      .cycle-price {
        margin-bottom: 2rem;
        h2 {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }
        .cost-price {
          color: #666;
          font-size: 0.9rem;
        }
      }

      .stock-info {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;

        div {
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .low-stock .value {
          color: #dc3545;
        }

        .label {
          color: #666;
        }
      }

      .cycle-description {
        margin-bottom: 2rem;
        h3 {
          margin-bottom: 1rem;
        }
        p {
          line-height: 1.6;
        }
      }

      .additional-info {
        color: #666;
        p {
          margin-bottom: 0.5rem;
        }
        .inactive {
          color: #dc3545;
        }
      }
    }
  `]
})
export class CycleDetailsComponent implements OnInit {
  cycle: CycleInventoryView | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        // Get the cycle from the service - since we already have the data in the service,
        // we can just filter the existing data instead of making a new API call
        this.inventoryService.getCyclesWithInventory().subscribe({
          next: (cycles) => {
            const found = cycles.find(c => c.id === params['id']);
            if (found) {
              this.cycle = found;
            } else {
              this.router.navigate(['/admin/dashboard/inventory']);
            }
          },
          error: (error) => {
            console.error('Error loading cycle details:', error);
            this.router.navigate(['/admin/dashboard/inventory']);
          }
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/dashboard/inventory']);
  }
}
