import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Printer, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getHardDiskRecords, 
  generateNextEstimateNumber, 
  getTermsTemplates,
  saveGeneratedEstimate,
  getEstimateByJobId,
  updateInwardWithEstimate,
  InwardRecord 
} from '@/lib/storage';
import { useCompany } from '@/lib/company';
import { useToast } from '@/hooks/use-toast';
import { 
  numberToWords, 
  formatIndianDate, 
  formatCurrency, 
  formatIndianNumber,
  validateDocumentData 
} from '@/lib/formatters';
import { LogoImage } from '@/components/Logo';

interface EstimateDialogProps {
  record: InwardRecord;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const EstimateDialog = ({ record, open, onClose, onSave }: EstimateDialogProps) => {
  const [hardDisk, setHardDisk] = useState<any>(null);
  const [estimateNumber, setEstimateNumber] = useState('');
  const [baseAmount, setBaseAmount] = useState(0);
  const [diagnosticFee, setDiagnosticFee] = useState(500);
  const [manualAmount, setManualAmount] = useState<number | null>(record.manualAmount || null);
  const [customTerms, setCustomTerms] = useState('');
  const [validityDays, setValidityDays] = useState(30);

  // Calculate validity date dynamically based on validityDays
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + validityDays);
  const [isSaved, setIsSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const { company: companyDetails } = useCompany();
  const { toast } = useToast();
  const currentDate = new Date();

  useEffect(() => {
    if (open && record) {
      try {
        const hardDisks = getHardDiskRecords();
        const hd = hardDisks.find((h) => h.jobId === record.jobId);
        setHardDisk(hd);

        // Check if estimate already exists
        const existingEstimate = getEstimateByJobId(record.jobId);
        
        if (existingEstimate) {
          // Load existing estimate data
          setEstimateNumber(existingEstimate.estimateNumber);
          setBaseAmount(existingEstimate.baseAmount || 0);
          setDiagnosticFee(existingEstimate.diagnosticFee || 500);
          setManualAmount(existingEstimate.manualAmount || null);
          setValidityDays(existingEstimate.validityDays || 30);
          setCustomTerms(existingEstimate.customTerms || '');
          setIsSaved(true);
        } else {
          // Generate new estimate
          setEstimateNumber(generateNextEstimateNumber());
          setIsSaved(false);

          if (hd && hd.capacity) {
            try {
              const capacityValue = parseInt(hd.capacity);
              if (!isNaN(capacityValue)) {
                const baseRate = hd.capacity.includes('TB') ? capacityValue * 2000 : capacityValue * 2;
                setBaseAmount(baseRate);
              } else {
                setBaseAmount(5000); // Default amount if capacity parsing fails
              }
            } catch (error) {
              console.warn('Error parsing capacity:', hd.capacity, error);
              setBaseAmount(5000); // Default amount
            }
          } else {
            setBaseAmount(5000); // Default amount if no hard disk found
          }

          // Load default terms for estimate
          try {
            const templates = getTermsTemplates();
            const defaultTemplate = templates.find((t) => t.isDefault && t.name.includes('Estimate'));
            if (defaultTemplate) {
              setCustomTerms(defaultTemplate.content);
            }
          } catch (error) {
            console.warn('Error loading terms templates:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing estimate dialog:', error);
        toast({
          title: "Error",
          description: "Failed to load estimate data. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [open, record]);

  // Compute a scale factor so the A4 preview fits inside the dialog viewport
  useLayoutEffect(() => {
    if (!open) return;

    const computeScale = () => {
      try {
        const container = containerRef.current;
        const page = pageRef.current;
        if (!container || !page) return;

        // Convert mm to px using standard 96dpi conversion: 1in = 96px, 1in = 25.4mm
        const mmToPx = 96 / 25.4;
        const pageW = 210 * mmToPx; // 210mm
        const pageH = 297 * mmToPx; // 297mm

        const availableW = Math.max(100, container.clientWidth - 40); // padding allowance
        const availableH = Math.max(100, Math.min(window.innerHeight * 0.85, container.clientHeight || window.innerHeight) - 80);

        const newScale = Math.min(availableW / pageW, availableH / pageH, 1);
        setScale(Number(newScale.toFixed(3)));
      } catch (e) {
        // ignore
      }
    };

    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [open]);

  const subtotal = manualAmount !== null ? manualAmount : (baseAmount + diagnosticFee);
  const isInterState = hardDisk?.customerState && 
    hardDisk.customerState.toLowerCase() !== companyDetails.state.toLowerCase();
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = subtotal * 0.18;
  } else {
    cgst = subtotal * 0.09;
    sgst = subtotal * 0.09;
  }

  const totalGST = cgst + sgst + igst;
  const grandTotal = subtotal + totalGST;

  const handleSave = () => {
    try {
      // Validate data before saving
      const validation = validateDocumentData({
        invoiceNumber: estimateNumber,
        customerName: record.customerName,
        phoneNumber: record.phoneNumber,
        amount: subtotal,
        jobId: record.jobId,
      });

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast({
          title: "Validation Error",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      if (!hardDisk) {
        toast({
          title: "Error",
          description: "Hard disk information not found",
          variant: "destructive",
        });
        return;
      }

      const estimateData = {
        id: `${record.jobId}-${estimateNumber}`,
        estimateNumber,
        jobId: record.jobId,
        customerName: record.customerName,
        phoneNumber: record.phoneNumber,
        baseAmount,
        diagnosticFee,
        manualAmount,
        subtotal,
        cgst,
        sgst,
        igst,
        grandTotal,
        isInterState,
        validityDays,
        validUntilDate: validUntilDate.toISOString(),
        generatedDate: new Date().toISOString(),
        customTerms,
      };

      saveGeneratedEstimate(estimateData);
      
      // Update Inward record with estimate amount
      updateInwardWithEstimate(record.jobId, subtotal);
      
      setIsSaved(true);
      setValidationErrors([]);
      
      // Call parent refresh callback immediately
      if (onSave) {
        onSave();
      }
      
      // Additional refresh after delay to handle buffering
      setTimeout(() => {
        if (onSave) {
          onSave();
        }
      }, 200);
      
      toast({
        title: "Success",
        description: "Estimate saved and synced to Inward record",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save estimate",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!isSaved) {
      handleSave();
    }
    
    // Set document title for filename
    const originalTitle = document.title;
    const jobId = record.jobId || 'Unknown';
    const estimateNum = estimateNumber || 'Estimate';
    document.title = `${jobId}_${estimateNum}`;
    
    setTimeout(() => {
      window.print();
      // Restore original title after print
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
    <DialogContent ref={containerRef as any} className="max-w-6xl max-h-[90vh] overflow-y-auto print:max-w-full flex flex-col items-center">
        <DialogHeader className="print:hidden">
          <DialogTitle>Generate GST Estimate</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hard Disk Not Found Warning */}
          {!hardDisk && (
            <Alert variant="destructive" className="print:hidden">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Hard Disk Record not found for Job ID: {record.jobId}. Please ensure the Hard Disk Record exists before generating an estimate.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="print:hidden">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Input Fields - Hidden on Print */}
          <div className="space-y-4 print:hidden">
            <div className="space-y-2">
              <Label htmlFor="manualAmount">Manual Amount Override</Label>
              <Input
                id="manualAmount"
                type="number"
                value={manualAmount || ''}
                onChange={(e) => {
                  setManualAmount(e.target.value ? parseFloat(e.target.value) : null);
                  setIsSaved(false); // Allow re-saving after changes
                }}
                placeholder="Leave empty for automatic calculation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validityDays">Valid for (Days)</Label>
              <Input
                id="validityDays"
                type="number"
                value={validityDays}
                onChange={(e) => {
                  setValidityDays(parseInt(e.target.value) || 30);
                  setIsSaved(false); // Allow re-saving after changes
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customTerms">Terms & Conditions (Optional - Override Default)</Label>
              <Textarea
                id="customTerms"
                value={customTerms}
                onChange={(e) => {
                  setCustomTerms(e.target.value);
                  setIsSaved(false); // Allow re-saving after changes
                }}
                rows={4}
                placeholder="Enter custom terms or leave default..."
              />
            </div>
          </div>

          {/* A4 Print Area (preview) */}
          <div className="w-full flex justify-center">
            <div className="a4-scale-wrap" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
              <div ref={pageRef} id="estimate-print" className="bg-white text-black print:p-0" style={{ width: '210mm', padding: '15mm', boxSizing: 'border-box' }}>
                {/* Company Header with Logo */}
                <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
                  <LogoImage className="mx-auto mb-4 h-20" alt={`${companyDetails.companyName} Logo`} />
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{companyDetails.companyName || 'Company Name'}</h1>
                  <p className="text-sm text-gray-700 mt-2">{companyDetails.address || 'Address not provided'}</p>
                  <p className="text-sm text-gray-700">{companyDetails.state || 'State'} - {companyDetails.postalCode || 'PIN'}</p>
                  <div className="mt-3 text-sm text-gray-800">
                    <p className="font-medium">Phone: {companyDetails.phone || 'N/A'} | Email: {companyDetails.email || 'N/A'}</p>
                    <p className="font-bold mt-1">GSTIN: {companyDetails.gstin || 'GST Number not provided'}</p>
                  </div>
                </div>

                {/* Estimate Title */}
                <div className="text-center mb-6 bg-blue-800 text-white py-3 px-4 rounded">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">SERVICE ESTIMATE</h2>
                </div>

                {/* Very compact metadata row: 4 columns */}
                <div className="mb-4 bg-blue-50 p-2 rounded-lg">
                  <table className="w-full text-sm text-gray-800">
                    <tbody>
                      <tr>
                        <td className="py-1 pr-3 align-top w-1/4">
                          <div className="text-xs text-gray-600 uppercase">Estimate No</div>
                          <div className="font-bold text-sm mt-0.5">{estimateNumber || 'N/A'}</div>
                        </td>
                        <td className="py-1 px-3 align-top w-1/4 text-center">
                          <div className="text-xs text-gray-600 uppercase">Date</div>
                          <div className="font-bold text-sm mt-0.5">{formatIndianDate(currentDate)}</div>
                        </td>
                        <td className="py-1 px-3 align-top w-1/4 text-center">
                          <div className="text-xs text-gray-600 uppercase">Job / Ref</div>
                          <div className="font-bold text-sm mt-0.5">{hardDisk?.jobId || record.jobId || 'N/A'}</div>
                        </td>
                        <td className="py-1 pl-3 align-top w-1/4 text-right">
                          <div className="text-xs text-gray-600 uppercase">Valid Until</div>
                          <div className="font-bold text-sm mt-0.5">{formatIndianDate(validUntilDate)}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Separator className="my-8 bg-gray-400" />

                {/* More compact customer info: two columns inline to save space */}
                <div className="mb-4">
                  <div className="bg-blue-50 border-l-2 border-blue-800 p-2 rounded">
                    <div className="text-xs font-bold text-gray-900 mb-1 uppercase">Estimate For</div>
                    <table className="w-full text-sm text-gray-800">
                      <tbody>
                        <tr>
                          <td className="align-top py-0.5 w-3/5">
                            <div className="font-bold text-sm">{record.customerName || 'Customer Name'}</div>
                            <div className="text-xs text-gray-600">{hardDisk?.customerAddress || ''}</div>
                          </td>
                          <td className="align-top py-0.5 w-2/5 text-right">
                            <div className="text-xs text-gray-600">State</div>
                            <div className="font-medium text-sm">{hardDisk?.customerState || '-'}</div>
                            <div className="text-xs text-gray-600 mt-1">Phone</div>
                            <div className="font-medium text-sm">{record.phoneNumber || '-'}</div>
                          </td>
                        </tr>
                        <tr>
                          <td className="pt-1 text-xs text-gray-600" colSpan={2}>GSTIN: <span className="font-bold text-sm">{hardDisk?.customerGSTIN || 'Not provided'}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Service Details Table */}
                <div className="mb-8 overflow-hidden border border-gray-300 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="bg-blue-800 text-white">
                      <tr>
                        <th className="border border-gray-600 p-4 text-left text-sm font-bold w-12">S.No</th>
                        <th className="border border-gray-600 p-4 text-left text-sm font-bold">Description of Service</th>
                        <th className="border border-gray-600 p-4 text-left text-sm font-bold w-24">HSN/SAC</th>
                        <th className="border border-gray-600 p-4 text-right text-sm font-bold w-32">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {manualAmount === null ? (
                        <>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-4 text-sm font-medium">1</td>
                            <td className="border border-gray-300 p-4 text-sm">
                              <div className="space-y-1">
                                <p className="font-bold text-gray-900">Base Recovery Cost</p>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  Device: {hardDisk?.model || 'N/A'} {hardDisk?.capacity || ''}
                                </p>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-4 text-sm font-medium text-center">
                              {companyDetails.hsnCode || 'N/A'}
                            </td>
                            <td className="border border-gray-300 p-4 text-right text-sm font-bold">
                              {formatIndianNumber(baseAmount)}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-4 text-sm font-medium">2</td>
                            <td className="border border-gray-300 p-4 text-sm">
                              <p className="font-bold text-gray-900">Diagnostic Fee</p>
                            </td>
                            <td className="border border-gray-300 p-4 text-sm font-medium text-center">
                              {companyDetails.hsnCode || 'N/A'}
                            </td>
                            <td className="border border-gray-300 p-4 text-right text-sm font-bold">
                              {formatIndianNumber(diagnosticFee)}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-4 text-sm font-medium">1</td>
                          <td className="border border-gray-300 p-4 text-sm">
                            <div className="space-y-1">
                              <p className="font-bold text-gray-900">Data Recovery Service</p>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Device: {hardDisk?.model || 'N/A'} {hardDisk?.capacity || ''}
                              </p>
                              <p className="text-xs text-gray-600">
                                Serial Number: {hardDisk?.serialNumber || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-4 text-sm font-medium text-center">
                            {companyDetails.hsnCode || 'N/A'}
                          </td>
                          <td className="border border-gray-300 p-4 text-right text-sm font-bold">
                            {formatIndianNumber(manualAmount)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* GST Calculation */}
                <div className="flex justify-end mb-8">
                  <div className="w-96 border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        <tr className="bg-gray-50">
                          <td className="p-4 text-sm font-bold text-gray-800">Subtotal:</td>
                          <td className="p-4 text-right text-sm font-bold text-gray-900">
                            ₹ {formatIndianNumber(subtotal)}
                          </td>
                        </tr>
                        {isInterState ? (
                          <tr className="bg-white border-t border-gray-300">
                            <td className="p-4 text-sm text-gray-800">
                              <span className="font-semibold">IGST</span> (18%):
                            </td>
                            <td className="p-4 text-right text-sm text-gray-900 font-medium">
                              ₹ {formatIndianNumber(igst)}
                            </td>
                          </tr>
                        ) : (
                          <>
                            <tr className="bg-white border-t border-gray-300">
                              <td className="p-4 text-sm text-gray-800">
                                <span className="font-semibold">CGST</span> (9%):
                              </td>
                              <td className="p-4 text-right text-sm text-gray-900 font-medium">
                                ₹ {formatIndianNumber(cgst)}
                              </td>
                            </tr>
                            <tr className="bg-white border-t border-gray-300">
                              <td className="p-4 text-sm text-gray-800">
                                <span className="font-semibold">SGST</span> (9%):
                              </td>
                              <td className="p-4 text-right text-sm text-gray-900 font-medium">
                                ₹ {formatIndianNumber(sgst)}
                              </td>
                            </tr>
                          </>
                        )}
                        <tr className="border-t-2 border-blue-800 bg-blue-800 text-white">
                          <td className="p-4 text-lg font-bold">Estimated Total:</td>
                          <td className="p-4 text-right text-lg font-bold">
                            ₹ {formatIndianNumber(grandTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="mb-8 bg-blue-50 border border-gray-300 p-6 rounded-lg">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Estimated Amount in Words</p>
                  <p className="text-base text-gray-900 font-medium leading-relaxed">
                    Indian Rupees {numberToWords(grandTotal)} (Approximate)
                  </p>
                </div>

                {/* Important Notice */}
                <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg uppercase tracking-wide flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                    Important Notice
                  </h3>
                  <div className="space-y-2 text-sm text-gray-800">
                    <p><span className="font-semibold">Validity:</span> This estimate is valid until {formatIndianDate(validUntilDate)}</p>
                    <p><span className="font-semibold">Nature:</span> This is an estimate only. Final charges may vary based on actual service requirements and diagnostics.</p>
                    <p><span className="font-semibold">Acceptance:</span> Please confirm acceptance of this estimate to proceed with service.</p>
                  </div>
                </div>

                {/* Payment Information & Bank Details */}
                <div className="mb-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg uppercase tracking-wide">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
                    <div className="space-y-2">
                      <p><span className="font-semibold">Payment Terms:</span> 50% advance, balance on completion</p>
                      <p><span className="font-semibold">Accepted Methods:</span> Bank Transfer, UPI, Cheque</p>
                    </div>
                    {(companyDetails.bankAccountName || companyDetails.bankAccountNumber || companyDetails.bankName || companyDetails.bankIFSC) && (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Bank Details:</h4>
                        {companyDetails.bankAccountName && (
                          <p><span className="font-medium">Account Name:</span> {companyDetails.bankAccountName}</p>
                        )}
                        {companyDetails.bankAccountNumber && (
                          <p><span className="font-medium">Account Number:</span> {companyDetails.bankAccountNumber}</p>
                        )}
                        {companyDetails.bankName && (
                          <p><span className="font-medium">Bank Name:</span> {companyDetails.bankName}</p>
                        )}
                        {companyDetails.bankBranch && (
                          <p><span className="font-medium">Branch:</span> {companyDetails.bankBranch}</p>
                        )}
                        {companyDetails.bankIFSC && (
                          <p><span className="font-medium">IFSC Code:</span> {companyDetails.bankIFSC}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-3 italic">
                    Please include Estimate Number in payment reference.
                  </p>
                </div>

                {/* Terms & Conditions */}
                {customTerms && (
                  <div className="mb-8 border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-blue-800 text-white px-6 py-3">
                      <h3 className="font-bold text-lg uppercase tracking-wide">Terms & Conditions</h3>
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-6 leading-relaxed">
                      {customTerms}
                    </div>
                  </div>
                )}

                {/* Signature Section with Acceptance */}
                <div className="mt-16 mb-8">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Customer Acceptance</p>
                      <p className="text-xs text-gray-600 mb-8 italic">
                        I accept this estimate and authorize the work to proceed
                      </p>
                      <div className="border-t-2 border-gray-800 w-56 pt-2">
                        <p className="text-xs text-gray-600">Signature & Date</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs text-gray-600">Name: ___________________________</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 mb-2">For {companyDetails.companyName || 'Company'}</p>
                      <div className="border-t-2 border-gray-800 w-56 mt-16 ml-auto pt-2">
                        <p className="text-xs text-gray-600">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer / Compliance */}
                <div className="mt-8 pt-6 border-t-2 border-gray-300">
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-600 font-medium">
                      This is a computer-generated estimate and does not require a physical signature.
                    </p>
                    <p className="text-xs text-gray-500">
                      Subject to {companyDetails.state || 'jurisdiction'} jurisdiction only.
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-4">
                      Thank you for considering our services!
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Page 1 of 1
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="outline" onClick={handleSave} disabled={isSaved}>
              {isSaved ? 'Saved' : 'Save Estimate'}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              {isSaved ? 'Print Estimate' : 'Save & Print'}
            </Button>
          </div>
        </div>

        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            @page:blank {
              display: none !important;
            }
            
            /* Completely prevent page 2 */
            @page:nth(2) {
              display: none !important;
              size: 0 !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              page-break-inside: avoid !important;
              break-after: avoid !important;
              break-before: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Hide everything by default */
            html, body {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              overflow: visible !important;
            }
            
            /* Hide all body children */
            body > * {
              display: none !important;
            }
            
            /* Hide dialog overlay/backdrop */
            [data-radix-dialog-overlay],
            [role="dialog"] ~ div,
            .fixed.inset-0 {
              display: none !important;
            }
            
            /* Show and reset dialog container */
            [role="dialog"] {
              display: block !important;
              position: static !important;
              transform: none !important;
              -webkit-transform: none !important;
              left: auto !important;
              top: auto !important;
              max-width: none !important;
              width: 210mm !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              border: none !important;
              box-shadow: none !important;
              overflow: visible !important;
              animation: none !important;
            }
            
            /* Reset preview scaling wrapper */
            .a4-scale-wrap {
              display: block !important;
              transform: none !important;
              -webkit-transform: none !important;
              box-shadow: none !important;
              width: 210mm !important;
              height: auto !important;
            }
            
            /* Print content area - Ultra-compact for single page */
            #estimate-print {
              display: block !important;
              position: static !important;
              width: 210mm !important;
              padding: 8mm !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              font-size: 7pt !important;
              line-height: 1.0 !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              break-after: avoid !important;
              break-before: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
              max-height: 275mm !important;
              height: 275mm !important;
              contain: layout style paint !important;
            }
            
            /* Absolutely prevent any page breaks */
            #estimate-print,
            #estimate-print *,
            #estimate-print *:before,
            #estimate-print *:after {
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              page-break-inside: avoid !important;
              break-after: avoid !important;
              break-before: avoid !important;
              break-inside: avoid !important;
              orphans: 1000 !important;
              widows: 1000 !important;
            }
            
            /* Force all content to fit on page 1 */
            #estimate-print > * {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }
            
            /* Completely hide any overflow content */
            #estimate-print > *:last-child {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
              border-bottom: none !important;
            }
            
            /* Reset transforms on all print content */
            #estimate-print *,
            [role="dialog"] * {
              transform: none !important;
              -webkit-transform: none !important;
            }
            
            /* Reset positioning only on non-table elements */
            #estimate-print > *:not(table):not(tbody):not(tr):not(td):not(th) {
              position: relative !important;
            }
            
            /* Ensure all text colors are visible */
            #estimate-print,
            #estimate-print * {
              color: black !important;
            }
            
            #estimate-print .text-white {
              color: white !important;
            }
            
            #estimate-print .text-gray-900 {
              color: #111827 !important;
            }
            
            #estimate-print .text-gray-800 {
              color: #1f2937 !important;
            }
            
            #estimate-print .text-gray-700 {
              color: #374151 !important;
            }
            
            #estimate-print .text-gray-600 {
              color: #4b5563 !important;
            }
            
            #estimate-print .text-gray-500 {
              color: #6b7280 !important;
            }
            
            #estimate-print .text-yellow-600 {
              color: #ca8a04 !important;
            }
            
            /* Ensure backgrounds print */
            #estimate-print .bg-gray-50 {
              background-color: #f9fafb !important;
            }
            
            #estimate-print .bg-blue-50 {
              background-color: #eff6ff !important;
            }
            
            #estimate-print .bg-yellow-50 {
              background-color: #fefce8 !important;
            }
            
            #estimate-print .bg-blue-800 {
              background-color: #1e40af !important;
            }

            /* Images should not overflow - very small for print */
            #estimate-print img {
              max-width: 100% !important;
              max-height: 30px !important;
              height: auto !important;
            }
            
            /* Hide or minimize less critical elements */
            #estimate-print .space-y-2 > * + * {
              margin-top: 1pt !important;
            }
            
            #estimate-print .space-y-1 > * + * {
              margin-top: 0.5pt !important;
            }
            
            #estimate-print .leading-relaxed {
              line-height: 1.2 !important;
            }
            
            /* Ultra-compact spacing for print */
            #estimate-print .mb-8 {
              margin-bottom: 2pt !important;
            }
            
            #estimate-print .mb-6 {
              margin-bottom: 1.5pt !important;
            }
            
            #estimate-print .mb-4 {
              margin-bottom: 1pt !important;
            }
            
            #estimate-print .mb-3 {
              margin-bottom: 1pt !important;
            }
            
            #estimate-print .mb-2 {
              margin-bottom: 0.5pt !important;
            }
            
            #estimate-print .pb-6 {
              padding-bottom: 1pt !important;
            }
            
