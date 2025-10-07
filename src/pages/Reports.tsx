import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileDown, Search, Calendar, TrendingUp, Package, Clock, CheckCircle2, AlertCircle, Eye, X, Download, Upload, Trash2, Shield } from 'lucide-react';
import { getDeliveryReports, exportAllData, importData, clearAllData } from '@/lib/storage';
import { DELIVERY_MODE_OPTIONS, STATUS_CONFIG, RECORD_STATUS } from '@/lib/constants';
import StatusBadge from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import DataPasswordModal from '@/components/DataPasswordModal';
import { toast } from 'sonner';

interface DeliveryReport {
  id: number;
  jobId: string;
  date: string;
  deliveredTo: string;
  deliveryMode?: string;
  customerName: string;
  phoneNumber: string;
  isCompleted?: boolean;
  completedDate?: string;
  inwardDate?: string;
  deviceInfo?: string;
  serialNumber?: string;
  estimatedAmount?: number;
  status?: string;
}

type DateRangeType = 'custom' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

const Reports = () => {
  const [reports, setReports] = useState<DeliveryReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [filterDeliveryMode, setFilterDeliveryMode] = useState<string>('all');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Detail view dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailDialogType, setDetailDialogType] = useState<'delivered' | 'completed' | 'in_progress' | 'pending'>('delivered');
  const [detailDialogRecords, setDetailDialogRecords] = useState<DeliveryReport[]>([]);

  // Data management state
  const [importing, setImporting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'export' | 'import' | 'clear' | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  // Auto-set date range based on type
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    switch (dateRangeType) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        setDateFrom(todayStr);
        setDateTo(todayStr);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(day - today.getDay());
        setDateFrom(weekStart.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthStart = new Date(year, month, 1);
        setDateFrom(monthStart.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(month / 3) * 3;
        const quarterStart = new Date(year, quarterMonth, 1);
        setDateFrom(quarterStart.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'year':
        const yearStart = new Date(year, 0, 1);
        setDateFrom(yearStart.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'all':
        setDateFrom('');
        setDateTo('');
        break;
      case 'custom':
        // Don't auto-set for custom
        break;
    }
  }, [dateRangeType]);

  const loadReports = () => {
    const data = getDeliveryReports();
    setReports(data);
  };

  // Data management functions
  const requestExport = () => {
    setPendingAction('export');
    setPasswordModalOpen(true);
  };

  const requestImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setPendingFile(file);
    setPendingAction('import');
    setPasswordModalOpen(true);
    
    // Reset the input
    event.target.value = '';
  };

  const requestClear = () => {
    setPendingAction('clear');
    setPasswordModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    setPasswordModalOpen(false);
    
    if (pendingAction === 'export') {
      handleExport();
    } else if (pendingAction === 'import' && pendingFile) {
      handleImport(pendingFile);
    } else if (pendingAction === 'clear') {
      handleClearAll();
    }
    
    // Reset pending states
    setPendingAction(null);
    setPendingFile(null);
  };

  const handlePasswordCancel = () => {
    setPasswordModalOpen(false);
    setPendingAction(null);
    setPendingFile(null);
  };

  const handleExport = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-recovery-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = (file: File) => {
    setImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importData(data);
        toast.success('Data imported successfully');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        toast.error('Invalid file format');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleClearAll = () => {
    clearAllData();
    toast.success('All data cleared');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Calculate filtered reports with search and filters
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        report.jobId.toLowerCase().includes(search) ||
        report.customerName.toLowerCase().includes(search) ||
        report.deliveredTo.toLowerCase().includes(search) ||
        (report.deviceInfo && report.deviceInfo.toLowerCase().includes(search)) ||
        (report.phoneNumber && report.phoneNumber.includes(search))
      );

      const matchesStatus =
        filterStatus === 'all' ||
        report.status === filterStatus;

      const matchesDeliveryMode =
        filterDeliveryMode === 'all' ||
        report.deliveryMode === filterDeliveryMode;

      const reportDate = new Date(report.date);
      const matchesDateFrom = !dateFrom || reportDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || reportDate <= new Date(dateTo);

      return matchesSearch && matchesStatus && matchesDeliveryMode && matchesDateFrom && matchesDateTo;
    });
  }, [reports, searchTerm, filterStatus, filterDeliveryMode, dateFrom, dateTo]);

  // Calculate statistics based on filtered date range
  const stats = useMemo(() => {
    // Filter by date range for revenue calculation
    const dateFilteredReports = reports.filter(report => {
      if (!dateFrom && !dateTo) return true;
      const reportDate = new Date(report.date);
      const matchesDateFrom = !dateFrom || reportDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || reportDate <= new Date(dateTo);
      return matchesDateFrom && matchesDateTo;
    });

    const pending = dateFilteredReports.filter(r => r.status === RECORD_STATUS.PENDING).length;
    const inProgress = dateFilteredReports.filter(r => r.status === RECORD_STATUS.IN_PROGRESS).length;
    const completed = dateFilteredReports.filter(r => r.status === RECORD_STATUS.COMPLETED).length;
    
    // Revenue: Total amount for all COMPLETED/DELIVERED items in the selected date range
    const totalRevenue = dateFilteredReports
      .filter(r => r.status === RECORD_STATUS.COMPLETED && r.estimatedAmount)
      .reduce((sum, r) => sum + (r.estimatedAmount || 0), 0);

    // Count delivered items (completed status)
    const deliveredCount = completed;

    return {
      totalDeliveries: dateFilteredReports.length,
      completedDeliveries: completed,
      inProgressDeliveries: inProgress,
      pendingDeliveries: pending,
      deliveredCount,
      totalRevenue,
    };
  }, [reports, dateFrom, dateTo]);

  // Open detail dialog with filtered records
  const openDetailDialog = (type: 'delivered' | 'completed' | 'in_progress' | 'pending') => {
    let filteredData: DeliveryReport[] = [];
    
    // Apply date filter
    const dateFiltered = reports.filter(report => {
      if (!dateFrom && !dateTo) return true;
      const reportDate = new Date(report.date);
      const matchesDateFrom = !dateFrom || reportDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || reportDate <= new Date(dateTo);
      return matchesDateFrom && matchesDateTo;
    });

    switch (type) {
      case 'delivered':
      case 'completed':
        filteredData = dateFiltered.filter(r => r.status === RECORD_STATUS.COMPLETED);
        break;
      case 'in_progress':
        filteredData = dateFiltered.filter(r => r.status === RECORD_STATUS.IN_PROGRESS);
        break;
      case 'pending':
        filteredData = dateFiltered.filter(r => r.status === RECORD_STATUS.PENDING);
        break;
    }

    setDetailDialogType(type);
    setDetailDialogRecords(filteredData);
    setDetailDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Job ID',
      'Customer Name',
      'Phone',
      'Device Info',
      'Serial Number',
      'Inward Date',
      'Outward Date',
      'Delivered To',
      'Delivery Mode',
      'Status',
      'Completed Date',
      'Estimated Amount',
    ];

    const csvData = filteredReports.map(report => [
      report.jobId,
      report.customerName,
      report.phoneNumber,
      report.deviceInfo || 'N/A',
      report.serialNumber || 'N/A',
      report.inwardDate ? new Date(report.inwardDate).toLocaleDateString() : 'N/A',
      new Date(report.date).toLocaleDateString(),
      report.deliveredTo,
      report.deliveryMode || 'N/A',
      report.isCompleted ? 'Completed' : 'In Progress',
      report.completedDate ? new Date(report.completedDate).toLocaleDateString() : 'N/A',
      report.estimatedAmount ? `₹${report.estimatedAmount}` : 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `delivery-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      title: 'Revenue (Delivered)',
      subtitle: `${stats.deliveredCount} items delivered`,
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      clickable: true,
      onClick: () => openDetailDialog('delivered'),
    },
    {
      title: 'Completed',
      subtitle: 'Delivered items',
      value: stats.completedDeliveries,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      clickable: true,
      onClick: () => openDetailDialog('completed'),
    },
    {
      title: 'In Progress',
      subtitle: 'Work in progress',
      value: stats.inProgressDeliveries,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      clickable: true,
      onClick: () => openDetailDialog('in_progress'),
    },
    {
      title: 'Pending',
      subtitle: 'Awaiting action',
      value: stats.pendingDeliveries,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      clickable: true,
      onClick: () => openDetailDialog('pending'),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Delivery Reports</h2>
          <p className="text-muted-foreground">Track and analyze delivery status, modes, and history</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className={`hover:shadow-lg transition-all ${stat.clickable ? 'cursor-pointer hover:scale-105' : ''}`}
                onClick={stat.clickable ? stat.onClick : undefined}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground/70">{stat.subtitle}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    {stat.clickable && (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Database Management
            </CardTitle>
            <CardDescription>
              Export, import, and manage your complete database records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Export Data */}
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100 text-sm">Export Database</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                    Download complete backup of all records, customers, and settings
                  </p>
                  <Button onClick={requestExport} size="sm" className="w-full bg-green-600 hover:bg-green-700">
                    <Download className="w-3 h-3 mr-2" />
                    Export All Data
                  </Button>
                </div>
              </div>

              {/* Import Data */}
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100 text-sm">Import Database</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                    Restore from backup file (overwrites existing data)
                  </p>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={requestImport}
                      className="hidden"
                      id="reports-import-file"
                    />
                    <Button asChild size="sm" className="w-full bg-blue-600 hover:bg-blue-700" disabled={importing}>
                      <label htmlFor="reports-import-file" className="cursor-pointer">
                        <Upload className="w-3 h-3 mr-2" />
                        {importing ? 'Importing...' : 'Import Data'}
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Clear Data */}
              <div className="space-y-3">
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-900 dark:text-red-100 text-sm">Clear Database</span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                    Permanently delete all records and reset system
                  </p>
                  <Button onClick={requestClear} size="sm" variant="destructive" className="w-full">
                    <Trash2 className="w-3 h-3 mr-2" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <Shield className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-600" />
                <span>
                  <strong>Security Protected:</strong> All database operations require master password verification. 
                  Contact Swaz Data Recovery Labs (+919701087446) for password assistance.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Date Range & Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range & Filters</CardTitle>
            <CardDescription>
              Select a date range to calculate revenue and view reports for specific periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range Selector */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select 
                  value={dateRangeType} 
                  onValueChange={(value: DateRangeType) => setDateRangeType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDateRangeType('custom');
                  }}
                  disabled={dateRangeType !== 'custom'}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDateRangeType('custom');
                  }}
                  disabled={dateRangeType !== 'custom'}
                />
              </div>

              <div className="md:col-span-1">
                {dateRangeType === 'custom' && (dateFrom || dateTo) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setDateRangeType('all');
                    }}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Other Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Job ID, Customer, Phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={RECORD_STATUS.PENDING}>Pending</SelectItem>
                    <SelectItem value={RECORD_STATUS.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={RECORD_STATUS.COMPLETED}>Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryMode">Delivery Mode</Label>
                <Select value={filterDeliveryMode} onValueChange={setFilterDeliveryMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    {DELIVERY_MODE_OPTIONS.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Delivery Records ({filteredReports.length})</CardTitle>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Device Info</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Inward Date</TableHead>
                    <TableHead>Outward Date</TableHead>
                    <TableHead>Delivered To</TableHead>
                    <TableHead>Delivery Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No delivery records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id} className={report.isCompleted ? 'bg-green-50' : ''}>
                        <TableCell className="font-medium">{report.jobId}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{report.customerName}</div>
                            <div className="text-xs text-muted-foreground">{report.phoneNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{report.deviceInfo || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{report.serialNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {report.inwardDate ? new Date(report.inwardDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                        <TableCell>{report.deliveredTo}</TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {report.deliveryMode || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {report.status ? (
                            <StatusBadge
                              jobId={report.jobId}
                              status={report.status as any}
                              onStatusChange={loadReports}
                              showDate={true}
                              completedDate={report.completedDate}
                            />
                          ) : (
                            <span className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                              Unknown
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {report.estimatedAmount ? `₹${report.estimatedAmount.toLocaleString()}` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      {detailDialogOpen && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailDialogType === 'delivered' && (
                <>
                  <Package className="w-5 h-5 text-purple-600" />
                  Delivered Items - Revenue Details
                </>
              )}
              {detailDialogType === 'completed' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Completed Items
                </>
              )}
              {detailDialogType === 'in_progress' && (
                <>
                  <Clock className="w-5 h-5 text-yellow-600" />
                  In Progress Items
                </>
              )}
              {detailDialogType === 'pending' && (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Pending Items
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Showing {detailDialogRecords.length} record{detailDialogRecords.length !== 1 ? 's' : ''} 
              {dateFrom || dateTo ? ` for ${dateRangeType === 'custom' ? 'custom date range' : dateRangeType}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary for delivered items */}
            {detailDialogType === 'delivered' && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-3xl font-bold text-purple-600">
                        ₹{detailDialogRecords
                          .filter(r => r.estimatedAmount)
                          .reduce((sum, r) => sum + (r.estimatedAmount || 0), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Items Delivered</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {detailDialogRecords.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Average Amount</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ₹{detailDialogRecords.length > 0
                          ? Math.round(
                              detailDialogRecords
                                .filter(r => r.estimatedAmount)
                                .reduce((sum, r) => sum + (r.estimatedAmount || 0), 0) /
                              detailDialogRecords.filter(r => r.estimatedAmount).length
                            ).toLocaleString()
                          : '0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Records Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Device Info</TableHead>
                    <TableHead>Inward Date</TableHead>
                    <TableHead>Outward Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailDialogRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    detailDialogRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.jobId}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{record.customerName}</div>
                            <div className="text-xs text-muted-foreground">{record.phoneNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{record.deviceInfo || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{record.serialNumber || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.inwardDate ? new Date(record.inwardDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {record.status ? (
                            <Badge 
                              className={STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG]?.color}
                            >
                              {STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG]?.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unknown</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.estimatedAmount ? `₹${record.estimatedAmount.toLocaleString()}` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Export Button */}
            {detailDialogRecords.length > 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    // Export detail records to CSV
                    const headers = ['Job ID', 'Customer Name', 'Phone', 'Device Info', 'Serial Number', 'Inward Date', 'Outward Date', 'Status', 'Amount'];
                    const csvData = detailDialogRecords.map(r => [
                      r.jobId,
                      r.customerName,
                      r.phoneNumber,
                      r.deviceInfo || 'N/A',
                      r.serialNumber || 'N/A',
                      r.inwardDate ? new Date(r.inwardDate).toLocaleDateString() : 'N/A',
                      r.date ? new Date(r.date).toLocaleDateString() : 'N/A',
                      r.status || 'Unknown',
                      r.estimatedAmount ? `₹${r.estimatedAmount}` : 'N/A',
                    ]);
                    const csv = [
                      headers.join(','),
                      ...csvData.map(row => row.map(cell => `"${cell}"`).join(',')),
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${detailDialogType}-records-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  variant="outline"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export to CSV
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Password Modal */}
      <DataPasswordModal
        open={passwordModalOpen}
        onClose={handlePasswordCancel}
        onSuccess={handlePasswordSuccess}
        action={pendingAction || 'export'}
      />
      </div>
    </DashboardLayout>
  );
};

export default Reports;
