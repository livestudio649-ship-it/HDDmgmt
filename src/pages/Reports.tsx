import { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileDown, Search, Calendar, TrendingUp, Package, Clock, CheckCircle2, AlertCircle, Eye, X, Upload, Download, Trash2, Database, RefreshCw } from 'lucide-react';
import { getDeliveryReports, getBackupJobData, saveBackupJobData, importBackupJobData, exportBackupJobData, clearBackupJobData, autoSyncBackupJobData, deleteSelectedBackupJobData, BackupJobData } from '@/lib/storage';
import { DELIVERY_MODE_OPTIONS, STATUS_CONFIG, RECORD_STATUS } from '@/lib/constants';
import StatusBadge from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

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
  
  // Data tab state
  const [backupJobData, setBackupJobData] = useState<BackupJobData[]>([]);
  const [dataSearchTerm, setDataSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('reports');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Selection state
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadReports();
    loadBackupData();
    
    // Auto-sync on first load if backup data is empty
    const currentBackupData = getBackupJobData();
    if (currentBackupData.length === 0) {
      const result = autoSyncBackupJobData();
      if (result.success && result.count > 0) {
        // Reload backup data after auto-sync
        setTimeout(() => {
          loadBackupData();
        }, 100);
      }
    }
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

  // Clear selections when data changes
  useEffect(() => {
    setSelectedRecords(new Set());
    setSelectAll(false);
  }, [dataSearchTerm, backupJobData]);

  const loadReports = () => {
    const data = getDeliveryReports();
    setReports(data);
  };

  const loadBackupData = () => {
    const data = getBackupJobData();
    setBackupJobData(data);
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

  // Calculate filtered backup data
  const filteredBackupData = useMemo(() => {
    return backupJobData.filter((data) => {
      const search = dataSearchTerm.toLowerCase();
      return (
        data.jobId.toLowerCase().includes(search) ||
        data.customerName.toLowerCase().includes(search) ||
        data.phoneNumber.includes(search) ||
        data.deviceInfo.toLowerCase().includes(search) ||
        data.serialNumber.toLowerCase().includes(search)
      );
    });
  }, [backupJobData, dataSearchTerm]);

  // Data management functions
  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const dataArray = Array.isArray(jsonData) ? jsonData : jsonData.backupJobData || [];
        
        const result = importBackupJobData(dataArray);
        if (result.success) {
          loadBackupData();
          alert(`Successfully imported ${result.count} records!`);
        } else {
          alert(`Import failed: ${result.error}`);
        }
      } catch (error) {
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportData = () => {
    const exportData = exportBackupJobData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-job-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all backup job data? This action cannot be undone.')) {
      clearBackupJobData();
      loadBackupData();
      alert('All backup job data has been cleared.');
    }
  };


  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredBackupData.map(record => record.id));
      setSelectedRecords(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectRecord = (id: number) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
    setSelectAll(newSelected.size === filteredBackupData.length && filteredBackupData.length > 0);
  };

  const handleDeleteSelected = () => {
    if (selectedRecords.size === 0) return;
    
    const selectedData = backupJobData.filter(record => selectedRecords.has(record.id));
    const jobIds = selectedData.map(record => record.jobId).join(', ');
    
    const confirmMessage = `Are you sure you want to delete ${selectedRecords.size} selected record(s)?\n\nThis will permanently remove:\n- Backup job data records\n- Corresponding Hard Disk Records\n- Related Inward and Outward records\n\nJob IDs to be deleted: ${jobIds}\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      const result = deleteSelectedBackupJobData(Array.from(selectedRecords));
      if (result.success) {
        loadBackupData();
        loadReports(); // Reload reports to reflect changes
        setSelectedRecords(new Set());
        setSelectAll(false);
        alert(`Successfully deleted ${result.count} record(s) and their corresponding Hard Disk Records.\n\nDeleted Job IDs: ${result.deletedJobIds.join(', ')}`);
      } else {
        alert(`Delete failed: ${result.error}`);
      }
    }
  };

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
          <h2 className="text-3xl font-bold text-foreground">Reports & Data Management</h2>
          <p className="text-muted-foreground">Track delivery reports and manage backup job data</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">

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
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            {/* Data Management Interface */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Backup Job Data Management
                    </CardTitle>
                    <CardDescription>
                      Import, export, and manage complete backup job ID data
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleImportData} variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <Button onClick={handleExportData} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button 
                      onClick={handleDeleteSelected} 
                      variant="destructive" 
                      size="sm"
                      disabled={selectedRecords.size === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected ({selectedRecords.size})
                    </Button>
                    <Button 
                      onClick={handleClearData} 
                      variant="outline" 
                      size="sm"
                      disabled={true}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search job ID, customer, phone, device..."
                      value={dataSearchTerm}
                      onChange={(e) => setDataSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {filteredBackupData.length} of {backupJobData.length} records
                  </div>
                </div>

                {/* Data Table */}
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                            disabled={filteredBackupData.length === 0}
                          />
                        </TableHead>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Device Info</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Complaint</TableHead>
                        <TableHead>Received Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBackupData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                            {backupJobData.length === 0 
                              ? 'No backup job data found. Import data to get started.' 
                              : 'No records match your search criteria.'
                            }
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBackupData.map((data) => (
                          <TableRow key={data.id} className={selectedRecords.has(data.id) ? 'bg-muted/50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRecords.has(data.id)}
                                onCheckedChange={() => handleSelectRecord(data.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{data.jobId}</TableCell>
                            <TableCell>{data.customerName}</TableCell>
                            <TableCell>{data.phoneNumber}</TableCell>
                            <TableCell>{data.deviceInfo}</TableCell>
                            <TableCell className="text-sm">{data.serialNumber}</TableCell>
                            <TableCell className="text-sm max-w-xs truncate" title={data.complaint}>
                              {data.complaint}
                            </TableCell>
                            <TableCell>{new Date(data.receivedDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {data.estimatedAmount ? `₹${data.estimatedAmount.toLocaleString()}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG]?.color}
                              >
                                {STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG]?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(data.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Stats */}
                {backupJobData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{backupJobData.length}</div>
                      <div className="text-sm text-muted-foreground">Total Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {backupJobData.filter(d => d.status === RECORD_STATUS.COMPLETED).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {backupJobData.filter(d => d.status === RECORD_STATUS.IN_PROGRESS).length}
                      </div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {backupJobData.filter(d => d.status === RECORD_STATUS.PENDING).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".json"
          style={{ display: 'none' }}
        />
      </div>

      {/* Detail Dialog */}
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
    </DashboardLayout>
  );
};

export default Reports;
