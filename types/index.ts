export interface URLSubmission {
  id: string;
  websiteUrl: string;
  businessName: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUrls: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  successRate: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  submissions: number;
  success: number;
  failed: number;
}

export interface RecentActivity {
  id: string;
  type: 'upload' | 'success' | 'failed';
  message: string;
  timestamp: string;
}
