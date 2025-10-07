# Testing Guide - Data Restore Hub v2.0

## 🧪 Quick Testing Checklist

This guide helps you verify all the new features work correctly.

## Test Scenario 1: End-to-End Job Flow

### Step 1: Create Job in Hard Disks
1. Navigate to **Hard Disks** page
2. Fill in the form with test data:
   - Serial Number: `TEST12345`
   - Model: `WD` (from dropdown)
   - Capacity: `1TB` (from dropdown)
   - Customer Name: `John Doe`
   - Phone: `9876543210`
   - **Estimated Amount: `5000`** ✨ NEW
   - **Estimated Delivery Date: Select future date** ✨ NEW
   - Customer State: `Karnataka`
3. Click "Add Record"
4. **✅ Expected**: Toast notification says "added successfully and synced to Inward"

### Step 2: Verify Auto-Sync to Inward
1. Navigate to **Inward** page
2. **✅ Expected**: See the job automatically created
   - Job ID matches
   - Customer name correct
   - **Estimated Amount displays** ✨ NEW
   - **Estimated Delivery Date displays** ✨ NEW
   - **Status shows "Pending" badge** ✨ NEW

### Step 3: Edit Record in Dashboard
1. Go back to **Hard Disks** page
2. Click the **Edit** icon (pencil) on the record ✨ NEW
3. Change Estimated Amount to `6000`
4. Click **Save** icon (checkmark) ✨ NEW
5. Navigate to **Inward** page
6. **✅ Expected**: Amount updated to 6000

### Step 4: Generate Estimate
1. In **Inward** page, click "Estimate" button
2. Adjust Manual Amount Override if needed
3. Click "Save Estimate"
4. **✅ Expected**: Toast says "saved and synced to Inward record" ✨ NEW
5. Click "Print Estimate" to verify formatting

### Step 5: Create Outward Entry
1. Navigate to **Outward** page
2. Create new outward record:
   - Select Job ID from dropdown
   - Date: Today
   - Delivered To: `John Doe`
   - **Delivery Mode: `Hand Delivery`** ✨ NEW (from dropdown)
   - Notes: `Test delivery`
3. Click "Add Outward Record"
4. **✅ Expected**: Record appears with **"In Progress" badge** ✨ NEW

### Step 6: Mark as Delivered
1. In **Outward** page, find the record
2. Click **"Mark Delivered"** button ✨ NEW
3. Confirm the dialog
4. **✅ Expected**: 
   - Status changes to **"Completed" badge (green)** ✨ NEW
   - Row background turns green
   - Button disappears

### Step 7: Verify Inward Update
1. Navigate to **Inward** page
2. **✅ Expected**: Record not visible (filtered out) ✨ NEW
3. Click **"Show Delivered"** button ✨ NEW
4. **✅ Expected**: Record appears with **"Delivered" badge** ✨ NEW
5. Estimate button is **disabled** ✨ NEW

### Step 8: View in Reports
1. Navigate to **Reports** page ✨ NEW MODULE
2. **✅ Expected**:
   - See the completed delivery
   - Statistics cards updated
   - All device info displayed
   - Delivery mode shown
   - Completion date visible

## Test Scenario 2: Filtering & Search

### Inward Page Filtering
1. Navigate to **Inward**
2. Create multiple records (some marked delivered)
3. **✅ Test**: Toggle "Show Delivered" / "Hide Delivered"
4. **✅ Test**: Search by Job ID, Customer Name
5. **✅ Expected**: Filtering works correctly

### Reports Page Filtering
1. Navigate to **Reports** ✨ NEW
2. **✅ Test**: Filter by Status (All/Completed/In Progress)
3. **✅ Test**: Filter by Delivery Mode
4. **✅ Test**: Filter by Date Range
5. **✅ Test**: Search by customer name or Job ID
6. **✅ Expected**: All filters work independently and combined

## Test Scenario 3: Data Persistence

### Estimate Updates Sync
1. Create job in Hard Disks with estimated amount `3000`
2. In Inward, generate estimate with manual override `4000`
3. **✅ Expected**: Inward record shows `4000`
4. Refresh page
5. **✅ Expected**: Amount persists

### Invoice Persistence
1. Create Outward entry
2. Generate invoice
3. Save invoice
4. Close dialog
5. Reopen invoice for same job
6. **✅ Expected**: Previous data loads correctly

## Test Scenario 4: Master Customer Database

