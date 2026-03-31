import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORT } from './../material/material.imports'; // Adjust path if needed
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ...MATERIAL_IMPORT],
  template: `
    <h2 mat-dialog-title>Task Details</h2>
    <mat-dialog-content style="padding-top: 16px; display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Task Info & Created Date -->
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0; font-size: 18px; color: #111827;">{{data.title}}</h3>
        <p style="color: #4b5563; margin: 8px 0;">{{data.description}}</p>
        <div style="font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 6px;">
          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">calendar_today</mat-icon>
          <strong>Created Date:</strong> {{ (data.createdAt || data.startDate) | date:'MMM d, y' }}
        </div>
      </div>

      <!-- Editable Status -->
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="localStatus">
          <mat-option value="TODO">TODO</mat-option>
          <mat-option value="IN_PROGRESS">IN PROGRESS</mat-option>
          <mat-option value="DONE">DONE</mat-option>
        </mat-select>
      </mat-form-field>
      
      <!-- Editable Difficulty -->
      <mat-form-field *ngIf="isAdmin" appearance="outline">
        <mat-label>Difficulty</mat-label>
        <mat-select [(ngModel)]="localDifficulty">
          <mat-option value="Easy">Easy</mat-option>
          <mat-option value="Medium">Medium</mat-option>
          <mat-option value="Hard">Hard</mat-option>
        </mat-select>
      </mat-form-field>

      <div>
        <strong>Due Date:</strong>
        {{ data.dueDate ? (data.dueDate | date:'mediumDate') : 'Not Set' }}
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Add Comment</mat-label>
        <textarea matInput [(ngModel)]="newComment"></textarea>
      </mat-form-field>

      <button mat-raised-button (click)="addComment()" [disabled]="isSubmitting">Submit</button>
      <h3>Comments</h3>

      <div *ngFor="let c of comments">
        <strong>{{c.user.username}}</strong>
        <p>{{c.comment}}</p>

        <button *ngIf="canEdit(c)" (click)="edit(c)">Edit</button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `
})
export class TaskDialog {
  dialogRef = inject(MatDialogRef<TaskDialog>);
  taskService = inject(TaskService);
  auth = inject(AuthService);
  data: any = inject(MAT_DIALOG_DATA);
  isAdmin = this.auth.hasRole('ADMIN');

  localStatus = this.data.status;
  localDifficulty = this.data.difficulty;
  localDueDate = this.data.dueDate;

  close() {
    this.dialogRef.close();
  }

  save() {
    // Save status if changed
    if (this.localStatus !== this.data.status) {
      this.data.changeStatus(this.data.id, this.localStatus);
    }
    if (
      this.localDueDate !== this.data.dueDate ||
      this.localDifficulty !== this.data.difficulty
    ) {
      this.taskService.updateTaskDetails(
        this.data.id,
        this.localDueDate,
        this.localDifficulty
      );
    }
    
    this.dialogRef.close(true);
  }

  comments: any[] = [];
  newComment = '';

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.taskService.getComments(this.data.id).subscribe(res => {
      this.comments = res;
    });
  }
  isSubmitting = false;
  addComment() {
    const comment = this.newComment?.trim();

    if (!comment || this.isSubmitting) return;
    this.isSubmitting = true;
    this.taskService.addComment(this.data.id, comment).subscribe({
      next: () => {
        this.newComment = '';
        this.loadComments();
        this.isSubmitting = false;
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  canEdit(c: any) {
    const currentUser = this.auth.user();

    if (!currentUser) return false;

    const isOwner = c.user?.username === currentUser.username;

    const diff = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);

    return isOwner && diff <= 4;
  }

  edit(commentObj: any) {
  const updated = prompt('Edit comment', commentObj.comment);

  if (!updated) return;

  this.taskService
    .editComment(commentObj.id, updated, commentObj.created_at)
    .subscribe(() => {
      this.loadComments();
    });
}
}