# Hard Disk Records - Testing Scenarios

## Quick Testing Guide for HDD Page Enhancements

This document provides step-by-step testing scenarios to verify all new features work correctly.

---

## 🧪 Test Scenario 1: Company Name Default

### Objective
Verify customer name field defaults to company name and is editable.

### Prerequisites
- Company name must be configured in Settings

### Steps
1. Navigate to **Settings** page
2. Verify company name is set (e.g., "Swaz Data Recovery")
3. Navigate to **Hard Disk Records** page
4. Click on "Customer Name" field in the form

### Expected Results
- ✅ Customer name field is pre-filled with company name
- ✅ Field is editable (not read-only)
- ✅ Can type new name
- ✅ Can clear and enter different name

### Test with External Customer
1. Clear customer name field
2. Type "John Doe"
3. Fill other required fields
4. Submit form

### Expected Results
- ✅ "John Doe" is saved (not overridden by company name)
- ✅ Record shows "John Doe" in table

---

## 🧪 Test Scenario 2: dd/mm/yyyy Date Format

### Objective
Verify all dates display in dd/mm/yyyy format with calendar popups.

### Test 2A: Received Date
1. Navigate to Hard Disk Records page
2. Look at "HDD Received Date" field

### Expected Results
- ✅ Field shows date input with calendar icon
- ✅ Below input shows "Display: dd/mm/yyyy" format
- ✅ Today's date displayed as dd/mm/yyyy (e.g., 07/01/2025)

### Test 2B: Date Picker
1. Click on received date field
2. Calendar popup should appear
3. Select a past date (e.g., 5 days ago)

### Expected Results
- ✅ Calendar opens
- ✅ Can select any date
- ✅ Display updates to dd/mm/yyyy format
- ✅ Example: Selecting 2nd Jan 2025 shows "02/01/2025"

### Test 2C: Estimated Delivery Date
1. Scroll to "Estimated Delivery Date" field
2. Verify same behavior as received date

### Expected Results
- ✅ Calendar popup works
- ✅ Shows dd/mm/yyyy format below input
- ✅ Can select future dates

### Test 2D: Table Display
1. Create a record with specific dates
2. Check table column "Received Date"
3. Check table column "Est. Delivery"

### Expected Results
- ✅ Both dates show in dd/mm/yyyy format
- ✅ No time component visible
- ✅ Format consistent across all records

---

## 🧪 Test Scenario 3: HDD Received Date Field

### Objective
Verify received date field works correctly as a required field.

### Test 3A: Default Value
1. Navigate to Hard Disk Records page
2. Observe "HDD Received Date" field

### Expected Results
- ✅ Field shows today's date by default
- ✅ Red asterisk (*) indicates required field
- ✅ Display shows dd/mm/yyyy format

### Test 3B: Edit Received Date
1. Click on received date field
2. Select yesterday's date
3. Observe display update

### Expected Results
- ✅ Date changes
- ✅ Display format updates to dd/mm/yyyy
- ✅ No errors

### Test 3C: Required Field Validation
1. Try to submit form without any date
2. Clear the received date field
3. Click "Add Record"

### Expected Results
- ✅ Form validation error
- ✅ "Please fill in this field" or similar message
- ✅ Form does not submit

### Test 3D: Past Date Selection
1. Select a date 1 month ago
2. Complete form and submit
3. Check table

### Expected Results
- ✅ Record created successfully
- ✅ Shows historical received date
- ✅ Date displays correctly in table

---

## 🧪 Test Scenario 4: Individual Record Actions

### Objective
Verify edit, delete, and mark as delivered actions work for individual records.

### Test 4A: Edit Action
1. Find any active record in table
2. Click **Edit** icon (pencil)

### Expected Results
- ✅ Row enters edit mode
- ✅ Fields become editable
- ✅ Save (checkmark) and Cancel (X) buttons appear
- ✅ Checkbox becomes disabled

### Test 4B: Save Edit
1. While in edit mode, change serial number
2. Change customer name
3. Click **Save** button (checkmark)

### Expected Results
- ✅ Changes are saved
- ✅ Toast notification appears
- ✅ Row exits edit mode
- ✅ New values display in table

### Test 4C: Cancel Edit
1. Click Edit on another record
2. Make changes
3. Click **Cancel** button (X)

### Expected Results
- ✅ Changes are discarded
- ✅ Original values remain
- ✅ Row exits edit mode
- ✅ No toast notification

### Test 4D: Delete Action
1. Click **Delete** icon (trash) on a record
2. Observe confirmation dialog

### Expected Results
- ✅ Confirmation dialog appears
- ✅ Shows "Delete record [JobID]?"
- ✅ Can click OK or Cancel

### Test 4E: Confirm Delete
1. Click OK in confirmation

### Expected Results
- ✅ Record removed from table
- ✅ Toast notification: "Record [JobID] deleted successfully"
- ✅ Record count updates
- ✅ Record no longer visible

### Test 4F: Cancel Delete
1. Click Delete on another record
2. Click Cancel in confirmation

