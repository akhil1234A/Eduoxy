import { UserDashboardResponse, AdminDashboardResponse, TeacherDashboardResponse } from "../types/types";

export interface IDashboardService {
  getAdminDashboard(
    page?: number, 
    limit?: number, 
    dateFilter?: { type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string },
    tableDateFilter?: { type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string }
  ): Promise<AdminDashboardResponse>;
  
  getTeacherDashboard(
    teacherId: string, 
    page?: number, 
    limit?: number, 
    dateFilter?: { type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string },
    tableDateFilter?: { type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string }
  ): Promise<TeacherDashboardResponse>;

  getUserDashboard(userId:string): Promise<UserDashboardResponse>;
}