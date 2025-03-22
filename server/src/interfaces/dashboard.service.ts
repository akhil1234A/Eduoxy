export interface IDashboardService {
  getAdminDashboard(): Promise<any>;
  getTeacherDashboard(teacherId: string): Promise<any>;
}