### Expected Results
- ✅ Dialog closes
- ✅ Record remains in table
- ✅ No changes made

---

## 🧪 Test Scenario 5: Mark as Delivered Workflow

### Objective
Verify complete delivery marking process with all fields.

### Test 5A: Open Delivery Dialog
1. Find an active record
2. Click green **Mark as Delivered** button (package icon)

### Expected Results
- ✅ Delivery dialog opens
- ✅ Title shows "Mark as Delivered - [JobID]"
- ✅ Form fields visible
- ✅ Recipient name pre-filled with customer name
- ✅ Delivery date defaults to today

### Test 5B: In-Person Delivery
1. Keep "In Person / Hand Delivery" selected
2. Verify recipient name is correct
3. Add note: "Delivered to office"
4. Click "Confirm Delivery"

### Expected Results
- ✅ Dialog closes
- ✅ Toast: "[JobID] marked as delivered successfully"
- ✅ Record updates immediately
- ✅ Status shows green "Delivered" badge
- ✅ Record has gray background
- ✅ Shows delivery date in dd/mm/yyyy format
- ✅ Shows "In Person" as delivery mode

### Test 5C: Courier Delivery
1. Click Mark as Delivered on different record
2. Select "Courier / Post" radio button

### Expected Results
- ✅ Blue section appears with courier fields
- ✅ "Courier Tracking Number" field shown (required)
- ✅ "Courier Company" field shown (required)

### Test 5D: Courier Validation
1. With courier selected
2. Leave courier number empty
3. Leave courier company empty
4. Click "Confirm Delivery"

### Expected Results
- ✅ Validation errors appear in red
- ✅ "Courier number is required" message
- ✅ "Courier company is required" message
- ✅ Dialog stays open

### Test 5E: Complete Courier Delivery
1. Fill tracking number: "ABC123456789"
2. Fill courier company: "Blue Dart"
3. Change recipient name if needed
4. Click "Confirm Delivery"

### Expected Results
- ✅ Dialog closes
- ✅ Record marked as delivered
- ✅ Status column shows:
  - "Delivered" badge
  - Delivery date
  - "Courier"
  - "Blue Dart"

### Test 5F: Cancel Delivery
1. Open delivery dialog
2. Make changes
3. Click "Cancel"

### Expected Results
- ✅ Dialog closes
- ✅ No changes saved
- ✅ Record remains active
- ✅ No toast notification

---

## 🧪 Test Scenario 6: Closed Records Handling

### Objective
Verify closed records behave correctly and can be shown/hidden.

### Test 6A: Default View
1. Have at least one closed record
2. Refresh page or navigate to Hard Disk Records

### Expected Results
- ✅ Closed records are hidden by default
- ✅ Only active records visible
- ✅ Button shows "Show Closed" with eye-off icon

### Test 6B: Show Closed Records
1. Click "Show Closed" button

### Expected Results
- ✅ Closed records appear in table
- ✅ Closed records have gray background
- ✅ Closed records show "Delivered" badge with green color
- ✅ Delivery details visible in status column
- ✅ Button changes to "Hide Closed" with eye icon

### Test 6C: Hide Closed Records
1. Click "Hide Closed" button

### Expected Results
- ✅ Closed records disappear
- ✅ Only active records visible
- ✅ Button changes back to "Show Closed"

### Test 6D: Closed Record Actions
1. Click "Show Closed"
2. Find a closed record
3. Observe action column

### Expected Results
- ✅ Only Delete button visible (trash icon)
- ✅ No Edit button
- ✅ No Mark as Delivered button
- ✅ Checkbox is disabled

### Test 6E: Delete Closed Record
1. Click Delete on closed record
2. Confirm deletion

### Expected Results
- ✅ Confirmation dialog appears
- ✅ Record deleted successfully
- ✅ Toast notification appears

### Test 6F: Search with Closed Records
1. Show closed records
2. Type in search box

### Expected Results
- ✅ Search filters both active and closed
- ✅ Closed records maintain gray background
- ✅ Results update as you type

---

## 🧪 Test Scenario 7: Bulk Delete

### Objective
Verify bulk selection and deletion works correctly.

### Test 7A: Select Multiple Records
1. Click checkboxes for 3 active records

### Expected Results
- ✅ Checkboxes become checked
- ✅ Delete button shows count: "Delete Selected (3)"
- ✅ Button becomes enabled

### Test 7B: Select All Active
1. Click checkbox in table header

### Expected Results
- ✅ All visible active records selected
- ✅ Count shows total selected
- ✅ Closed records not selected (if visible)

### Test 7C: Bulk Delete Execution
1. With multiple records selected
2. Click "Delete Selected (X)" button
3. Confirm

### Expected Results
- ✅ Confirmation asks about multiple records
- ✅ All selected records deleted
- ✅ Toast: "X record(s) deleted"
- ✅ Selection cleared

### Test 7D: Closed Records Can't Be Bulk Selected
1. Show closed records
2. Try checking closed record checkbox

