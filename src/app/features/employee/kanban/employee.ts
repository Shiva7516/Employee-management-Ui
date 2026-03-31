import { Component, computed, inject, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MATERIAL_IMPORT } from '../../../shared/material/material.imports';
import { HeaderComponent } from '../../../shared/components/header';
import { CdkObserveContent } from "@angular/cdk/observers";
import { MatDialog } from '@angular/material/dialog';
import { TaskDialog } from '../../../shared/components/taskdialog';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';

@Component({
  standalone: true,
  selector: 'app-employee',
  imports: [FormsModule, DragDropModule, CommonModule,
    ...MATERIAL_IMPORT, HeaderComponent
  ],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class Employee {
  taskService = inject(TaskService);
  auth = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);

  currentUser = this.auth.user;
  @ViewChild('logoutDialog') logoutDialogTemplate!: TemplateRef<any>;

  todo = this.taskService.todoTasks;
  progress = this.taskService.progressTasks;
  done = this.taskService.doneTasks;
  isAdmin = this.taskService['auth']?.hasRole('ADMIN');

  ngOnInit() {
    this.taskService.fetchTasks();
  }

  changeStatus(id: number, status: Status) {
    this.taskService.changeStatus(id, status).subscribe(() => {
      this.taskService.fetchTasks();
    });
  }

  logout(){
    const dialogRef = this.dialog.open(this.logoutDialogTemplate, { 
      width: '350px' 
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.auth.logout();
        this.router.navigate(['/']);
      }
    });
  }

  getStatus(id:string):Status{
    return id as Status;
  }


  drop(event: CdkDragDrop<any[]>) {

    if (event.previousContainer === event.container) return;

    const task = event.previousContainer.data[event.previousIndex];

    const newStatus = event.container.id as Status;

    this.changeStatus(task.id, newStatus);
  }

  openTask(task:any){

    this.dialog.open(TaskDialog,{
      width:'400px',
      data:{
        ...task,
        changeStatus: this.changeStatus.bind(this)
      }
    });

  }

}
