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
import { FileText, Search, Edit, Save, X } from 'lucide-react';
import { 
  getInwardRecords, 
  saveInwardRecords, 
  getHardDiskRecords,
  generateNextEstimateNumber,
  getMasterRecordData,
  InwardRecord 
} from '@/lib/storage';
import EstimateDialog from '@/components/EstimateDialog';
import StatusBadge from '@/components/StatusBadge';
import { RECORD_STATUS } from '@/lib/constants';

const Inward = () => {
  const [records, setRecords] = useState<InwardRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<InwardRecord | null>(null);
  const [showDelivered, setShowDelivered] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<InwardRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const data = getInwardRecords();
    setRecords(data);
  };

  const handleEdit = (record: InwardRecord) => {
    setEditingId(record.id);
    setEditFormData({ ...record });
  };

  const handleSaveEdit = () => {
    if (!editFormData) return;
    
    const updatedRecords = records.map(r => 
      r.id === editFormData.id ? editFormData : r
    );
    
    saveInwardRecords(updatedRecords);
    setRecords(updatedRecords);
    setEditingId(null);
    setEditFormData(null);
    toast.success('Inward record updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const filteredRecords = records.filter((record) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      record.jobId.toLowerCase().includes(search) ||
      record.customerName.toLowerCase().includes(search) ||
      record.receivedFrom.toLowerCase().includes(search)
    );
    
    // Filter out delivered items unless showDelivered is true
    const deliveryFilter = showDelivered || !record.isDelivered;
    
    return matchesSearch && deliveryFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Inward Records</h2>
          <p className="text-muted-foreground">Track devices received from customers</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Records ({filteredRecords.length})</CardTitle>
              <div className="flex gap-2 flex-1 md:flex-initial">
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
                  variant={showDelivered ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowDelivered(!showDelivered)}
                >
                  {showDelivered ? "Hide Delivered" : "Show Delivered"}
                </Button>
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
                    <TableHead>Received From</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Est. Amount</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No inward records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => {
                      const isEditing = editingId === record.id;
                      const displayRecord = isEditing && editFormData ? editFormData : record;
                      
                      return (
                      <TableRow key={record.id} className={record.isDelivered ? 'bg-muted/50' : ''}>
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
                              value={displayRecord.receivedFrom}
                              onChange={(e) => setEditFormData({ ...displayRecord, receivedFrom: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            displayRecord.receivedFrom
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
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={displayRecord.estimatedAmount || ''}
                              onChange={(e) => setEditFormData({ ...displayRecord, estimatedAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="h-8"
                              placeholder="Amount"
                            />
                          ) : (
                            displayRecord.estimatedAmount ? `₹${displayRecord.estimatedAmount.toLocaleString()}` : '-'
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
                            displayRecord.estimatedDeliveryDate ? new Date(displayRecord.estimatedDeliveryDate).toLocaleDateString() : '-'
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
                                showDate={true}
                                completedDate={record.deliveryDate}
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
                            <div className="flex justify-end gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEdit(record)}
                                disabled={record.isDelivered}
                                title="Edit record"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedRecord(record)}
                                disabled={record.isDelivered}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Estimate
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

        {selectedRecord && (
          <EstimateDialog
            record={selectedRecord}
            open={!!selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inward;
