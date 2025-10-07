import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackageCheck } from 'lucide-react';
import { DeliveryDetails } from '@/lib/storage';
import { getTodayISO, convertISOToDDMMYYYY } from '@/lib/formatters';
import { DELIVERY_MODES, DELIVERY_MODE_OPTIONS, DeliveryMode } from '@/lib/constants';

interface DeliveryDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (details: DeliveryDetails) => void;
  jobId: string;
  customerName: string;
}

const DeliveryDialog = ({ open, onClose, onConfirm, jobId, customerName }: DeliveryDialogProps) => {
  const [formData, setFormData] = useState<DeliveryDetails>({
    deliveryDate: getTodayISO(),
    deliveryMode: DELIVERY_MODES.HAND_DELIVERY,
    recipientName: customerName,
    courierNumber: '',
    courierCompany: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'Delivery date is required';
    }
    
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }
    
    // Require courier details for Courier and Postal Service
    if (formData.deliveryMode === DELIVERY_MODES.COURIER || formData.deliveryMode === DELIVERY_MODES.POSTAL_SERVICE) {
      if (!formData.courierNumber?.trim()) {
        newErrors.courierNumber = 'Tracking number is required for courier/postal delivery';
      }
      if (!formData.courierCompany?.trim()) {
        newErrors.courierCompany = 'Courier/postal company is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onConfirm(formData);
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      deliveryDate: getTodayISO(),
      deliveryMode: DELIVERY_MODES.HAND_DELIVERY,
      recipientName: customerName,
      courierNumber: '',
      courierCompany: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-green-600" />
            Mark as Delivered - {jobId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Delivery Date */}
          <div className="space-y-2">
            <Label htmlFor="deliveryDate">
              Delivery Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className={errors.deliveryDate ? 'border-red-500' : ''}
              />
              {formData.deliveryDate && (
                <span className="text-xs text-muted-foreground mt-1 block">
                  Display: {convertISOToDDMMYYYY(formData.deliveryDate)}
                </span>
              )}
            </div>
            {errors.deliveryDate && (
              <p className="text-xs text-red-500">{errors.deliveryDate}</p>
            )}
          </div>

          {/* Delivery Mode */}
          <div className="space-y-2">
            <Label htmlFor="deliveryMode">
              Delivery Mode <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.deliveryMode}
              onValueChange={(value: DeliveryMode) => {
                setFormData({ ...formData, deliveryMode: value });
                // Clear courier fields if not courier/postal
                if (value !== DELIVERY_MODES.COURIER && value !== DELIVERY_MODES.POSTAL_SERVICE) {
                  setFormData(prev => ({
                    ...prev,
                    deliveryMode: value,
                    courierNumber: '',
                    courierCompany: '',
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery mode" />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_MODE_OPTIONS.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Name */}
          <div className="space-y-2">
            <Label htmlFor="recipientName">
              Recipient Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipientName"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              placeholder="Name of person receiving the device"
              className={errors.recipientName ? 'border-red-500' : ''}
            />
            {errors.recipientName && (
              <p className="text-xs text-red-500">{errors.recipientName}</p>
            )}
          </div>

          {/* Courier Details (only if courier or postal selected) */}
          {(formData.deliveryMode === DELIVERY_MODES.COURIER || formData.deliveryMode === DELIVERY_MODES.POSTAL_SERVICE) && (
            <div className="border-l-4 border-blue-500 pl-4 space-y-4 bg-blue-50 p-4 rounded">
              <h4 className="font-medium text-sm text-blue-900">
                {formData.deliveryMode === DELIVERY_MODES.COURIER ? 'Courier' : 'Postal Service'} Details
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="courierNumber">
                  Tracking Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="courierNumber"
                  value={formData.courierNumber || ''}
                  onChange={(e) => setFormData({ ...formData, courierNumber: e.target.value })}
                  placeholder="e.g., ABC123456789"
                  className={errors.courierNumber ? 'border-red-500' : ''}
                />
                {errors.courierNumber && (
                  <p className="text-xs text-red-500">{errors.courierNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="courierCompany">
                  {formData.deliveryMode === DELIVERY_MODES.COURIER ? 'Courier' : 'Postal'} Company <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="courierCompany"
                  value={formData.courierCompany || ''}
                  onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                  placeholder="e.g., Blue Dart, DTDC, India Post, FedEx"
                  className={errors.courierCompany ? 'border-red-500' : ''}
                />
                {errors.courierCompany && (
                  <p className="text-xs text-red-500">{errors.courierCompany}</p>
                )}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional delivery information..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            <PackageCheck className="w-4 h-4 mr-2" />
            Confirm Delivery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDialog;