            #estimate-print .p-6 {
              padding: 1.5pt !important;
            }
            
            #estimate-print .p-4 {
              padding: 1pt !important;
            }
            
            #estimate-print .p-3 {
              padding: 1pt !important;
            }
            
            #estimate-print .p-2 {
              padding: 0.5pt !important;
            }
            
            #estimate-print .py-3 {
              padding-top: 1pt !important;
              padding-bottom: 1pt !important;
            }
            
            #estimate-print .px-4 {
              padding-left: 1pt !important;
              padding-right: 1pt !important;
            }
            
            #estimate-print .mt-16 {
              margin-top: 3pt !important;
            }
            
            #estimate-print .mt-8 {
              margin-top: 2pt !important;
            }
            
            #estimate-print .mt-4 {
              margin-top: 1pt !important;
            }
            
            #estimate-print .mt-3 {
              margin-top: 2pt !important;
            }
            
            #estimate-print .pt-6 {
              padding-top: 2pt !important;
            }
            
            #estimate-print .pt-2 {
              padding-top: 1pt !important;
            }
            
            #estimate-print .my-8 {
              margin-top: 3pt !important;
              margin-bottom: 3pt !important;
            }
            
            /* Ultra-compact typography */
            #estimate-print h1 {
              font-size: 14pt !important;
              margin-bottom: 1pt !important;
              line-height: 1.1 !important;
            }
            
            #estimate-print h2 {
              font-size: 11pt !important;
              margin-bottom: 1pt !important;
              line-height: 1.1 !important;
            }
            
            #estimate-print h3 {
              font-size: 9pt !important;
              margin-bottom: 2pt !important;
              line-height: 1.1 !important;
            }
            
            #estimate-print .text-4xl {
              font-size: 14pt !important;
            }
            
            #estimate-print .text-3xl {
              font-size: 11pt !important;
            }
            
            #estimate-print .text-2xl {
              font-size: 11pt !important;
            }
            
            #estimate-print .text-xl {
              font-size: 10pt !important;
            }
            
            #estimate-print .text-lg {
              font-size: 9pt !important;
            }
            
            #estimate-print .text-base {
              font-size: 8pt !important;
            }
            
            #estimate-print .text-sm {
              font-size: 7pt !important;
            }
            
            #estimate-print .text-xs {
              font-size: 6pt !important;
            }
            
            /* Reduce leading/line-height */
            #estimate-print p {
              line-height: 1.2 !important;
              margin-bottom: 2pt !important;
            }
            
            /* Print-friendly colors - replace dark backgrounds with borders */
            #estimate-print .bg-blue-800 {
              background-color: white !important;
              border: 2pt solid black !important;
              color: black !important;
            }
            
            #estimate-print .bg-blue-800 * {
              color: black !important;
            }
            
            #estimate-print .bg-blue-50 {
              background-color: white !important;
              border: 1pt solid #666 !important;
            }
            
            #estimate-print .bg-yellow-50 {
              background-color: white !important;
              border: 1pt solid #999 !important;
            }
            
            #estimate-print .bg-gray-50 {
              background-color: white !important;
            }
            
            /* Table header - print friendly */
            #estimate-print thead {
              background-color: white !important;
              border: 2pt solid black !important;
            }
            
            #estimate-print thead * {
              color: black !important;
              font-weight: bold !important;
            }
            
            #estimate-print .border-l-4 {
              border-left-width: 2pt !important;
            }
            
            #estimate-print .border-yellow-600 {
              border-color: #666 !important;
            }
            
            /* Ensure borders print */
            #estimate-print .border-gray-300 {
              border-color: #d1d5db !important;
            }
            
            #estimate-print .border-gray-600 {
              border-color: #4b5563 !important;
            }
            
            #estimate-print .border-gray-800 {
              border-color: #1f2937 !important;
            }
            
            #estimate-print .border-blue-800 {
              border-color: #1e40af !important;
            }
            
            #estimate-print .border-yellow-600 {
              border-color: #ca8a04 !important;
            }
            
            /* Prevent empty pages */
            #estimate-print::after {
              content: none !important;
              display: none !important;
            }
            
            /* Table styling */
            #estimate-print table {
              page-break-inside: auto !important;
            }
            
            #estimate-print tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }
            
            #estimate-print tbody {
              page-break-inside: auto !important;
            }
            
            /* Avoid breaking important sections */
            #estimate-print > div {
              page-break-inside: auto !important;
              page-break-after: auto !important;
            }
            
            /* Remove any extra height */
            #estimate-print * {
              max-height: none !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default EstimateDialog;
