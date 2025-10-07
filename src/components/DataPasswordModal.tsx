import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Shield, AlertCircle, Phone } from 'lucide-react';
import { verifyCompanyMasterPassword } from '@/lib/storage';

interface DataPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  action: 'export' | 'import' | 'clear';
}

const DataPasswordModal = ({ open, onClose, onSuccess, action }: DataPasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const getActionText = () => {
    switch (action) {
      case 'export':
        return 'export data';
      case 'import':
        return 'import data';
      case 'clear':
        return 'clear all data';
      default:
        return 'perform this action';
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'export':
        return '📤';
      case 'import':
        return '📥';
      case 'clear':
        return '🗑️';
      default:
        return '🔒';
    }
  };

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
            <Shield className="w-5 h-5 text-blue-600" />
            Data Security Verification
          </DialogTitle>
          <DialogDescription>
            Enter the master password to {getActionText()}. This protects sensitive business data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>Security Notice:</strong> Data management operations require master password verification to protect sensitive business information including customer data, financial records, and system configurations.
              </span>
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-4xl mb-2">{getActionIcon()}</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Requesting permission to: <span className="font-bold text-blue-600">{getActionText()}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataPassword">
              Master Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dataPassword"
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

          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-900 dark:text-green-100 text-sm">
                Need Help?
              </span>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mb-1">
              Contact Swaz Data Recovery Labs for master password assistance:
            </p>
            <p className="text-sm font-mono text-green-900 dark:text-green-100">
              +919701087446
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Lock className="w-4 h-4 mr-2" />
            Authorize {action === 'export' ? 'Export' : action === 'import' ? 'Import' : 'Clear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataPasswordModal;
