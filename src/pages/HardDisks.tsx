import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Edit, Save, X, PackageCheck, Eye, EyeOff } from 'lucide-react';
import { 
  getHardDiskRecords, 
  saveHardDiskRecords, 
  generateNextJobId,
  previewNextJobId,
  resetJobIdCounter,
  saveHardDiskRecordWithSync,
  getMasterCustomers,
  getMasterRecordData,
  deleteJobIdFromAllRecords,
  clearAllOutwardRecords,
  HardDiskRecord,
  DeliveryDetails
} from '@/lib/storage';
import { useCompany } from '@/lib/company';
import { getTodayISO, convertISOToDDMMYYYY } from '@/lib/formatters';
import DeliveryDialog from '@/components/DeliveryDialog';
import StatusBadge from '@/components/StatusBadge';
import { RECORD_STATUS } from '@/lib/constants';

const models = ['WD', 'Seagate', 'Hitachi', 'Samsung', 'Toshiba', 'Fujitsu', 'Maxtor', 'Other'];
const capacities = ['128GB', '256GB', '512GB', '1TB', '2TB', '4TB', '8TB'];

const HardDisks = () => {
  const { company } = useCompany();
  const [records, setRecords] = useState<HardDiskRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<HardDiskRecord | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const [showClosed, setShowClosed] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedRecordForDelivery, setSelectedRecordForDelivery] = useState<HardDiskRecord | null>(null);
  const [formData, setFormData] = useState({
    jobId: '',
    serialNumber: '',
    model: '',
    capacity: '',
    year: new Date().getFullYear(),
    complaint: '',
    customerName: company.companyName || '',
    phoneNumber: '',
    customerGSTIN: '',
    customerAddress: '',
    customerState: '',
    estimatedAmount: undefined as number | undefined,
    estimatedDeliveryDate: getTodayISO(),
    receivedDate: getTodayISO(),
  });
  

  useEffect(() => {
    // Delete JOB004 from all records
    const deleteResult = deleteJobIdFromAllRecords('JOB004');
    if (deleteResult.success) {
      console.log('JOB004 successfully deleted from all records');
      toast.success('JOB004 has been cleared from all records');
    } else {
      console.error('Failed to delete JOB004:', deleteResult.error);
    }

    // Clear all Outward records
    const clearResult = clearAllOutwardRecords();
    if (clearResult.success) {
      console.log('All Outward records successfully cleared');
      toast.success('All Outward Job IDs have been cleared');
    } else {
      console.error('Failed to clear Outward records:', clearResult.error);
    }
    
    loadRecords();
    loadCustomerSuggestions();
  }, []);

  // Auto-generate Job ID when records change
  useEffect(() => {
    if (records.length >= 0) {
      autoGenerateJobId();
    }
  }, [records]);

  const autoGenerateJobId = () => {
    // If no records exist, start from JOB001
    if (records.length === 0) {
      resetJobIdCounter();
      setFormData((prev) => ({ ...prev, jobId: 'JOB001' }));
      return;
    }
    
    let nextJobId = previewNextJobId();
    
    // Ensure the generated Job ID doesn't already exist
    while (records.find(record => record.jobId === nextJobId)) {
      const baseCounter = parseInt(nextJobId.replace('JOB', ''));
      let testCounter = baseCounter + 1;
      nextJobId = `JOB${testCounter.toString().padStart(3, '0')}`;
      
      while (records.find(record => record.jobId === nextJobId)) {
        testCounter++;
        nextJobId = `JOB${testCounter.toString().padStart(3, '0')}`;
      }
    }
    
    setFormData((prev) => ({ ...prev, jobId: nextJobId }));
  };

  useEffect(() => {
    // Update customer name default when company changes
    if (company.companyName && !formData.customerName) {
      setFormData(prev => ({ ...prev, customerName: company.companyName }));
    }
  }, [company.companyName]);


  const loadCustomerSuggestions = () => {
    const customers = getMasterCustomers();
    setCustomerSuggestions(customers.map(c => c.name));
  };

  const loadRecords = () => {
    // Force a fresh read from localStorage
    const data = getHardDiskRecords();
    setRecords([...data]); // Create new array reference to force re-render
  };


  // Check if a Job ID is auto-generated (follows JOB### pattern)
  const isAutoGeneratedJobId = (jobId: string): boolean => {
    return /^JOB\d{3}$/.test(jobId);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRecord: HardDiskRecord = {
      jobId: formData.jobId,
      serialNumber: formData.serialNumber,
      model: formData.model,
      capacity: formData.capacity,
      year: formData.year,
      complaint: formData.complaint,
      customerName: formData.customerName,
      phoneNumber: formData.phoneNumber,
      customerGSTIN: formData.customerGSTIN,
      customerAddress: formData.customerAddress,
      customerState: formData.customerState,
      estimatedAmount: formData.estimatedAmount,
      estimatedDeliveryDate: formData.estimatedDeliveryDate,
      receivedDate: formData.receivedDate,
      createdAt: new Date().toISOString(),
      isClosed: false,
    };

    // Use new sync function that auto-creates Inward record
    saveHardDiskRecordWithSync(newRecord);
    
    // Only increment the Job ID counter if this Job ID follows the JOB### pattern
    // and is the next expected Job ID in sequence
    const jobIdMatch = formData.jobId.match(/^JOB(\d+)$/);
    if (jobIdMatch) {
      const jobNumber = parseInt(jobIdMatch[1]);
      const expectedNextJobId = previewNextJobId();
      const expectedJobNumber = parseInt(expectedNextJobId.replace('JOB', ''));
      
      // If the saved Job ID is the expected next Job ID, increment the counter
      if (jobNumber === expectedJobNumber) {
        generateNextJobId(); // This will increment the counter
      }
    }
    
    // Force immediate refresh of records
    loadRecords();
    loadCustomerSuggestions();
    
    // Additional refresh after a short delay to handle any buffering issues
    setTimeout(() => {
      loadRecords();
      loadCustomerSuggestions();
    }, 200);
    
    toast.success(`Record ${formData.jobId} added successfully and synced to Inward`);
    
    // Reset form and auto-generate next Job ID
    setFormData({
      jobId: '',
      serialNumber: '',
      model: '',
      capacity: '',
      year: new Date().getFullYear(),
      complaint: '',
      customerName: company.companyName || '',
      phoneNumber: '',
      customerGSTIN: '',
      customerAddress: '',
      customerState: '',
      estimatedAmount: undefined,
      estimatedDeliveryDate: getTodayISO(),
      receivedDate: getTodayISO(),
    });
    
    // Auto-generate next Job ID after successful save with additional refresh
    setTimeout(() => {
      loadRecords(); // Refresh records again
      autoGenerateJobId();
    }, 300);
  };

  const handleDelete = () => {
    if (selectedRecords.size === 0) {
      toast.error('Please select records to delete');
      return;
    }

    // Check if any selected records have auto-generated Job IDs
    const autoGeneratedRecords = Array.from(selectedRecords).filter(jobId => 
      isAutoGeneratedJobId(jobId)
    );

    if (autoGeneratedRecords.length > 0) {
      toast.error(`Cannot delete auto-generated Job IDs: ${autoGeneratedRecords.join(', ')}`);
      return;
    }

    const updatedRecords = records.filter((record) => !selectedRecords.has(record.jobId));
    saveHardDiskRecords(updatedRecords);
    
    // Force immediate refresh
    loadRecords();
    setSelectedRecords(new Set());
    
    // Additional refresh after delay to handle buffering
    setTimeout(() => {
      loadRecords();
    }, 200);
    
    toast.success(`${selectedRecords.size} record(s) deleted successfully`);
  };

  const handleEdit = (record: HardDiskRecord) => {
    if (isAutoGeneratedJobId(record.jobId)) {
      toast.error(`Cannot edit auto-generated Job ID: ${record.jobId}`);
      return;
    }

    setEditingJobId(record.jobId);
    setEditFormData({ ...record });
  };

  const handleSaveEdit = () => {
    if (!editFormData) return;
    
    saveHardDiskRecordWithSync(editFormData);
    
    // Force immediate refresh
    loadRecords();
    loadCustomerSuggestions();
    
    // Additional refresh after delay to handle buffering
    setTimeout(() => {
      loadRecords();
      loadCustomerSuggestions();
    }, 200);
    
    setEditingJobId(null);
    setEditFormData(null);
    toast.success('Record updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    setEditFormData(null);
  };

  const handleDeleteSingle = (jobId: string) => {
    if (isAutoGeneratedJobId(jobId)) {
      toast.error(`Cannot delete auto-generated Job ID: ${jobId}`);
      return;
    }

    const confirmDelete = confirm(`Delete record ${jobId}? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    const updatedRecords = records.filter(r => r.jobId !== jobId);
    saveHardDiskRecords(updatedRecords);
    loadRecords();
    toast.success(`Record ${jobId} deleted successfully`);
  };

  const handleMarkAsDelivered = (record: HardDiskRecord) => {
    setSelectedRecordForDelivery(record);
    setDeliveryDialogOpen(true);
  };

  const handleDeliveryConfirm = (deliveryDetails: DeliveryDetails) => {
    if (!selectedRecordForDelivery) return;
    
    const updatedRecords = records.map(r => 
      r.jobId === selectedRecordForDelivery.jobId
        ? { ...r, isClosed: true, deliveryDetails }
        : r
    );
    
    saveHardDiskRecords(updatedRecords);
    setRecords(updatedRecords);
    setSelectedRecordForDelivery(null);
    toast.success(`${selectedRecordForDelivery.jobId} marked as delivered successfully`);
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === filteredRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filteredRecords.map((r) => r.jobId)));
    }
  };

  const filteredRecords = records.filter((record) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      record.jobId.toLowerCase().includes(search) ||
      record.serialNumber.toLowerCase().includes(search) ||
      record.model.toLowerCase().includes(search) ||
      record.customerName.toLowerCase().includes(search) ||
      record.phoneNumber.includes(search)
    );
    
    // Filter based on closed status
    const matchesClosedFilter = showClosed || !record.isClosed;
    
    return matchesSearch && matchesClosedFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Hard Disk Records</h2>
          <p className="text-muted-foreground">Manage your hard disk inventory</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobId">Job ID</Label>
                  <Input
                    id="jobId"
                    value={formData.jobId}
                    readOnly
                    className="bg-muted font-mono text-center"
                    title="Auto-generated Job ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number *</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Select value={formData.capacity} onValueChange={(value) => setFormData({ ...formData, capacity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      {capacities.map((capacity) => (
                        <SelectItem key={capacity} value={capacity}>{capacity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Manufacturing Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="2000"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      // Only allow numeric characters
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, phoneNumber: numericValue });
                    }}
                    onKeyPress={(e) => {
                      // Prevent non-numeric characters from being typed
                      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Enter phone number (numbers only)"
                    maxLength={15}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerGSTIN">Customer GSTIN (Optional)</Label>
                  <Input
                    id="customerGSTIN"
                    value={formData.customerGSTIN}
                    onChange={(e) => setFormData({ ...formData, customerGSTIN: e.target.value })}
                    placeholder="29XXXXX1234X1XX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerState">Customer State</Label>
                  <Input
                    id="customerState"
                    value={formData.customerState}
                    onChange={(e) => setFormData({ ...formData, customerState: e.target.value })}
                    placeholder="e.g., Karnataka, Maharashtra"
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="customerAddress">Customer Address</Label>
                  <Textarea
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="complaint">Customer Complaint *</Label>
                  <Textarea
                    id="complaint"
                    value={formData.complaint}
                    onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receivedDate">
                    HDD Received Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-1">
                    <Input
                      id="receivedDate"
                      type="date"
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                      required
                    />
                    {formData.receivedDate && (
                      <span className="text-xs text-muted-foreground">
                        Display: {convertISOToDDMMYYYY(formData.receivedDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</Label>
                  <div className="space-y-1">
                    <Input
                      id="estimatedDeliveryDate"
                      type="date"
                      value={formData.estimatedDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, estimatedDeliveryDate: e.target.value })}
                    />
                    {formData.estimatedDeliveryDate && (
                      <span className="text-xs text-muted-foreground">
                        Display: {convertISOToDDMMYYYY(formData.estimatedDeliveryDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Records ({filteredRecords.length})</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant={showClosed ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowClosed(!showClosed)}
                >
                  {showClosed ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                  {showClosed ? "Hide Closed" : "Show Closed"}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={selectedRecords.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedRecords.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => {
                      const isEditing = editingJobId === record.jobId;
                      const displayRecord = isEditing && editFormData ? editFormData : record;
                      const isClosed = record.isClosed;
                      
                      return (
                        <TableRow key={record.jobId} className={isClosed ? 'bg-gray-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRecords.has(record.jobId)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedRecords);
                                if (checked) {
                                  newSelected.add(record.jobId);
                                } else {
                                  newSelected.delete(record.jobId);
                                }
                                setSelectedRecords(newSelected);
                              }}
                              disabled={isEditing || isClosed}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{displayRecord.jobId}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={displayRecord.serialNumber}
                                onChange={(e) => setEditFormData({ ...displayRecord, serialNumber: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              displayRecord.serialNumber
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Select 
                                value={displayRecord.model} 
                                onValueChange={(value) => setEditFormData({ ...displayRecord, model: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {models.map((model) => (
                                    <SelectItem key={model} value={model}>{model}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              displayRecord.model
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Select 
                                value={displayRecord.capacity} 
                                onValueChange={(value) => setEditFormData({ ...displayRecord, capacity: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {capacities.map((capacity) => (
                                    <SelectItem key={capacity} value={capacity}>{capacity}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              displayRecord.capacity
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={displayRecord.customerName}
                                onChange={(e) => setEditFormData({ ...displayRecord, customerName: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              <div className="space-y-1">
                                <div>{displayRecord.customerName}</div>
                                <div className="text-xs text-muted-foreground">{displayRecord.phoneNumber}</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={displayRecord.receivedDate || ''}
                                onChange={(e) => setEditFormData({ ...displayRecord, receivedDate: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              <div className="text-sm">{convertISOToDDMMYYYY(displayRecord.receivedDate)}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={displayRecord.estimatedDeliveryDate || ''}
                                onChange={(e) => setEditFormData({ ...displayRecord, estimatedDeliveryDate: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              displayRecord.estimatedDeliveryDate ? (
                                <div className="text-sm">{convertISOToDDMMYYYY(displayRecord.estimatedDeliveryDate)}</div>
                              ) : '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const masterData = getMasterRecordData(record.jobId);
                              const currentStatus = masterData?.status || RECORD_STATUS.PENDING;
                              return (
                                <StatusBadge
                                  jobId={record.jobId}
                                  status={currentStatus}
                                  onStatusChange={loadRecords}
                                  editable={!isEditing}
                                  showDate={true}
                                  completedDate={record.deliveryDetails?.deliveryDate}
                                />
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="default" onClick={handleSaveEdit}>
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : isClosed ? (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteSingle(record.jobId)}
                                title={isAutoGeneratedJobId(record.jobId) ? "Cannot delete auto-generated Job ID" : "Delete closed record"}
                                disabled={isAutoGeneratedJobId(record.jobId)}
                              >
                                <Trash2 className={`w-4 h-4 ${isAutoGeneratedJobId(record.jobId) ? 'text-gray-400' : 'text-red-500'}`} />
                              </Button>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleEdit(record)}
                                  title="Edit record"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDeleteSingle(record.jobId)}
                                  title={isAutoGeneratedJobId(record.jobId) ? "Cannot delete auto-generated Job ID" : "Delete record"}
                                  disabled={isAutoGeneratedJobId(record.jobId)}
                                >
                                  <Trash2 className={`w-4 h-4 ${isAutoGeneratedJobId(record.jobId) ? 'text-gray-400' : 'text-red-500'}`} />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  onClick={() => handleMarkAsDelivered(record)}
                                  className="bg-green-600 hover:bg-green-700"
                                  title="Mark as delivered"
                                >
                                  <PackageCheck className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {deliveryDialogOpen && selectedRecordForDelivery && (
        <DeliveryDialog
          open={deliveryDialogOpen}
          onClose={() => setDeliveryDialogOpen(false)}
          onConfirm={handleDeliveryConfirm}
          jobId={selectedRecordForDelivery.jobId}
          customerName={selectedRecordForDelivery.customerName}
        />
      )}

    </DashboardLayout>
  );
};

export default HardDisks;
