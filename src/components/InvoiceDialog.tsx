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
  generateNextInvoiceNumber,
  getTermsTemplates,
  saveGeneratedInvoice,
  getInvoiceByJobId,
  getInwardRecords,
  getEstimateByJobId,
  OutwardRecord
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

interface InvoiceDialogProps {
  record: OutwardRecord;
  open: boolean;
  onClose: () => void;
  onPrint?: () => void;
}

const InvoiceDialog = ({ record, open, onClose }: InvoiceDialogProps) => {
  const [hardDisk, setHardDisk] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState(5000);
  const [customTerms, setCustomTerms] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { company: companyDetails } = useCompany();
  const { toast } = useToast();
  const currentDate = new Date();

  useEffect(() => {
    if (open) {
      const hardDisks = getHardDiskRecords();
      const hd = hardDisks.find((h) => h.jobId === record.jobId);
      setHardDisk(hd);

      // Check if invoice already exists
      const existingInvoice = getInvoiceByJobId(record.jobId);
      
      if (existingInvoice) {
        // Load existing invoice data
        setInvoiceNumber(existingInvoice.invoiceNumber);
        setAmount(existingInvoice.amount);
        setCustomTerms(existingInvoice.customTerms || '');
        setIsSaved(true);
      } else {
        // Generate new invoice
        setInvoiceNumber(generateNextInvoiceNumber());
        setIsSaved(false);

        // Check if estimate exists and use its amount
        const existingEstimate = getEstimateByJobId(record.jobId);
        if (existingEstimate) {
          // Use the subtotal from the estimate (amount before GST)
          setAmount(existingEstimate.subtotal);
        } else {
          // Fallback: check inward records for manual amount
          const inwardRecords = getInwardRecords();
          const inward = inwardRecords.find((i) => i.jobId === record.jobId);
          if (inward?.manualAmount) {
            setAmount(inward.manualAmount);
          }
        }

        // Load default terms for invoice
        const templates = getTermsTemplates();
        const defaultTemplate = templates.find((t) => t.isDefault && t.name.includes('Invoice'));
        if (defaultTemplate) {
          setCustomTerms(defaultTemplate.content);
        }
      }
    }
  }, [open, record]);

  const subtotal = amount;
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
        invoiceNumber,
        customerName: record.customerName,
        phoneNumber: record.phoneNumber,
        amount,
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

      const invoiceData = {
        id: `${record.jobId}-${invoiceNumber}`,
        invoiceNumber,
        jobId: record.jobId,
        customerName: record.customerName,
        phoneNumber: record.phoneNumber,
        amount,
        subtotal,
        cgst,
        sgst,
        igst,
        grandTotal,
        isInterState,
        generatedDate: new Date().toISOString(),
        customTerms,
      };

      // Save or update the invoice in the database
      saveGeneratedInvoice(invoiceData);
      setIsSaved(true);
      setValidationErrors([]);
      
      toast({
        title: "Success",
        description: "Invoice saved successfully and persisted to database",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!isSaved) {
      handleSave();
    }
    setTimeout(() => window.print(), 100);
  };

  if (!hardDisk) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full">
        <DialogHeader className="print:hidden">
          <DialogTitle>Generate GST Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Amount and Terms Input - Hidden on Print */}
          <div className="space-y-4 print:hidden">
            <div className="space-y-2">
              <Label htmlFor="amount">Service Amount (before GST)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(parseFloat(e.target.value) || 0);
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

          {/* A4 Print Area */}
          <div id="invoice-print" className="bg-white text-black print:p-0" style={{ width: '210mm', padding: '20mm', boxSizing: 'border-box' }}>
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

            {/* Invoice Title */}
            <div className="text-center mb-6 bg-gray-800 text-white py-3 px-4 rounded">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">TAX INVOICE</h2>
            </div>

            {/* Very compact invoice metadata row (4 columns) */}
            <div className="mb-4 bg-gray-50 p-2 rounded-lg">
              <table className="w-full text-sm text-gray-800">
                <tbody>
                  <tr>
                    <td className="py-1 pr-2 align-top w-1/4">
                      <div className="text-xs text-gray-600 uppercase">Invoice No</div>
                      <div className="font-bold text-sm">{invoiceNumber || 'N/A'}</div>
                    </td>
                    <td className="py-1 px-1 align-top w-1/4 text-center">
                      <div className="text-xs text-gray-600 uppercase">Date</div>
                      <div className="font-bold text-sm">{formatIndianDate(currentDate)}</div>
                    </td>
                    <td className="py-1 px-1 align-top w-1/4 text-center">
                      <div className="text-xs text-gray-600 uppercase">Job / Ref</div>
                      <div className="font-bold text-sm">{hardDisk?.jobId || record.jobId || 'N/A'}</div>
                    </td>
                    <td className="py-1 pl-2 align-top w-1/4 text-right">
                      <div className="text-xs text-gray-600 uppercase">Supply</div>
                      <div className="font-bold text-sm">{hardDisk?.customerState || companyDetails.state || 'N/A'}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Separator className="my-8 bg-gray-400" />

            {/* More compact Bill To section */}
            <div className="mb-4">
              <div className="bg-gray-100 border-l-2 border-gray-800 p-2 rounded">
                <div className="text-xs font-bold text-gray-900 mb-1 uppercase">Bill To</div>
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
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="border border-gray-600 p-4 text-left text-sm font-bold w-12">S.No</th>
                    <th className="border border-gray-600 p-4 text-left text-sm font-bold">Description of Service</th>
                    <th className="border border-gray-600 p-4 text-left text-sm font-bold w-24">HSN/SAC</th>
                    <th className="border border-gray-600 p-4 text-right text-sm font-bold w-16">Qty</th>
                    <th className="border border-gray-600 p-4 text-right text-sm font-bold w-32">Rate (₹)</th>
                    <th className="border border-gray-600 p-4 text-right text-sm font-bold w-32">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
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
                        <p className="text-xs text-gray-600">
                          Job ID: {hardDisk?.jobId || record.jobId || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-4 text-sm font-medium text-center">
                      {companyDetails.hsnCode || 'N/A'}
                    </td>
                    <td className="border border-gray-300 p-4 text-right text-sm font-medium">1</td>
                    <td className="border border-gray-300 p-4 text-right text-sm font-medium">
                      {formatIndianNumber(subtotal)}
                    </td>
                    <td className="border border-gray-300 p-4 text-right text-sm font-bold text-gray-900">
                      {formatIndianNumber(subtotal)}
                    </td>
                  </tr>
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
                    <tr className="border-t-2 border-gray-800 bg-gray-800 text-white">
                      <td className="p-4 text-lg font-bold">Grand Total:</td>
                      <td className="p-4 text-right text-lg font-bold">
                        ₹ {formatIndianNumber(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="mb-8 bg-gray-100 border border-gray-300 p-6 rounded-lg">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Amount in Words</p>
              <p className="text-base text-gray-900 font-medium leading-relaxed">
                Indian Rupees {numberToWords(grandTotal)}
              </p>
            </div>

            {/* Payment Terms & Bank Details */}
            <div className="mb-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
              <h3 className="font-bold text-gray-900 mb-3 text-lg uppercase tracking-wide">Payment Information</h3>
              <div className="space-y-2 text-sm text-gray-800">
                <p><span className="font-semibold">Payment Terms:</span> Due within 30 days from invoice date</p>
                <p><span className="font-semibold">Accepted Methods:</span> Bank Transfer, UPI, Cheque</p>
                <p className="text-xs text-gray-600 mt-3 italic">
                  Bank details will be shared upon request. Please include Invoice Number in payment reference.
                </p>
              </div>
            </div>

            {/* Terms & Conditions */}
            {customTerms && (
              <div className="mb-8 border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-800 text-white px-6 py-3">
                  <h3 className="font-bold text-lg uppercase tracking-wide">Terms & Conditions</h3>
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-6 leading-relaxed">
                  {customTerms}
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="mt-16 mb-8 grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Customer Acknowledgment</p>
                <div className="border-t-2 border-gray-800 w-56 mt-16 pt-2">
                  <p className="text-xs text-gray-600">Signature & Date</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 mb-2">For {companyDetails.companyName || 'Company'}</p>
                <div className="border-t-2 border-gray-800 w-56 mt-16 ml-auto pt-2">
                  <p className="text-xs text-gray-600">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Footer / Compliance */}
            <div className="mt-8 pt-6 border-t-2 border-gray-300">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-600 font-medium">
                  This is a computer-generated invoice and does not require a physical signature.
                </p>
                <p className="text-xs text-gray-500">
                  Subject to {companyDetails.state || 'jurisdiction'} jurisdiction only.
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-4">
                  Thank you for your business!
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Page 1 of 1
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="outline" onClick={handleSave} disabled={isSaved}>
              {isSaved ? 'Saved' : 'Save Invoice'}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              {isSaved ? 'Print Invoice' : 'Save & Print'}
            </Button>
          </div>
        </div>

        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
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
            
            /* Print content area - Ultra-compact for single page */
            #invoice-print {
              display: block !important;
              position: static !important;
              width: 210mm !important;
              height: auto !important;
              max-width: 210mm !important;
              padding: 8mm 12mm !important;
              margin: 0 !important;
              background: white !important;
              color: black !important;
              box-sizing: border-box !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              transform: none !important;
              -webkit-transform: none !important;
              font-size: 8pt !important;
              line-height: 1.2 !important;
              overflow: hidden !important;
            }
            
            /* Reset transforms on all print content */
            #invoice-print *,
            [role="dialog"] * {
              transform: none !important;
              -webkit-transform: none !important;
            }
            
            /* Reset positioning only on non-table elements */
            #invoice-print > *:not(table):not(tbody):not(tr):not(td):not(th) {
              position: relative !important;
            }
            
            /* Ensure all text colors are visible */
            #invoice-print,
            #invoice-print * {
              color: black !important;
            }
            
            #invoice-print .text-white {
              color: white !important;
            }
            
            #invoice-print .text-gray-900 {
              color: #111827 !important;
            }
            
            #invoice-print .text-gray-800 {
              color: #1f2937 !important;
            }
            
            #invoice-print .text-gray-700 {
              color: #374151 !important;
            }
            
            #invoice-print .text-gray-600 {
              color: #4b5563 !important;
            }
            
            #invoice-print .text-gray-500 {
              color: #6b7280 !important;
            }
            
            /* Ensure backgrounds print */
            #invoice-print .bg-gray-50 {
              background-color: #f9fafb !important;
            }
            
            #invoice-print .bg-gray-100 {
              background-color: #f3f4f6 !important;
            }
            
            #invoice-print .bg-gray-800 {
              background-color: #1f2937 !important;
            }
            
            #invoice-print .bg-blue-50 {
              background-color: #eff6ff !important;
            }
            
            /* Ensure borders print */
            #invoice-print .border-gray-300 {
              border-color: #d1d5db !important;
            }
            
            #invoice-print .border-gray-400 {
              border-color: #9ca3af !important;
            }
            
            #invoice-print .border-gray-600 {
              border-color: #4b5563 !important;
            }
            
            #invoice-print .border-gray-800 {
              border-color: #1f2937 !important;
            }
            
            #invoice-print .border-blue-600 {
              border-color: #2563eb !important;
            }

            /* Images should not overflow - very small for print */
            #invoice-print img {
              max-width: 100% !important;
              max-height: 30px !important;
              height: auto !important;
            }
            
            /* Hide or minimize less critical elements */
            #invoice-print .space-y-2 > * + * {
              margin-top: 1pt !important;
            }
            
            #invoice-print .space-y-1 > * + * {
              margin-top: 0.5pt !important;
            }
            
            #invoice-print .leading-relaxed {
              line-height: 1.2 !important;
            }
            
            /* Ultra-compact spacing for print */
            #invoice-print .mb-8 {
              margin-bottom: 4pt !important;
            }
            
            #invoice-print .mb-6 {
              margin-bottom: 3pt !important;
            }
            
            #invoice-print .mb-4 {
              margin-bottom: 2pt !important;
            }
            
            #invoice-print .mb-3 {
              margin-bottom: 2pt !important;
            }
            
            #invoice-print .mb-2 {
              margin-bottom: 1pt !important;
            }
            
            #invoice-print .pb-6 {
              padding-bottom: 2pt !important;
            }
            
            #invoice-print .p-6 {
              padding: 3pt !important;
            }
            
            #invoice-print .p-4 {
              padding: 2pt !important;
            }
            
            #invoice-print .p-3 {
              padding: 2pt !important;
            }
            
            #invoice-print .p-2 {
              padding: 1pt !important;
            }
            
            #invoice-print .py-3 {
              padding-top: 2pt !important;
              padding-bottom: 2pt !important;
            }
            
            #invoice-print .px-4 {
              padding-left: 2pt !important;
              padding-right: 2pt !important;
            }
            
            #invoice-print .mt-16 {
              margin-top: 6pt !important;
            }
            
            #invoice-print .mt-8 {
              margin-top: 3pt !important;
            }
            
            #invoice-print .mt-4 {
              margin-top: 2pt !important;
            }
            
            #invoice-print .mt-3 {
              margin-top: 2pt !important;
            }
            
            #invoice-print .pt-6 {
              padding-top: 2pt !important;
            }
            
            #invoice-print .pt-2 {
              padding-top: 1pt !important;
            }
            
            #invoice-print .my-8 {
              margin-top: 3pt !important;
              margin-bottom: 3pt !important;
            }
            
            /* Ultra-compact typography */
            #invoice-print h1 {
              font-size: 14pt !important;
              margin-bottom: 1pt !important;
              line-height: 1.1 !important;
            }
            
            #invoice-print h2 {
              font-size: 11pt !important;
              margin-bottom: 1pt !important;
              line-height: 1.1 !important;
            }
            
            #invoice-print h3 {
              font-size: 9pt !important;
              margin-bottom: 2pt !important;
              line-height: 1.1 !important;
            }
            
            #invoice-print .text-4xl {
              font-size: 14pt !important;
            }
            
            #invoice-print .text-3xl {
              font-size: 11pt !important;
            }
            
            #invoice-print .text-2xl {
              font-size: 11pt !important;
            }
            
            #invoice-print .text-xl {
              font-size: 10pt !important;
            }
            
            #invoice-print .text-lg {
              font-size: 9pt !important;
            }
            
            #invoice-print .text-base {
              font-size: 8pt !important;
            }
            
            #invoice-print .text-sm {
              font-size: 7pt !important;
            }
            
            #invoice-print .text-xs {
              font-size: 6pt !important;
            }
            
            /* Reduce leading/line-height */
            #invoice-print p {
              line-height: 1.2 !important;
              margin-bottom: 2pt !important;
            }
            
            /* Print-friendly colors - replace dark backgrounds with borders */
            #invoice-print .bg-gray-800 {
              background-color: white !important;
              border: 2pt solid black !important;
              color: black !important;
            }
            
            #invoice-print .bg-gray-800 * {
              color: black !important;
            }
            
            #invoice-print .bg-blue-50 {
              background-color: white !important;
              border: 1pt solid #666 !important;
            }
            
            #invoice-print .bg-gray-100 {
              background-color: white !important;
              border: 1pt solid #999 !important;
            }
            
            #invoice-print .bg-gray-50 {
              background-color: white !important;
            }
            
            /* Table header - print friendly */
            #invoice-print thead {
              background-color: white !important;
              border: 2pt solid black !important;
            }
            
            #invoice-print thead * {
              color: black !important;
              font-weight: bold !important;
            }
            
            #invoice-print .border-l-4 {
              border-left-width: 2pt !important;
            }
            
            /* Prevent empty pages */
            #invoice-print::after {
              content: none !important;
              display: none !important;
            }
            
            /* Table styling */
            #invoice-print table {
              page-break-inside: auto !important;
            }
            
            #invoice-print tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }
            
            #invoice-print tbody {
              page-break-inside: auto !important;
            }
            
            /* Avoid breaking important sections */
            #invoice-print > div {
              page-break-inside: auto !important;
              page-break-after: auto !important;
            }
            
            /* Remove any extra height */
            #invoice-print * {
              max-height: none !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;
