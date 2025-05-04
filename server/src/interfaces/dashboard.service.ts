export interface IDashboardService {
  getAdminDashboard(
    page?: number, 
    limit?: number, 
    dateFilter?: { type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string },
    tableDateFilter?: { type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string }
  ): Promise<any>;
  
  getTeacherDashboard(
    teacherId: string, 
    page?: number, 
    limit?: number, 
    dateFilter?: { type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string },
    tableDateFilter?: { type: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string }
  ): Promise<any>;
}