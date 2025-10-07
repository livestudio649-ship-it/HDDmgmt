import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RECORD_STATUS, STATUS_CONFIG, RecordStatus } from '@/lib/constants';
import { updateRecordStatus } from '@/lib/storage';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  jobId: string;
  status: RecordStatus;
  onStatusChange?: () => void;
  editable?: boolean;
  showDate?: boolean;
  completedDate?: string;
}

const StatusBadge = ({ 
  jobId, 
  status, 
  onStatusChange, 
  editable = true,
  showDate = false,
  completedDate 
}: StatusBadgeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const statusConfig = STATUS_CONFIG[status];

  const handleStatusChange = (newStatus: RecordStatus) => {
    updateRecordStatus(jobId, newStatus);
    toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
    setIsEditing(false);
    if (onStatusChange) {
      onStatusChange();
    }
  };

  if (!editable) {
    return (
      <div className="space-y-1">
        <span className={`text-sm px-2 py-1 rounded-full ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        {showDate && completedDate && status === RECORD_STATUS.COMPLETED && (
          <div className="text-xs text-muted-foreground">
            {new Date(completedDate).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <Select 
        value={status} 
        onValueChange={(value: RecordStatus) => handleStatusChange(value)}
        onOpenChange={(open) => !open && setIsEditing(false)}
        defaultOpen
      >
        <SelectTrigger className="h-8 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={RECORD_STATUS.PENDING}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              Pending
            </span>
          </SelectItem>
          <SelectItem value={RECORD_STATUS.IN_PROGRESS}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              In Progress
            </span>
          </SelectItem>
          <SelectItem value={RECORD_STATUS.COMPLETED}>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-600" />
              Completed
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsEditing(true)}
        className={`text-sm px-2 py-1 rounded-full transition-all hover:ring-2 hover:ring-offset-1 hover:ring-primary ${statusConfig.color}`}
        title="Click to change status"
      >
        {statusConfig.label}
      </button>
      {showDate && completedDate && status === RECORD_STATUS.COMPLETED && (
        <div className="text-xs text-muted-foreground">
          {new Date(completedDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