### Customer Consistency
1. Create job with customer "Alice Smith", phone "1234567890"
2. Create another job with same phone number
3. **✅ Expected**: Customer details auto-populate
4. Edit customer name in second job
5. **✅ Expected**: Master customer updated

## Test Scenario 5: Edit Functionality

### Inline Editing in Hard Disks
1. Navigate to **Hard Disks**
2. Find any record, click **Edit** icon ✨ NEW
3. **✅ Test**: Edit each field type:
   - Text fields (serial number, customer name)
   - Dropdowns (model, capacity)
   - Number (estimated amount)
   - Date (estimated delivery)
4. Click **Save** ✨ NEW
5. **✅ Expected**: Changes persist and sync to Inward
6. **✅ Test**: Click **Cancel** instead
7. **✅ Expected**: Changes discarded

## Test Scenario 6: Export Functionality

### CSV Export
1. Navigate to **Reports** ✨ NEW
2. Apply some filters
3. Click **"Export CSV"** ✨ NEW
4. **✅ Expected**: CSV file downloads
5. Open CSV in Excel/Spreadsheet
6. **✅ Expected**: 
   - Headers correct
   - Data matches screen
   - Formatting preserved

## Test Scenario 7: UI/UX Validation

### Status Badges
1. **✅ Check**: Inward "Pending" badge is blue
2. **✅ Check**: Inward "Delivered" badge is green
3. **✅ Check**: Outward "In Progress" badge is yellow
4. **✅ Check**: Outward "Completed" badge is green

### Navigation
1. **✅ Test**: New "Reports" tab in navigation ✨ NEW
2. **✅ Test**: Click each nav item
3. **✅ Expected**: Correct active state highlighting

### Responsive Design
1. **✅ Test**: Resize browser window
2. **✅ Test**: All tables scroll horizontally if needed
3. **✅ Test**: Filter controls stack on mobile

## Common Issues & Solutions

### ❌ Issue: "Job ID not found" error in Inward
**Solution**: Create Hard Disk record first with that Job ID

### ❌ Issue: Estimates not updating Inward
**Solution**: Click "Save Estimate" before closing dialog

### ❌ Issue: Records not syncing
**Solution**: Check browser console for errors, clear localStorage and retry

### ❌ Issue: Export CSV not working
**Solution**: Check browser allows downloads, try different browser

### ❌ Issue: Inline edit not saving
**Solution**: Click Save icon (checkmark), not Cancel (X)

## Performance Testing

### Load Testing
1. Create 50+ records in Hard Disks
2. **✅ Check**: Pages load quickly
3. **✅ Check**: Search/filter responsive
4. **✅ Check**: Edit mode works smoothly

### Browser Compatibility
- **✅ Test**: Chrome/Edge
- **✅ Test**: Firefox
- **✅ Test**: Safari (if available)

## Regression Testing

### Existing Features
Verify these still work:
- [ ] Login/Logout
- [ ] Dashboard statistics
- [ ] Hard Disk CRUD operations
- [ ] Estimate generation & printing
- [ ] Invoice generation & printing
- [ ] Data Management export/import
- [ ] Settings page updates
- [ ] GST calculations (inter/intra state)
- [ ] Company logo display
- [ ] Terms & conditions templates

## Acceptance Criteria ✅

All features pass when:
- ✅ Records sync automatically between modules
- ✅ Estimated amount and delivery date can be added/edited
- ✅ Inline editing works in Hard Disks table
- ✅ Delivered items are filtered in Inward by default
- ✅ Outward can mark items as delivered
- ✅ Reports page shows comprehensive data
- ✅ All filters work correctly
- ✅ CSV export functions properly
- ✅ Status badges display with correct colors
- ✅ Master customer database maintains consistency
- ✅ Estimate/Invoice updates sync across modules
- ✅ No console errors during normal operation

## Test Completion Checklist

- [ ] Test Scenario 1: End-to-End Flow
- [ ] Test Scenario 2: Filtering & Search
- [ ] Test Scenario 3: Data Persistence
- [ ] Test Scenario 4: Master Customer Database
- [ ] Test Scenario 5: Edit Functionality
- [ ] Test Scenario 6: Export Functionality
- [ ] Test Scenario 7: UI/UX Validation
- [ ] Regression Testing
- [ ] Performance Testing
- [ ] Browser Compatibility

---

**Testing Version**: 2.0.0  
**Last Updated**: 2025-10-07  
**Status**: Ready for QA ✅
