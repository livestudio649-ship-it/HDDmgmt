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
import { FileText, Search, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const data = getOutwardRecords();
    setRecords(data);
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
                      // Get latest estimate from master database
                      const masterData = getMasterRecordData(record.jobId);
                      const currentEstimate = masterData?.estimatedAmount || record.estimatedAmount;
                      
                      return (
                      <TableRow key={record.id} className={record.isCompleted ? 'bg-green-50' : ''}>
                        <TableCell className="font-medium">{record.jobId}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.customerName}</TableCell>
                        <TableCell>{record.phoneNumber}</TableCell>
                        <TableCell>{record.deliveredTo}</TableCell>
                        <TableCell>{record.deliveryMode || 'N/A'}</TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{record.notes || '-'}</span></TableCell>
                        <TableCell className="font-medium">
                          {currentEstimate ? (
                            <span className="text-green-600">₹{currentEstimate.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not set</span>
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
                                editable={true}
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
