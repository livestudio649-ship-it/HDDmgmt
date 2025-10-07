import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Search, CheckCircle, Edit, Save, X } from 'lucide-react';
import { 
  getOutwardRecords, 
  saveOutwardRecords, 
  getHardDiskRecords,
  markItemAsDeliveredWithDetails,
  getMasterRecordData,
  OutwardRecord,
  DeliveryDetails 
} from '@/lib/storage';
import { DELIVERY_MODES, DELIVERY_MODE_OPTIONS, RECORD_STATUS } from '@/lib/constants';
import InvoiceDialog from '@/components/InvoiceDialog';
import DeliveryDialog from '@/components/DeliveryDialog';
import StatusBadge from '@/components/StatusBadge';

const Outward = () => {
  const [records, setRecords] = useState<OutwardRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<OutwardRecord | null>(null);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [recordForDelivery, setRecordForDelivery] = useState<OutwardRecord | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<OutwardRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const data = getOutwardRecords();
    setRecords(data);
  };

  const handleEdit = (record: OutwardRecord) => {
    setEditingId(record.id);
    setEditFormData({ ...record });
  };

  const handleSaveEdit = () => {
    if (!editFormData) return;
    
    const updatedRecords = records.map(r => 
      r.id === editFormData.id ? editFormData : r
    );
    
    saveOutwardRecords(updatedRecords);
    setRecords(updatedRecords);
    setEditingId(null);
    setEditFormData(null);
    toast.success('Outward record updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const handleMarkAsDelivered = (record: OutwardRecord) => {
    setRecordForDelivery(record);
    setDeliveryDialogOpen(true);
  };

  const handleDeliveryConfirm = (deliveryDetails: DeliveryDetails) => {
    if (!recordForDelivery) return;
    
    // Mark as delivered with full details
    markItemAsDeliveredWithDetails(recordForDelivery.jobId, deliveryDetails);
    
    // Reload records to reflect changes
    loadRecords();
    
    // Close dialog and reset
    setDeliveryDialogOpen(false);
    setRecordForDelivery(null);
    
    toast.success(`${recordForDelivery.jobId} marked as delivered successfully`);
  };

  const filteredRecords = records.filter((record) => {
    const search = searchTerm.toLowerCase();
    return (
      record.jobId.toLowerCase().includes(search) ||
      record.customerName.toLowerCase().includes(search) ||
      record.deliveredTo.toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Outward Records</h2>
          <p className="text-muted-foreground">Track devices delivered to customers</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Records ({filteredRecords.length})</CardTitle>
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Delivered To</TableHead>
                    <TableHead>Delivery Mode</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Est. Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No outward records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => {
                      const isEditing = editingId === record.id;
                      const displayRecord = isEditing && editFormData ? editFormData : record;
                      
                      // Get latest estimate from master database
                      const masterData = getMasterRecordData(record.jobId);
                      const currentEstimate = masterData?.estimatedAmount || displayRecord.estimatedAmount;
                      
                      return (
                      <TableRow key={record.id} className={record.isCompleted ? 'bg-green-50' : ''}>
                        <TableCell className="font-medium">{displayRecord.jobId}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={displayRecord.date}
                              onChange={(e) => setEditFormData({ ...displayRecord, date: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            new Date(displayRecord.date).toLocaleDateString()
                          )}
                        </TableCell>
                        <TableCell>{displayRecord.customerName}</TableCell>
                        <TableCell>{displayRecord.phoneNumber}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={displayRecord.deliveredTo}
                              onChange={(e) => setEditFormData({ ...displayRecord, deliveredTo: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            displayRecord.deliveredTo
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select 
                              value={displayRecord.deliveryMode} 
                              onValueChange={(value: any) => setEditFormData({ ...displayRecord, deliveryMode: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DELIVERY_MODE_OPTIONS.map((mode) => (
                                  <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            displayRecord.deliveryMode || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Textarea
                              value={displayRecord.notes}
                              onChange={(e) => setEditFormData({ ...displayRecord, notes: e.target.value })}
                              className="h-8 min-h-8"
                              rows={1}
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">{displayRecord.notes || '-'}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={displayRecord.estimatedAmount || ''}
                              onChange={(e) => setEditFormData({ ...displayRecord, estimatedAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="h-8"
                              placeholder="Amount"
                            />
                          ) : (
                            currentEstimate ? (
                              <span className="text-green-600">₹{currentEstimate.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-400 text-sm">Not set</span>
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const currentStatus = masterData?.status || RECORD_STATUS.IN_PROGRESS;
                            return (
                              <StatusBadge
                                jobId={record.jobId}
                                status={currentStatus}
                                onStatusChange={loadRecords}
                                showDate={true}
                                completedDate={record.completedDate}
                                editable={!isEditing}
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
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEdit(record)}
                                disabled={record.isCompleted}
                                title="Edit record"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedRecord(record)}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Invoice
                              </Button>
                              {!record.isCompleted && (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleMarkAsDelivered(record)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark Delivered
                                </Button>
                              )}
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

        {selectedRecord && (
          <InvoiceDialog
            record={selectedRecord}
            open={!!selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        )}

        {/* Delivery Dialog */}
        {recordForDelivery && (
          <DeliveryDialog
            open={deliveryDialogOpen}
            onClose={() => {
              setDeliveryDialogOpen(false);
              setRecordForDelivery(null);
            }}
            onConfirm={handleDeliveryConfirm}
            jobId={recordForDelivery.jobId}
            customerName={recordForDelivery.customerName}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Outward;
