export interface TaskModels {
      id:number;
      title:string;
      assignedUsers:string[];
      description:string;
      status:'TODO' | 'IN_PROGRESS' | 'DONE';
      startDate?: Date | null;
      createdAt?: Date;
      eta?: Date | null; 
      difficulty?: 'Easy' | 'Medium' | 'Hard'; 
}