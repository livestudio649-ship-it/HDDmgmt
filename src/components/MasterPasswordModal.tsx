import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Phone, AlertCircle } from 'lucide-react';
import { verifyCompanyMasterPassword } from '@/lib/storage';

interface MasterPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MasterPasswordModal = ({ open, onClose, onSuccess }: MasterPasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!password) {
      setError('Please enter the master password');
      return;
    }

    if (verifyCompanyMasterPassword(password)) {
      setPassword('');
      setError('');
      onSuccess();
    } else {
      setError('Incorrect master password');
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-600" />
            Master Password Required
          </DialogTitle>
          <DialogDescription>
            Enter the master password to edit company details. This protects sensitive business information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-300 dark:border-orange-700 rounded-lg">
            <p className="text-sm text-orange-900 dark:text-orange-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
              <span>
                <strong>Security Notice:</strong> Company details contain sensitive business information including GSTIN, bank details, and contact information.
                Only authorized personnel should have access to modify these details.
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="masterPassword">
              Master Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="masterPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter master password"
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                Need Help?
              </span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
              Contact Swaz Data Recovery Labs for master password assistance:
            </p>
            <p className="text-sm font-mono text-blue-900 dark:text-blue-100">
              +919701087446
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
            <Lock className="w-4 h-4 mr-2" />
            Unlock Company Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MasterPasswordModal;
