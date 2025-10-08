import { useState, useEffect, useRef } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Star, Shield, Key, RotateCcw, Eye, EyeOff, Upload, CheckCircle2, Loader2, Download, AlertTriangle, Lock, Unlock, Edit3 } from 'lucide-react';
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
import { processCroppedLogo, validateImageFile, ProcessedLogo } from '@/lib/imageProcessor';
import { 
  getCompanyDetails, 
  saveCompanyDetails, 
  getTermsTemplates, 
  saveTermsTemplates,
  CompanyDetails,
  TermsTemplate,
  getAuthPassword,
  setAuthPassword as saveAuthPassword,
  resetAuthPassword,
  exportAllData,
  importData,
  clearAllData
} from '@/lib/storage';
import { useCompany } from '@/lib/company';
import MasterPasswordModal from '@/components/MasterPasswordModal';

const Settings = () => {
  const { company, setCompany } = useCompany();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(company || getCompanyDetails());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [srcImageUrl, setSrcImageUrl] = useState<string | null>(null);
  // use any for crop state as the Crop type may differ across package versions
  const [crop, setCrop] = useState<any>({ unit: '%', width: 80, aspect: 16 / 5, x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(companyDetails.logoBase64 || companyDetails.logoUrl || undefined);
  const [termsTemplates, setTermsTemplates] = useState<TermsTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedLogoInfo, setProcessedLogoInfo] = useState<ProcessedLogo | null>(null);
  
  // Password management state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Data Management security state
  const [isDataManagementUnlocked, setIsDataManagementUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [importing, setImporting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [clearConfirmText, setClearConfirmText] = useState('');
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  // Company Details protection state
  const [isCompanyDetailsUnlocked, setIsCompanyDetailsUnlocked] = useState(false);
  const [showMasterPasswordModal, setShowMasterPasswordModal] = useState(false);

  useEffect(() => {
    setTermsTemplates(getTermsTemplates());
  }, []);

  // Cleanup any object URLs when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      try {
        if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        if (srcImageUrl && srcImageUrl.startsWith('blob:')) URL.revokeObjectURL(srcImageUrl);
      } catch {}
    };
  }, [previewUrl, srcImageUrl]);

  const handleSaveCompany = () => {
    // Use context setCompany to persist and update app-wide
    setCompany(companyDetails);
    toast.success('Company details saved successfully');
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast.error('Please fill in both name and content');
      return;
    }

    const template: TermsTemplate = {
      id: Date.now(),
      name: newTemplate.name,
      content: newTemplate.content,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...termsTemplates, template];
    setTermsTemplates(updated);
    saveTermsTemplates(updated);
    setNewTemplate({ name: '', content: '' });
    toast.success('Template added successfully');
  };

  const handleDeleteTemplate = (id: number) => {
    const updated = termsTemplates.filter((t) => t.id !== id);
    setTermsTemplates(updated);
    saveTermsTemplates(updated);
    toast.success('Template deleted');
  };

  const handleSetDefault = (id: number) => {
    const updated = termsTemplates.map((t) => ({
      ...t,
      isDefault: t.id === id,
    }));
    setTermsTemplates(updated);
    saveTermsTemplates(updated);
    toast.success('Default template updated');
  };

  // Password management functions
  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const storedPassword = getAuthPassword();
    if (currentPassword !== storedPassword) {
      toast.error('Current password is incorrect');
      return;
    }

    saveAuthPassword(newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password changed successfully');
  };

  const handlePasswordReset = () => {
    resetAuthPassword();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password reset to default (admin123)');
  };

  // Data Management security handlers
  const handleUnlockDataManagement = () => {
    const storedPassword = getAuthPassword();
    if (adminPassword === storedPassword) {
      setIsDataManagementUnlocked(true);
      setAdminPassword('');
      toast.success('Data Management unlocked');
    } else {
      toast.error('Incorrect admin password');
    }
  };

  const handleLockDataManagement = () => {
    setIsDataManagementUnlocked(false);
    setAdminPassword('');
    setConfirmText('');
    setClearConfirmText('');
    toast.info('Data Management locked');
  };

  // Company Details protection handlers
  const handleUnlockCompanyDetails = () => {
    setShowMasterPasswordModal(true);
  };

  const handleMasterPasswordSuccess = () => {
    setIsCompanyDetailsUnlocked(true);
    setShowMasterPasswordModal(false);
    toast.success('Company details unlocked for editing');
  };

  const handleLockCompanyDetails = () => {
    setIsCompanyDetailsUnlocked(false);
    toast.info('Company details locked');
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (confirmText !== 'CONFIRM') {
      toast.error('Please type CONFIRM in the confirmation field');
      event.target.value = '';
      return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importData(data);
        toast.success('Data imported successfully. Page will reload...');
        setConfirmText('');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast.error('Invalid file format');
      } finally {
        setImporting(false);
        if (event.target) event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (clearConfirmText !== 'DELETE EVERYTHING') {
      toast.error('Please type DELETE EVERYTHING to confirm');
      return;
    }

    clearAllData();
    toast.success('All data cleared. Page will reload...');
    setClearConfirmText('');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground">Manage company details and templates</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6" onValueChange={(value) => {
          // Auto-lock Data Management when switching away from it
          if (value !== 'data-management' && isDataManagementUnlocked) {
            handleLockDataManagement();
          }
        }}>
          <TabsList>
            <TabsTrigger value="company">Company Details</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data-management" className="text-red-600 dark:text-red-400 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300">
              <Shield className="w-4 h-4 mr-2" />
              Data Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Company Information
                  {!isCompanyDetailsUnlocked && (
                    <Button onClick={handleUnlockCompanyDetails} variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                  )}
                </CardTitle>
                {!isCompanyDetailsUnlocked ? (
                  <CardDescription className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-600" />
                    Company details are protected. Click "Edit Details" to enter master password.
                  </CardDescription>
                ) : (
                  <CardDescription className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-green-600" />
                    Company details are unlocked for editing. Click "Lock Details" when finished.
                    <Button onClick={handleLockCompanyDetails} variant="outline" size="sm" className="ml-2">
                      <Lock className="w-4 h-4 mr-1" />
                      Lock Details
                    </Button>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyDetails.companyName}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, companyName: e.target.value })}
                      disabled={!isCompanyDetailsUnlocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN *</Label>
                    <Input
                      id="gstin"
                      value={companyDetails.gstin}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, gstin: e.target.value })}
                      placeholder="29ABCDE1234F1Z5"
                      disabled={!isCompanyDetailsUnlocked}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Registered Address *</Label>
                    <Textarea
                      id="address"
                      value={companyDetails.address}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })}
                      rows={2}
                      disabled={!isCompanyDetailsUnlocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={companyDetails.state}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, state: e.target.value })}
                      disabled={!isCompanyDetailsUnlocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={companyDetails.postalCode}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, postalCode: e.target.value })}
                      disabled={!isCompanyDetailsUnlocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={companyDetails.phone}
                      onChange={(e) => {
                        // Only allow numeric characters
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setCompanyDetails({ ...companyDetails, phone: numericValue });
                      }}
                      onKeyPress={(e) => {
                        // Prevent non-numeric characters from being typed
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Enter phone number (numbers only)"
                      maxLength={15}
                      disabled={!isCompanyDetailsUnlocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyDetails.email}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
                      disabled={!isCompanyDetailsUnlocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hsnCode">HSN/SAC Code *</Label>
                    <Input
                      id="hsnCode"
                      value={companyDetails.hsnCode}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, hsnCode: e.target.value })}
                      placeholder="998314"
                      disabled={!isCompanyDetailsUnlocked}
                    />
                  </div>

                  {/* Bank Details */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName">Bank Account Name</Label>
                      <Input
                        id="bankAccountName"
                        value={companyDetails.bankAccountName || ''}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, bankAccountName: e.target.value })}
                        placeholder="e.g., Data Recovery Lab"
                        disabled={!isCompanyDetailsUnlocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                      <Input
                        id="bankAccountNumber"
                        value={companyDetails.bankAccountNumber || ''}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, bankAccountNumber: e.target.value })}
                        placeholder="Enter account number"
                        disabled={!isCompanyDetailsUnlocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={companyDetails.bankName || ''}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, bankName: e.target.value })}
                        placeholder="e.g., State Bank of India"
                        disabled={!isCompanyDetailsUnlocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankBranch">Bank Branch</Label>
                      <Input
                        id="bankBranch"
                        value={companyDetails.bankBranch || ''}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, bankBranch: e.target.value })}
                        placeholder="Branch name"
                        disabled={!isCompanyDetailsUnlocked}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bankIFSC">IFSC Code</Label>
                      <Input
                        id="bankIFSC"
                        value={companyDetails.bankIFSC || ''}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, bankIFSC: e.target.value })}
                        placeholder="e.g., SBIN0000123"
                        disabled={!isCompanyDetailsUnlocked}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                    <Input
                      id="logoUrl"
                      value={companyDetails.logoUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCompanyDetails({ ...companyDetails, logoUrl: val });
                        setPreviewUrl(val || undefined);
                      }}
                      placeholder="https://example.com/logo.png"
                      disabled={!isCompanyDetailsUnlocked}
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Or upload a logo file. Auto-optimized to web standards (400x100px, &lt;200KB)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: PNG, JPEG, WebP. Max upload: 5MB. Generates optimized versions automatically.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          
                          // Validate file
                          const validation = validateImageFile(f);
                          if (!validation.valid) {
                            toast.error(validation.error || 'Invalid image file');
                            return;
                          }

                          // create object URL and open cropper; preview immediately
                          const url = URL.createObjectURL(f);
                          setSrcImageUrl(url);
                          setPreviewUrl(url);
                          // start with wide crop for logos
                          setCrop({ unit: '%', width: 80, aspect: 16 / 5, x: 10, y: 10 });
                        }}
                        disabled={!isCompanyDetailsUnlocked}
                      />

                        {/* Cropper Modal / Inline */}
                        {srcImageUrl && (
                          <div className="mt-4 space-y-2">
                            <div className="flex flex-col md:flex-row gap-4 items-start">
                              <div>
                                <ReactCrop
                                  crop={crop}
                                  onChange={(c) => setCrop(c)}
                                  onComplete={(c) => setCompletedCrop(c)}
                                >
                                  <img
                                    src={srcImageUrl}
                                    alt="To crop"
                                    ref={(el) => (imgRef.current = el)}
                                    style={{ maxWidth: '400px', maxHeight: '240px' }}
                                  />
                                </ReactCrop>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="text-sm text-muted-foreground max-w-xs space-y-2">
                                  <p>Use the crop box to select the visible area of the logo. Aim for aspect ratio around 4:1 (wide).</p>
                                  <p className="text-xs font-medium text-foreground">Auto-processing will:</p>
                                  <ul className="text-xs space-y-1 list-disc list-inside">
                                    <li>Optimize to 400x100px (or maintain ratio)</li>
                                    <li>Generate 2x retina version</li>
                                    <li>Compress to &lt;200KB</li>
                                    <li>Convert to optimal format (WebP/PNG)</li>
                                  </ul>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={async () => {
                                      try {
                                        if (!imgRef.current || !completedCrop) {
                                          toast.error('Please select a crop area');
                                          return;
                                        }
                                        
                                        setIsProcessing(true);
                                        toast.info('Processing logo... This may take a moment');
                                        
                                        // Use the new image processor
                                        const processed = await processCroppedLogo(
                                          imgRef.current,
                                          {
                                            x: completedCrop.x || 0,
                                            y: completedCrop.y || 0,
                                            width: completedCrop.width || 0,
                                            height: completedCrop.height || 0,
                                          },
                                          {
                                            targetWidth: 400,
                                            maxFileSizeKB: 200,
                                            quality: 0.9,
                                            generateRetina: true,
                                            format: 'auto',
                                          }
                                        );
                                        
                                        setProcessedLogoInfo(processed);
                                        setCompanyDetails({ ...companyDetails, logoBase64: processed.primary, logoUrl: undefined });
                                        setPreviewUrl(processed.primary);
                                        
                                        // release object URL
                                        try { if (srcImageUrl) URL.revokeObjectURL(srcImageUrl); } catch {}
                                        setSrcImageUrl(null);
                                        
                                        const sizeReduction = ((1 - processed.processedSize / processed.originalSize) * 100).toFixed(1);
                                        toast.success(
                                          `Logo optimized! ${processed.dimensions.width}x${processed.dimensions.height}px, ` +
                                          `${(processed.processedSize / 1024).toFixed(1)}KB (${sizeReduction}% smaller). ` +
                                          `Format: ${processed.format.toUpperCase()}. Remember to Save!`
                                        );
                                      } catch (err) {
                                        console.error('Logo processing error:', err);
                                        toast.error('Failed to process logo. Please try a different image.');
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing || !isCompanyDetailsUnlocked}
                                  >
                                    {isProcessing ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Apply & Optimize
                                      </>
                                    )}
                                  </Button>
                                  <Button variant="outline" onClick={() => {
                                    try { if (srcImageUrl && srcImageUrl.startsWith('blob:')) URL.revokeObjectURL(srcImageUrl); } catch {}
                                    setSrcImageUrl(null);
                                    // clear immediate preview if it was the blob
                                    setPreviewUrl(undefined);
                                  }}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {(previewUrl || companyDetails.logoBase64 || companyDetails.logoUrl) ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-16 bg-white rounded-md border flex items-center justify-center overflow-hidden">
                              <img
                                src={previewUrl || companyDetails.logoBase64 || companyDetails.logoUrl}
                                alt="logo-preview"
                                className="object-contain w-full h-full"
                                onError={() => {
                                  toast.error('Cannot render preview for this image. Try a different file or use a URL.');
                                  setPreviewUrl(undefined);
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCompanyDetails({ ...companyDetails, logoBase64: undefined, logoUrl: undefined });
                                  setPreviewUrl(undefined);
                                  setProcessedLogoInfo(null);
                                }}
                              >
                                Remove
                              </Button>
                              {processedLogoInfo && (
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  <p className="font-medium text-green-600">✓ Optimized</p>
                                  <p>{processedLogoInfo.dimensions.width}x{processedLogoInfo.dimensions.height}px</p>
                                  <p>{(processedLogoInfo.processedSize / 1024).toFixed(1)}KB • {processedLogoInfo.format.toUpperCase()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveCompany} className="w-full md:w-auto" disabled={!isCompanyDetailsUnlocked}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Company Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Invoice Terms, Estimate Terms"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateContent">Terms & Conditions</Label>
                  <Textarea
                    id="templateContent"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    rows={6}
                    placeholder="Enter terms and conditions..."
                  />
                </div>
                <Button onClick={handleAddTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {termsTemplates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No templates saved yet</p>
                ) : (
                  termsTemplates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          {template.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefault(template.id)}
                            disabled={template.isDefault}
                          >
                            Set Default
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <Button onClick={handlePasswordChange} className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Reset Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-md">
                  <p className="text-sm text-muted-foreground">
                    Reset your password to the default value. This will set your password back to <strong>admin123</strong>.
                  </p>
                  <Button onClick={handlePasswordReset} variant="destructive" className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data-management" className="space-y-6">
            {!isDataManagementUnlocked ? (
              <Card className="border-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
                    Admin Authentication Required
                  </CardTitle>
                  <CardDescription>
                    This section contains dangerous operations that can modify or delete all system data. 
                    Please enter your admin password to continue.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-sm text-red-900 dark:text-red-100 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                      <span>
                        <strong>Warning:</strong> Data Management operations can permanently modify or delete all records, 
                        including hard disk entries, inward/outward records, and system counters. 
                        These actions may be irreversible.
                      </span>
                    </p>
                  </div>
                  <div className="max-w-md space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">Admin Password</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUnlockDataManagement();
                        }}
                        placeholder="Enter admin password"
                      />
                    </div>
                    <Button onClick={handleUnlockDataManagement} className="w-full">
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlock Data Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Data Management</h3>
                    <p className="text-sm text-muted-foreground">Export, import, and manage your system data</p>
                  </div>
                  <Button onClick={handleLockDataManagement} variant="outline" size="sm">
                    <Lock className="w-4 h-4 mr-2" />
                    Lock Section
                  </Button>
                </div>

                {/* Export Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Export Data
                    </CardTitle>
                    <CardDescription>
                      Download all your data as a JSON file for backup purposes. This is a safe operation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export All Data
                    </Button>
                  </CardContent>
                </Card>

                {/* Import Data */}
                <Card className="border-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <Upload className="w-5 h-5" />
                      Import Data
                    </CardTitle>
                    <CardDescription>
                      Upload a previously exported JSON file to restore your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-300 dark:border-orange-700 rounded-lg">
                      <p className="text-sm text-orange-900 dark:text-orange-100 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                        <span>
                          <strong>Warning:</strong> Importing data will overwrite your existing data. 
                          Make sure to export your current data first as a backup.
                        </span>
                      </p>
                    </div>
                    
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="importConfirmText">
                          Type <strong>CONFIRM</strong> to enable import
                        </Label>
                        <Input
                          id="importConfirmText"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                          placeholder="Type CONFIRM"
                          className={confirmText === 'CONFIRM' ? 'border-green-500' : ''}
                        />
                      </div>
                      
                      <div>
                        <input
                          ref={importFileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="hidden"
                          id="import-file"
                        />
                        <Button 
                          asChild 
                          disabled={importing || confirmText !== 'CONFIRM'}
                          variant={confirmText === 'CONFIRM' ? 'default' : 'secondary'}
                        >
                          <label htmlFor="import-file" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            {importing ? 'Importing...' : 'Import Data'}
                          </label>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Clear All Data */}
                <Card className="border-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <Trash2 className="w-5 h-5" />
                      Clear All Data
                    </CardTitle>
                    <CardDescription>
                      Permanently delete all data from the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg">
                      <p className="text-sm text-red-900 dark:text-red-100 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                        <span>
                          <strong>DANGER:</strong> This action cannot be undone. All hard disk records, 
                          inward/outward records, invoices, estimates, and counters will be permanently deleted. 
                          There is no way to recover this data.
                        </span>
                      </p>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="clearConfirmText" className="text-red-700 dark:text-red-400 font-semibold">
                          Type <strong>DELETE EVERYTHING</strong> to confirm deletion
                        </Label>
                        <Input
                          id="clearConfirmText"
                          value={clearConfirmText}
                          onChange={(e) => setClearConfirmText(e.target.value.toUpperCase())}
                          placeholder="Type DELETE EVERYTHING"
                          className={clearConfirmText === 'DELETE EVERYTHING' ? 'border-red-500 focus:ring-red-500' : ''}
                        />
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            disabled={clearConfirmText !== 'DELETE EVERYTHING'}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All Data
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all data including:
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>All hard disk records</li>
                                <li>All inward and outward records</li>
                                <li>All generated invoices and estimates</li>
                                <li>All job, invoice, and estimate counters</li>
                                <li>Master customer database</li>
                              </ul>
                              <p className="mt-2 font-bold text-red-700 dark:text-red-400">
                                This action cannot be undone. Make sure you have exported your data first.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setClearConfirmText('')}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleClearAll} 
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Yes, delete everything
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Master Password Modal for Company Details */}
      <MasterPasswordModal
        open={showMasterPasswordModal}
        onClose={() => setShowMasterPasswordModal(false)}
        onSuccess={handleMasterPasswordSuccess}
      />
    </DashboardLayout>
  );
};

export default Settings;
