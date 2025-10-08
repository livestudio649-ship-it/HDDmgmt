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
import { FileText, Search } from 'lucide-react';
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

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    // Force a fresh read from localStorage
    const data = getInwardRecords();
    setRecords([...data]); // Create new array reference to force re-render
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
                      return (
                      <TableRow key={record.id} className={record.isDelivered ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">{record.jobId}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.customerName}</TableCell>
                        <TableCell>{record.phoneNumber}</TableCell>
                        <TableCell>{record.receivedFrom}</TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{record.notes || '-'}</span></TableCell>
                        <TableCell>{record.estimatedAmount ? `₹${record.estimatedAmount.toLocaleString()}` : '-'}</TableCell>
                        <TableCell>{record.estimatedDeliveryDate ? new Date(record.estimatedDeliveryDate).toLocaleDateString() : '-'}</TableCell>
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
                                editable={true}
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedRecord(record)}
                            disabled={record.isDelivered}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Estimate
                          </Button>
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
            onSave={loadRecords}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inward;
