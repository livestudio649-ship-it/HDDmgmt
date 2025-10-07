import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  getHardDiskRecords, 
  getInwardRecords, 
  getOutwardRecords,
  getAllRecordsWithStatus,
  getMasterCustomers,
  getGeneratedInvoices,
  getGeneratedEstimates,
  type MasterRecordData
} from '@/lib/storage';
import { RECORD_STATUS } from '@/lib/constants';
import { 
  HardDrive, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const calculateAnalytics = () => {
      const hardDisks = getHardDiskRecords();
      const inwardRecords = getInwardRecords();
      const outwardRecords = getOutwardRecords();
      const allRecords = getAllRecordsWithStatus();
      const customers = getMasterCustomers();
      const invoices = getGeneratedInvoices();
      const estimates = getGeneratedEstimates();

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Basic counts
      const totalJobs = hardDisks.length;
      const totalCustomers = customers.length;
      
      // Status breakdown
      const pendingJobs = allRecords.filter(r => r.status === RECORD_STATUS.PENDING).length;
      const inProgressJobs = allRecords.filter(r => r.status === RECORD_STATUS.IN_PROGRESS).length;
      const completedJobs = allRecords.filter(r => r.status === RECORD_STATUS.COMPLETED).length;

      // Monthly stats
      const monthlyInward = inwardRecords.filter((record) => {
        const date = new Date(record.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length;

      const lastMonthInward = inwardRecords.filter((record) => {
        const date = new Date(record.date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }).length;

      const monthlyCompleted = allRecords.filter((record) => {
        if (!record.completedDate) return false;
        const date = new Date(record.completedDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length;

      // Revenue calculations
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const monthlyRevenue = invoices.filter(inv => {
        const date = new Date(inv.generatedDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

      const lastMonthRevenue = invoices.filter(inv => {
        const date = new Date(inv.generatedDate);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }).reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

      const avgRevenuePerJob = totalJobs > 0 ? totalRevenue / totalJobs : 0;

      // Completion rate
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      // Average turnaround time (for completed jobs)
      let avgTurnaroundDays = 0;
      const completedWithDates = allRecords.filter(r => r.status === RECORD_STATUS.COMPLETED && r.completedDate);
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, record) => {
          const received = new Date(record.receivedDate);
          const completed = new Date(record.completedDate!);
          const days = Math.floor((completed.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgTurnaroundDays = Math.round(totalDays / completedWithDates.length);
      }

      // Monthly trend data (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const month = targetDate.getMonth();
        const year = targetDate.getFullYear();
        const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });

        const monthInward = inwardRecords.filter(r => {
          const date = new Date(r.date);
          return date.getMonth() === month && date.getFullYear() === year;
        }).length;

        const monthCompleted = allRecords.filter(r => {
          if (!r.completedDate) return false;
          const date = new Date(r.completedDate);
          return date.getMonth() === month && date.getFullYear() === year;
        }).length;

        const monthRevenue = invoices.filter(inv => {
          const date = new Date(inv.generatedDate);
          return date.getMonth() === month && date.getFullYear() === year;
        }).reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

        monthlyTrend.push({
          month: monthName,
          inward: monthInward,
          completed: monthCompleted,
          revenue: monthRevenue
        });
      }

      // Status distribution for pie chart
      const statusDistribution = [
        { name: 'Pending', value: pendingJobs, color: '#94a3b8' },
        { name: 'In Progress', value: inProgressJobs, color: '#f59e0b' },
        { name: 'Completed', value: completedJobs, color: '#10b981' }
      ];

      // Top customers by job count
      const customerJobCount: Record<string, number> = {};
      allRecords.forEach(record => {
        customerJobCount[record.customerName] = (customerJobCount[record.customerName] || 0) + 1;
      });
      const topCustomers = Object.entries(customerJobCount)
        .map(([name, count]) => ({ name, jobs: count }))
        .sort((a, b) => b.jobs - a.jobs)
        .slice(0, 5);

      return {
        // Core metrics
        totalJobs,
        totalCustomers,
        totalRevenue,
        monthlyRevenue,
        lastMonthRevenue,
        avgRevenuePerJob,
        
        // Job status
        pendingJobs,
        inProgressJobs,
        completedJobs,
        completionRate,
        
        // Time metrics
        avgTurnaroundDays,
        monthlyInward,
        lastMonthInward,
        monthlyCompleted,
        
        // Charts data
        monthlyTrend,
        statusDistribution,
        topCustomers,
        
        // Calculations for trends
        inwardTrend: monthlyInward >= lastMonthInward ? 'up' : 'down',
        inwardChange: lastMonthInward > 0 
          ? Math.round(((monthlyInward - lastMonthInward) / lastMonthInward) * 100)
          : 0,
        revenueTrend: monthlyRevenue >= lastMonthRevenue ? 'up' : 'down',
        revenueChange: lastMonthRevenue > 0
          ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : 0
      };
    };

    setAnalytics(calculateAnalytics());
  }, []);

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Business Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your data recovery operations</p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Jobs */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics.totalJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.completedJobs} completed
              </p>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Revenue
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ₹{analytics.monthlyRevenue.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {analytics.revenueTrend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <p className={`text-xs font-medium ${analytics.revenueTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.revenueChange > 0 ? '+' : ''}{analytics.revenueChange}% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Inward */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month Inward
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics.monthlyInward}</div>
              <div className="flex items-center gap-1 mt-1">
                {analytics.inwardTrend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <p className={`text-xs font-medium ${analytics.inwardTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.inwardChange > 0 ? '+' : ''}{analytics.inwardChange}% vs last month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.completedJobs} of {analytics.totalJobs} jobs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{analytics.totalRevenue.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>

          {/* Avg Revenue per Job */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Revenue/Job
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{analytics.avgRevenuePerJob.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>

          {/* Turnaround Time */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Turnaround
              </CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {analytics.avgTurnaroundDays} days
              </div>
            </CardContent>
          </Card>

          {/* Total Customers */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.totalCustomers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                6-Month Performance Trend
              </CardTitle>
              <CardDescription>Track inward jobs and completed deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.monthlyTrend}>
                  <defs>
                    <linearGradient id="colorInward" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="inward" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorInward)"
                    name="Inward Jobs"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorCompleted)"
                    name="Completed Jobs"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Job Status Distribution
              </CardTitle>
              <CardDescription>Current status of all jobs in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Monthly revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Revenue (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top 5 Customers
              </CardTitle>
              <CardDescription>Customers with most jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topCustomers} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="jobs" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Jobs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                Pending Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-700">{analytics.pendingJobs}</div>
              <p className="text-sm text-muted-foreground mt-2">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-700">{analytics.inProgressJobs}</div>
              <p className="text-sm text-muted-foreground mt-2">Currently being worked on</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-700">{analytics.completedJobs}</div>
              <p className="text-sm text-muted-foreground mt-2">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardHeader>
            <CardTitle>📊 Quick Business Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                <div>
                  <p className="font-medium text-foreground">Monthly Activity</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.monthlyInward} new jobs received, {analytics.monthlyCompleted} completed this month
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
                <div>
                  <p className="font-medium text-foreground">Revenue Performance</p>
                  <p className="text-sm text-muted-foreground">
                    Monthly revenue: ₹{analytics.monthlyRevenue.toLocaleString('en-IN')} ({analytics.revenueTrend === 'up' ? '↑' : '↓'} {Math.abs(analytics.revenueChange)}%)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
                <div>
                  <p className="font-medium text-foreground">Efficiency Metrics</p>
                  <p className="text-sm text-muted-foreground">
                    Average turnaround time: {analytics.avgTurnaroundDays} days per job
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-600 mt-2" />
                <div>
                  <p className="font-medium text-foreground">Customer Base</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.totalCustomers} unique customers with {analytics.totalJobs} total jobs
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
