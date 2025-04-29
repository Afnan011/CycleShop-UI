import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { CycleInventoryView } from '../../../models/cycle.model';

@Component({
  selector: 'app-cycle-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cycle-details.component.html',
  styleUrls: ['./cycle-details.component.scss']
})
export class CycleDetailsComponent implements OnInit {
  cycle: CycleInventoryView | null = null;
  showFullScreenImage = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService
  ) {}
  
  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
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
  
  openFullScreenImage() {
    this.showFullScreenImage = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeFullScreenImage() {
    this.showFullScreenImage = false;
    document.body.style.overflow = 'auto';
  }

  editCycle(cycle: CycleInventoryView) {
    
  }
}
