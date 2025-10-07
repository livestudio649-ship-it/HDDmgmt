import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Upload, Trash2, AlertTriangle, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { exportAllData, importData, clearAllData } from '@/lib/storage';
import DataPasswordModal from '@/components/DataPasswordModal';

const DataManagement = () => {
  const [importing, setImporting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'export' | 'import' | 'clear' | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const requestExport = () => {
    setPendingAction('export');
    setPasswordModalOpen(true);
  };

  const requestImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setPendingFile(file);
    setPendingAction('import');
    setPasswordModalOpen(true);
    
    // Reset the input
    event.target.value = '';
  };

  const requestClear = () => {
    setPendingAction('clear');
    setPasswordModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    setPasswordModalOpen(false);
    
    if (pendingAction === 'export') {
      handleExport();
    } else if (pendingAction === 'import' && pendingFile) {
      handleImport(pendingFile);
    } else if (pendingAction === 'clear') {
      handleClearAll();
    }
    
    // Reset pending states
    setPendingAction(null);
    setPendingFile(null);
  };

  const handlePasswordCancel = () => {
    setPasswordModalOpen(false);
    setPendingAction(null);
    setPendingFile(null);
  };

  const handleExport = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-recovery-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = (file: File) => {
    setImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importData(data);
        toast.success('Data imported successfully');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error('Invalid file format');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleClearAll = () => {
    clearAllData();
    toast.success('All data cleared');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Data Management</h2>
          <p className="text-muted-foreground">Export, import, and manage your data</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download all your data as a JSON file for backup purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Password Protected:</strong> Master password required to export sensitive business data.
                  </span>
                </p>
              </div>
              <Button onClick={requestExport}>
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload a previously exported JSON file to restore your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning-foreground flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Importing data will overwrite your existing data. Make sure to export your current data first.
                  </span>
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Password Protected:</strong> Master password required to import data and overwrite existing records.
                  </span>
                </p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={requestImport}
                  className="hidden"
                  id="import-file"
                />
                <Button asChild disabled={importing}>
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {importing ? 'Importing...' : 'Import Data'}
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Clear All Data
            </CardTitle>
            <CardDescription>
              Permanently delete all data from the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive-foreground flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    This action cannot be undone. All hard disk records, inward/outward records, and counters will be permanently deleted.
                  </span>
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Password Protected:</strong> Master password required to clear all business data permanently.
                  </span>
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all data including hard disk records, inward records, outward records, and all counters. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={requestClear} className="bg-destructive hover:bg-destructive/90">
                      Yes, delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Password Modal */}
        <DataPasswordModal
          open={passwordModalOpen}
          onClose={handlePasswordCancel}
          onSuccess={handlePasswordSuccess}
          action={pendingAction || 'export'}
        />
      </div>
    </DashboardLayout>
  );
};

export default DataManagement;
