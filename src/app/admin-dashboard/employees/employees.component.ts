import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { UserService } from '../../services/user.service';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from '../../services/user.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ToastrService } from 'ngx-toastr';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalComponent,
    ConfirmModalComponent,
    ImageUploadComponent,
  ],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
})
export class EmployeesComponent implements OnInit {
  // View state
  employeeForm: FormGroup;
  showModal = false;
  showDeleteModal = false;
  editMode = false;
  selectedEmployee: User | null = null;
  modalTitle = 'Add Employee';

  // Pagination and sorting
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  sortField: string = 'username';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtering
  searchQuery: string = '';
  selectedRole: string = 'All Roles';
  selectedStatus: any = 'All Statuses';

  // Data
  employees: User[] = [];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.employeeForm = this.createEmployeeForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  private createEmployeeForm(employee?: User): FormGroup {
    return this.fb.group({
      username: [
        employee?.username ?? '',
        [Validators.required, Validators.minLength(3)],
      ],
      email: [employee?.email ?? '', [Validators.required, Validators.email]],
      password: [
        !employee ? '' : null,
        !employee ? [Validators.required, Validators.minLength(6)] : [],
      ],
      role: [employee?.role ?? 'employee', Validators.required],
      isActive: [employee?.isActive ?? true],
      imageUrl: [employee?.imageUrl ?? '']
    });
  }

  loadEmployees(): void {
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        this.employees = users;
        this.updatePagination();
      },
      error: (error: any) => {
        this.toastr.error(error.error, 'Failed to load employees');
        console.error('Error loading employees:', error);
      },
    });
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  filteredEmployees() {
    if (!this.employees) return [];

    let filtered = this.employees.filter(employee => {
      const searchLower = (this.searchQuery || '').toLowerCase();
      const usernameMatch = employee.username.toLowerCase().includes(searchLower);
      const emailMatch = employee.email.toLowerCase().includes(searchLower);

      const matchesSearch = !this.searchQuery || usernameMatch || emailMatch;
      const matchesRole = this.selectedRole === 'All Roles' || employee.role === this.selectedRole;
      const matchesStatus = this.selectedStatus === 'All Statuses' || employee.isActive === this.selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Apply sorting
    if (this.sortField) {
      filtered = filtered.sort((a, b) => {
        let aValue = a[this.sortField as keyof User];
        let bValue = b[this.sortField as keyof User];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }        // Convert dates to timestamp if sorting by lastLogin
        if (this.sortField === 'lastLogin') {
          // Safe type handling for date values
          const aDate = aValue instanceof Date ? aValue.getTime() :
            typeof aValue === 'string' ? new Date(aValue).getTime() : 0;
          const bDate = bValue instanceof Date ? bValue.getTime() :
            typeof bValue === 'string' ? new Date(bValue).getTime() : 0;
          return this.sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // Handle booleans for isActive field
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return this.sortDirection === 'asc'
            ? (aValue === bValue ? 0 : aValue ? -1 : 1)
            : (aValue === bValue ? 0 : aValue ? 1 : -1);
        }

        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();

        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    // Update pagination based on filtered results
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.employees.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  showAddModal(): void {
    this.editMode = false;
    this.modalTitle = 'Add Employee';
    this.employeeForm = this.createEmployeeForm();
    this.showModal = true;
  }

  editEmployee(employee: User): void {
    this.editMode = true;
    this.selectedEmployee = employee;
    this.modalTitle = 'Edit Employee';
    this.employeeForm = this.createEmployeeForm(employee);
    this.showModal = true;
  }

  deleteEmployee(employee: User): void {
    this.selectedEmployee = employee;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.selectedEmployee) {
      this.userService.deleteUser(this.selectedEmployee.userId).subscribe({
        next: () => {
          this.toastr.success('Employee deleted successfully');
          this.loadEmployees();
          this.showDeleteModal = false;
          this.selectedEmployee = null;
        },
        error: (error: any) => {
          this.toastr.error(error.error, 'Failed to delete employee');
          console.error('Error deleting employee:', error);
        },
      });
    }
  }

  submitForm(): void {
    if (this.employeeForm.invalid) return;

    if (this.editMode && this.selectedEmployee) {
      const updateData: UpdateUserRequest = {
        username: this.employeeForm.value.username,
        email: this.employeeForm.value.email,
        role: this.employeeForm.value.role,
        isActive: this.employeeForm.value.isActive,
        imageUrl: this.employeeForm.value.imageUrl
      };

      this.userService
        .updateUser(this.selectedEmployee.userId, updateData)
        .subscribe({
          next: () => {
            this.toastr.success('Employee updated successfully');
            this.loadEmployees();
            this.closeModal();
          },
          error: (error: any) => {
            this.toastr.error(error.error, 'Failed to update employee');
            console.error('Error updating employee:', error);
          },
        });
    } else {
      const createData: CreateUserRequest = {
        username: this.employeeForm.value.username,
        email: this.employeeForm.value.email,
        password: this.employeeForm.value.password,
        role: this.employeeForm.value.role,
        imageUrl: this.employeeForm.value.imageUrl
      };

      this.userService.createUser(createData).subscribe({
        next: () => {
          this.toastr.success('Employee created successfully');
          this.loadEmployees();
          this.closeModal();
        },
        error: (error: any) => {
          this.toastr.error(error.error, 'Failed to create employee');
          console.error('Error creating employee:', error);
        },
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedEmployee = null;
    this.employeeForm = this.createEmployeeForm();
  }

  handleImageError(event: Event): void {
    if (event.target instanceof HTMLImageElement) {
      event.target.src = 'assets/images/default_avatar.jpg';
    }
  }

  onImageUploadSuccess(url: string) {
    this.employeeForm.patchValue({ imageUrl: url });
  }

  onImageRemove() {
    this.employeeForm.patchValue({ imageUrl: '' });
  }
}