### Expected Results
- ✅ Checkbox is disabled
- ✅ Can't select closed records
- ✅ Only active records selectable

---

## 🧪 Test Scenario 8: Complete Workflow

### Objective
Test full lifecycle from creation to delivery.

### Steps
1. **Create Record**
   - Customer name defaults to company
   - Change to "Test Customer"
   - Received date: 3 days ago
   - Serial: TEST-001
   - Fill all required fields
   - Estimated delivery: Tomorrow
   - Submit

2. **Verify Creation**
   - Record appears in table
   - Status shows "Active" badge
   - Received date shows in dd/mm/yyyy
   - Est. delivery shows in dd/mm/yyyy

3. **Edit Record**
   - Click Edit
   - Change estimated amount to 5000
   - Change estimated delivery to next week
   - Save

4. **Verify Edit**
   - Changes reflected immediately
   - Toast confirmation appears

5. **Mark as Delivered**
   - Click Mark as Delivered
   - Select Courier
   - Tracking: XYZ789
   - Company: DTDC
   - Add note
   - Confirm

6. **Verify Delivery**
   - Status shows "Delivered"
   - Gray background applied
   - Shows delivery date, Courier, DTDC
   - Record auto-hidden (closed)

7. **Show Closed**
   - Click "Show Closed"
   - Record visible with delivery details
   - Can only delete, not edit

### Expected Result
✅ Complete workflow works seamlessly end-to-end

---

## 🧪 Test Scenario 9: Edge Cases

### Test 9A: Rapid Actions
1. Click Edit, then immediately click Delete

### Expected
- ✅ Graceful handling
- ✅ No conflicts

### Test 9B: Multiple Edits
1. Edit record A
2. Without saving, try editing record B

### Expected
- ✅ Record A edit cancelled or saved
- ✅ Can edit record B

### Test 9C: Special Characters in Courier Number
1. Mark as delivered with courier
2. Tracking number: "ABC-123/XYZ@2025"

### Expected
- ✅ Accepts all characters
- ✅ Displays correctly

### Test 9D: Very Long Company Name
1. Settings: Set company name to 100 characters
2. Create new record

### Expected
- ✅ Long name fits in field
- ✅ Displays properly in table (truncated if needed)

### Test 9E: Future Received Date
1. Set received date to tomorrow
2. Submit

### Expected
- ✅ Allows future dates
- ✅ No validation error
- ✅ Displays correctly

---

## ✅ Test Completion Checklist

### Form & Data Entry
- [ ] Customer name defaults to company name
- [ ] Customer name is editable
- [ ] Received date defaults to today
- [ ] Received date is required
- [ ] Estimated delivery date has calendar
- [ ] All dates show dd/mm/yyyy format
- [ ] Date display helpers show below inputs

### Actions
- [ ] Edit button works
- [ ] Save edit persists changes
- [ ] Cancel edit discards changes
- [ ] Individual delete asks confirmation
- [ ] Individual delete removes record
- [ ] Bulk delete selects multiple
- [ ] Bulk delete removes all selected
- [ ] Mark as delivered opens dialog

### Delivery Dialog
- [ ] Dialog opens correctly
- [ ] Recipient defaults to customer
- [ ] Delivery date defaults to today
- [ ] In-person mode works
- [ ] Courier mode shows extra fields
- [ ] Courier validation works
- [ ] Confirmation saves details
- [ ] Cancel discards changes

### Closed Records
- [ ] New records show "Active"
- [ ] Delivered shows "Delivered" badge
- [ ] Delivered has gray background
- [ ] Delivery details display
- [ ] Default view hides closed
- [ ] "Show Closed" reveals them
- [ ] Closed can't be edited
- [ ] Closed can only be deleted
- [ ] Closed can't be bulk-selected

### Integration
- [ ] Syncs to Inward page
- [ ] Search works with dates
- [ ] Dates persist after refresh
- [ ] Delivery status persists
- [ ] All data saves to localStorage

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________

Scenario 1: Company Name Default       [ Pass / Fail ]
Scenario 2: dd/mm/yyyy Format          [ Pass / Fail ]
Scenario 3: Received Date Field        [ Pass / Fail ]
Scenario 4: Individual Actions         [ Pass / Fail ]
Scenario 5: Mark as Delivered          [ Pass / Fail ]
Scenario 6: Closed Records             [ Pass / Fail ]
Scenario 7: Bulk Delete                [ Pass / Fail ]
Scenario 8: Complete Workflow          [ Pass / Fail ]
Scenario 9: Edge Cases                 [ Pass / Fail ]

Overall Status: [ Pass / Fail ]

Notes:
_________________________________
_________________________________
```

---

## 🐛 Bug Reporting

If you find issues during testing, report with:

1. **Test Scenario**: Which scenario failed
2. **Steps**: Exact steps to reproduce
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Browser**: Chrome/Firefox/Safari/Edge
6. **Screenshots**: If UI issue

---

**Happy Testing!** 🧪✅

**Version**: 3.0.0  
**Last Updated**: 07/01/2025
