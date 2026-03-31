import { computed, inject, Injectable } from '@angular/core';
import { TaskModels } from '../models/task.models';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

type Status = 'TODO'|'IN_PROGRESS'|'DONE';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
    private auth = inject(AuthService);
    router = inject(Router);
    private http = inject(HttpClient);
    private tasks = signal<any[]>([]);

    private apiUrl = 'http://localhost:5000/api/tasks';

    // ===== ROLE FILTERED TASKS =====
    employeeTasks = computed(()=>{

      const user = this.auth.user();
      if(!user) return [];

      if(user.role === 'ADMIN'){
        return this.tasks();
      }

      return this.tasks().filter(t => t.assignedUsers?.includes(user.username));
    });

    // ===== KANBAN DERIVED =====
    todoTasks = computed(()=> this.employeeTasks().filter(t=>t.status==='TODO'));
    progressTasks = computed(()=> this.employeeTasks().filter(t=>t.status==='IN_PROGRESS'));
    doneTasks = computed(()=> this.employeeTasks().filter(t=>t.status==='DONE'));

    // ===== ADMIN VIEW =====
    allTasks = computed(()=> this.tasks());
    deletedTasks = signal<any[]>([]);

    adminStats = computed(()=>{
      const list = this.tasks();
      return {
        todo: list.filter(t=>t.status==='TODO').length,
        progress: list.filter(t=>t.status==='IN_PROGRESS').length,
        done: list.filter(t=>t.status==='DONE').length
      }
    });

    private getAuthHeaders() {
      const token = localStorage.getItem('accessToken');
      return { 
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
    }
    // ===== ACTIONS =====

    fetchTasks() {
      this.http.get<any[]>(this.apiUrl, this.getAuthHeaders()).subscribe({
        next: (res) => {
          // Map the backend structure to what the UI expects
          const mappedTasks = res.map(t => ({
            ...t,
            assignedUsers: t.task_assignments?.map((ta: any) => ta.user.username) ||[],
            assignedUserIds: t.task_assignments?.map((ta: any) => ta.user.id) ||[]
          }));
          this.tasks.set(mappedTasks);
        }
      });
    }
    
    fetchDeletedTasks() {
      this.http.get<any[]>(`${this.apiUrl}/deleted`, this.getAuthHeaders()).subscribe({
        next: (res) => {
          const mappedTasks = res.map(t => ({
            ...t,
            assignedUsers: t.task_assignments?.map((ta: any) => ta.user.username) ||[],
            assignedUserIds: t.task_assignments?.map((ta: any) => ta.user.id) ||[]
          }));
          this.deletedTasks.set(mappedTasks);
        }
      });
    }

    createTask(title: string, assignedUserIds: number[], description: string, startDate?: Date | null, dueDate?: Date | null, difficulty?:string) {
      const payload = { title, description, assignedUserIds, startDate, dueDate, difficulty };
      return this.http.post(`${this.apiUrl}/add`, payload, this.getAuthHeaders());
    }


    reassignTask(id: number, userIds: number[]) {
      return this.http.put(`${this.apiUrl}/${id}/assign`, { userIds }, this.getAuthHeaders());
    }

    deleteTask(id: number) {
      return this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }

    changeStatus(id: number, status: Status) {
      return this.http.put(`${this.apiUrl}/${id}`, { status }, this.getAuthHeaders());
    }

    updateTaskDetails(id: number, eta: Date | null, difficulty: string, description?: string) {
      const payload = { dueDate: eta, difficulty, description };
      return this.http.put(`${this.apiUrl}/${id}/details`, payload, this.getAuthHeaders());
    }

    // ===== COMMENTS =====

    getComments(taskId: number) {
      return this.http.get<any[]>(
        `http://localhost:5000/api/comments/${taskId}`,
        this.getAuthHeaders()
      );
    }

    addComment(taskId: number, comment: string) {
      return this.http.post(
        `http://localhost:5000/api/comments`,
        { taskId, comment },
        this.getAuthHeaders()
      );
    }

    editComment(id: number, comment: string, createdAt: string) {
      return this.http.put(
        `http://localhost:5000/api/comments/${id}`,
        { comment },
        this.getAuthHeaders()
      );
    }
  }   
