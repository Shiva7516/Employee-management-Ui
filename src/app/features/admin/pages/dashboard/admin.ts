import { Component, computed, inject, signal, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { TaskService } from '../../../../core/services/task.service';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_IMPORT } from '../../../../shared/material/material.imports'
import { HeaderComponent } from '../../../../shared/components/header';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CommonModule, ...MATERIAL_IMPORT, HeaderComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  taskService = inject(TaskService);
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);

  @ViewChild('logoutDialog') logoutDialogTemplate!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialogTemplate!: TemplateRef<any>;
  @ViewChild('taskDetailsDialog') taskDetailsDialogTemplate!: TemplateRef<any>;

  title = '';
  assignedTo: number[] = [];
  employees = '';
  description = '';
  employeesList = signal<{id: number, username: string}[]>([]);
  empUsername = '';
  empPassword = '';
  startDate: Date | null = null;
  dueDate: Date | null = null;
  today = new Date();
  stats = this.taskService.adminStats;
  tasks = this.taskService.allTasks;
  selectedDate = signal<Date>(new Date());
  currentView: string = 'dashboard';
  difficulty: string = '';
  filterEmployee = signal<number | null>(null);
  filterStatus = signal<string>('');
  filterStartDate = signal<Date | null>(null);
  filterDueDate = signal<Date | null>(null);
  selectedTask: any = null;
  taskToDeleteId: number | null = null;
  deletedTasks = this.taskService.deletedTasks;
  showFilters = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editTaskData: any = {};
  comments = signal<any[]>([]);
  newComment = signal<string>('');
  editingCommentId = signal<number | null>(null);
  editCommentText = signal<string>('');

  filteredManageTasks = computed(() => {
    let list = this.tasks();
    const emp = this.filterEmployee();
    const stat = this.filterStatus();
    const sDate = this.filterStartDate();
    const dDate = this.filterDueDate();
    const normalize = (d: Date) => new Date(d).toISOString().split('T')[0];

    if (emp !== null) {
      list = list.filter(t => t.assignedUserIds.includes(emp));
    }
    if (stat) {
      list = list.filter(t => t.status === stat);
    }
    if (sDate) {
      list = list.filter(t => t.startDate && new Date(t.startDate).setHours(0,0,0,0) === new Date(sDate).setHours(0,0,0,0));
    }
    if (dDate) {
      list = list.filter(t => t.dueDate && normalize(t.dueDate) === normalize(dDate));
    }
    return list;
  });

  employeeManagementData = computed(() => {
    const employees = this.employeesList();
    const all = this.tasks();
    return employees.map(emp => {
      const empTasks = all.filter(t => t.assignedUserIds.includes(emp.id));
      return {
        ...emp,
        taskCount: empTasks.length,
        tasks: empTasks
      };
    });
  });

  ngOnInit() {
    this.taskService.fetchTasks();
    this.fetchEmployees();
    this.taskService.fetchDeletedTasks();
  }

  fetchEmployees() {
    const token = localStorage.getItem('accessToken');
    this.http.get<any[]>('http://localhost:5000/api/auth/employees', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        // Safety Check: Ensure data is actually an array before binding
        if (Array.isArray(data)) {
          this.employeesList.set(data);
        } else {
          this.employeesList.set([]); // Prevent NG02200
        }
      },
      error: (err) => {
        console.error('Error fetching employees', err);
        this.employeesList.set([]); // Prevent NG02200 on server crash
      }
    });
  }

  setView(view: string) {
    this.currentView = view;
    
    if(view === 'calendarView') {
      this.selectedDate.set(new Date());
    }
  }

  createEmployee(form: NgForm){
    this.auth.register(this.empUsername, this.empPassword).subscribe({
      next: (res) => {
        this.snackBar.open('Employee successfully created!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        form.resetForm();
        this.empUsername = '';
        this.empPassword = '';
        this.fetchEmployees();
      },
      error: () => {
        this.snackBar.open('Failed to create employee', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }
  
  create() {
    if (!this.title.trim() || !this.description.trim() || !this.assignedTo) return;

    this.taskService.createTask(
      this.title.trim(),
      this.assignedTo,
      this.description.trim(),
      this.startDate ?? undefined,
      this.dueDate ?? undefined,
      this.difficulty
    ).subscribe({
      next: () => {
        this.taskService.fetchTasks();
        this.title = '';
        this.assignedTo =[];
        this.description = '';
        this.startDate = null;
        this.dueDate = null;
        this.difficulty = '';
        this.snackBar.open('Task created successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to create task', err);
        this.snackBar.open('Failed to create task', 'Close', { duration: 3000 });
      }
    });
  }

  changeStatus(id: number, status: Status) {
    this.taskService.changeStatus(id, status).subscribe(() =>
       this.taskService.fetchTasks());
  }

  reassign(id: number, newUserIds: number[]) {
    this.taskService.reassignTask(id, newUserIds).subscribe(() => this.taskService.fetchTasks());
  }

  remove(id: number) {
    this.taskService.deleteTask(id).subscribe(() => {
      this.taskService.fetchTasks();
      this.taskService.fetchDeletedTasks();
    });
  }
  
  goToCreate() { this.router.navigate(['create'], { relativeTo: this.route});}
  goToManage() { this.router.navigate(['manage'], { relativeTo: this.route }); }

  logout(){
    const dialogRef = this.dialog.open(this.logoutDialogTemplate, { 
      width: '350px' 
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      // result will be 'true' if they clicked the Logout button
      if (result) {
        this.auth.logout();
        this.router.navigate(['/']);
      }
    });
  }
  
  tasksByDate = computed(() => {
    return this.tasks().filter((t: any) => {
      if (!t.startDate) return false;
      const taskDate = new Date(t.startDate);
      const selected = new Date(this.selectedDate());
      return (
        taskDate.getFullYear() === selected.getFullYear() &&
        taskDate.getMonth() === selected.getMonth() &&
        taskDate.getDate() === selected.getDate()
      );
    });
  });

  dateClass = (date: Date) => {
    const tasks = this.tasks().filter((t: any) => {
      if (!t.startDate) return false;

      const d = new Date(t.startDate);

      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });

    if (tasks.length === 0) return '';

    if (tasks.some((t: any) => t.status === 'IN_PROGRESS')) return 'progress-task';
    if (tasks.some((t: any) => t.status === 'TODO')) return 'todo-task';

    return 'done-task';
  };

  updateDueDate(id: number, newDate: Date, difficulty?: string) {
    this.taskService.updateTaskDetails(id, newDate, difficulty || '').subscribe(() => this.taskService.fetchTasks());
  }

  confirmRemove(id: number) {
    this.taskToDeleteId = id;
    const dialogRef = this.dialog.open(this.deleteConfirmDialogTemplate, { 
      width: '350px' 
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.taskToDeleteId !== null) {
        this.taskService.deleteTask(this.taskToDeleteId);
      }
      this.taskToDeleteId = null;
    });
  }

  viewTaskDetails(task: any) {
    this.selectedTask = task;
    this.isEditMode.set(false);

    this.editTaskData = { 
      ...task, 
      assignedUserIds: [...(task.assignedUserIds || [])] 
    };

    // ✅ LOAD COMMENTS
    this.taskService.getComments(task.id).subscribe(res => {
      this.comments.set(res);
    });

    this.dialog.open(this.taskDetailsDialogTemplate, { width: '600px' });
  }

  cancelEdit() {
    this.isEditMode.set(false);
    this.editTaskData = { ...this.selectedTask, assignedUserIds:[...(this.selectedTask.assignedUserIds || [])] };
  }

  async saveTaskEdit() {
    const id = this.selectedTask.id;
    const requests: Promise<any>[] =[];
    
    try {
      // 1. Status update logic
      if (this.editTaskData.status !== this.selectedTask.status) {
        requests.push(lastValueFrom(this.taskService.changeStatus(id, this.editTaskData.status)));
      }
      
      // 2. Assigned Users update logic
      const oldAssignees = JSON.stringify(this.selectedTask.assignedUserIds ||[]);
      const newAssignees = JSON.stringify(this.editTaskData.assignedUserIds ||[]);
      
      if (oldAssignees !== newAssignees) {
        requests.push(lastValueFrom(this.taskService.reassignTask(id, this.editTaskData.assignedUserIds)));
      }
      
      // 3. Due Date & Description update logic
      requests.push(lastValueFrom(
        this.taskService.updateTaskDetails(
          id, 
          this.editTaskData.dueDate, 
          this.editTaskData.difficulty, 
          this.editTaskData.description
        )
      ));
      
      // Wait for all the API calls to finish concurrently
      if (requests.length > 0) {
        await Promise.all(requests);
      }
      
      // Once successful, execute UI updates
      this.taskService.fetchTasks();
      this.dialog.closeAll();
      this.snackBar.open('Task details updated!', 'Close', { duration: 3000 });
      
    } catch (error) {
      console.error('Error while updating task:', error);
      this.snackBar.open('Failed to update task.', 'Close', { duration: 3000 });
    }
  }


  clearFilters() {
    this.filterEmployee.set(null);
    this.filterStatus.set('');
    this.filterStartDate.set(null);
    this.filterDueDate.set(null);
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  addComment() {
    const text = this.newComment().trim();
    if (!text) return;

    this.taskService.addComment(this.selectedTask.id, text).subscribe(() => {
      this.newComment.set('');
      this.taskService.getComments(this.selectedTask.id)
        .subscribe(res => this.comments.set(res));
    });
  }

  startEditComment(comment: any) {
    this.editingCommentId.set(comment.id);
    this.editCommentText.set(comment.comment);
  }

  saveEditComment(comment: any) {
    const updatedText = this.editCommentText().trim();
    if (!updatedText) {
      return;
    }
    const commentId = Number(String(comment.id).trim());
    this.taskService.editComment(
      commentId,
      updatedText,
      comment.created_at
    ).subscribe(() => {
      this.editingCommentId.set(null);
      this.editCommentText.set('');
      this.taskService.getComments(this.selectedTask.id)
        .subscribe(res => this.comments.set(res));
    });
  }
}
