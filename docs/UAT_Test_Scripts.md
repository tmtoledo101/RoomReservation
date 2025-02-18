# UAT Test Scripts for RRS (Room Reservation System)

## Test Script Format
- Test Case ID: Unique identifier for each test case
- Module: The webpart being tested
- Test Case Description: What is being tested
- Test Steps: Detailed steps to perform the test
- Test Data: Sample data to use for testing
- Expected Result: What should happen
- Actual Result: To be filled during testing
- Status: Pass/Fail (To be filled during testing)
- Comments: Any additional notes or observations

## 1. ResReservation WebPart Test Cases

### TC-RR-001: Basic Reservation Creation
- **Test Case Description**: Create a new basic room reservation
- **Test Steps**:
  1. Navigate to the reservation page
  2. Fill in Basic Information section:
     - Purpose of reservation
     - Number of participants
  3. Fill in Date/Time section:
     - Select start date and time
     - Select end date and time
  4. Select Venue Details
  5. Add Participant Information
  6. Click Submit
- **Test Data**:
  - Purpose: "Team Meeting"
  - Participants: 5
  - Start Date: [Current Date + 1]
  - Start Time: 10:00 AM
  - End Time: 11:00 AM
- **Expected Result**: Reservation should be created successfully with confirmation message

### TC-RR-002: Facility Selection
- **Test Case Description**: Create reservation with additional facilities
- **Test Steps**:
  1. Follow steps 1-4 from TC-RR-001
  2. Click "Add Facility"
  3. Select multiple facilities
  4. Complete reservation
- **Test Data**:
  - Basic reservation data from TC-RR-001
  - Facilities: Projector, Whiteboard
- **Expected Result**: Reservation should be created with selected facilities

### TC-RR-003: CSRD Fields Testing
- **Test Case Description**: Test CSRD fields functionality
- **Test Steps**:
  1. Fill in Basic Information
  2. Navigate to CSRD Fields section
  3. Fill in all CSRD-specific fields
  4. Verify field dependencies
  5. Submit form
- **Test Data**:
  - CSRD fields data as per requirements
- **Expected Result**: CSRD fields should be properly saved with the reservation

### TC-RR-004: Venue Search
- **Test Case Description**: Test venue search functionality
- **Test Steps**:
  1. Click on Venue Search
  2. Enter search criteria
  3. Filter results
  4. Select venue
  5. Verify selected venue details
- **Test Data**:
  - Search criteria: Room capacity > 10
  - Date/Time from TC-RR-001
- **Expected Result**: Appropriate venues should be listed and selectable

### TC-RR-005: Participant Information
- **Test Case Description**: Test participant information entry
- **Test Steps**:
  1. Navigate to Participant Information section
  2. Add multiple participants
  3. Edit participant details
  4. Remove participants
  5. Verify participant count matches
- **Test Data**:
  - Participant details (names, emails)
  - External participants
- **Expected Result**: Participant information should be properly saved

### TC-RR-006: Error Handling
- **Test Case Description**: Test system error handling
- **Test Steps**:
  1. Test network disconnection scenarios
  2. Test SharePoint service unavailability
  3. Test session timeout scenarios
  4. Verify error messages
- **Test Data**:
  - Simulate network issues
  - Invalid SharePoint responses
- **Expected Result**: System should handle errors gracefully with user-friendly messages

### TC-RR-007: Form State Persistence
- **Test Case Description**: Test form data persistence
- **Test Steps**:
  1. Fill partial form data
  2. Navigate away from form
  3. Return to form
  4. Check data persistence
- **Test Data**:
  - Partial reservation data
- **Expected Result**: Form should retain entered data

### TC-RR-008: Validation Checks
- **Test Case Description**: Verify form validations
- **Test Steps**:
  1. Try to submit form without required fields
  2. Enter invalid data formats
  3. Test date/time validations
- **Test Data**:
  - Empty required fields
  - Past dates
  - Invalid time combinations
- **Expected Result**: Appropriate error messages should be displayed

## 2. ResDisplay WebPart Test Cases

### TC-RD-001: View Reservation Details
- **Test Case Description**: View details of an existing reservation
- **Test Steps**:
  1. Navigate to display page
  2. Locate a specific reservation
  3. View all reservation details
- **Test Data**:
  - Use reservation created in TC-RR-001
- **Expected Result**: All reservation details should be displayed correctly

### TC-RD-002: File Upload and Attachment
- **Test Case Description**: Test file attachment functionality
- **Test Steps**:
  1. Open reservation details
  2. Upload new files
  3. View attached files
  4. Download attachments
  5. Delete attachments
- **Test Data**:
  - Test files of different types (PDF, DOC, etc.)
  - Maximum file size test
  - Multiple file upload test
- **Expected Result**: Files should be viewable and downloadable

### TC-RD-003: Multiple Notification States
- **Test Case Description**: Test different notification types and states
- **Test Steps**:
  1. Test success notifications
  2. Test warning notifications
  3. Test error notifications
  4. Verify notification persistence
  5. Test notification dismissal
- **Test Data**:
  - Various reservation actions
  - Different notification types
- **Expected Result**: 
  - Each notification type should display correctly
  - Notifications should be dismissable
  - Critical notifications should persist

## 3. ResViews WebPart Test Cases

### TC-RV-001: Approver View
- **Test Case Description**: Test approver's view of reservations
- **Test Steps**:
  1. Login as approver
  2. Navigate to approver view
  3. View pending reservations
- **Test Data**:
  - Approver credentials
- **Expected Result**: List of pending reservations should be displayed

### TC-RV-002: Reservation Approval Process
- **Test Case Description**: Test reservation approval workflow
- **Test Steps**:
  1. Select pending reservation
  2. Review details
  3. Approve/Reject reservation
  4. Add comments
- **Test Data**:
  - Pending reservation
  - Approval comment: "Approved for team meeting"
- **Expected Result**: Reservation status should update accordingly

### TC-RV-003: Venue Details Section
- **Test Case Description**: Test venue details review in approver form
- **Test Steps**:
  1. Open reservation for approval
  2. Review venue details section
  3. Verify all venue information
  4. Check facility assignments
- **Test Data**:
  - Reservation with venue and facilities
- **Expected Result**: All venue and facility details should be accurately displayed

### TC-RV-004: Custom Table Functionality
- **Test Case Description**: Test custom table features
- **Test Steps**:
  1. View reservation list
  2. Test sorting
  3. Test filtering
  4. Test pagination
- **Test Data**:
  - Multiple reservations
- **Expected Result**: Table should sort, filter, and paginate correctly

### TC-RV-005: Accessibility Testing
- **Test Case Description**: Verify accessibility features
- **Test Steps**:
  1. Test keyboard navigation
  2. Verify screen reader compatibility
  3. Check color contrast
  4. Test focus indicators
  5. Verify ARIA labels
- **Test Data**:
  - Keyboard navigation paths
  - Screen reader test cases
- **Expected Result**: All features should be accessible via keyboard and screen readers

### TC-RV-006: Browser Compatibility
- **Test Case Description**: Test across different browsers
- **Test Steps**:
  1. Test in Chrome
  2. Test in Edge
  3. Test in Firefox
  4. Verify responsive design
- **Test Data**:
  - Standard reservation workflow
  - Different screen sizes
- **Expected Result**: Consistent functionality across all supported browsers

### TC-RV-007: Date/Time Filter
- **Test Case Description**: Test date/time filtering in views
- **Test Steps**:
  1. Open date filter
  2. Select date range
  3. Apply filter
- **Test Data**:
  - Date range: [Current week]
- **Expected Result**: Only reservations within selected date range should display

## Additional Test Considerations
1. Performance Testing:
   - Load time for each webpart
   - Response time for actions
   - Form submission performance

2. Security Testing:
   - Permission levels
   - Data access controls
   - Input sanitization

3. Integration Testing:
   - SharePoint list integration
   - User profile service
   - Email notifications

## Notes for Excel Import
1. Each test case can be copied as a row in Excel
2. Suggested Excel columns:
   - Test Case ID
   - Module
   - Description
   - Steps
   - Test Data
   - Expected Result
   - Actual Result
   - Status
   - Comments
3. Add additional columns as needed for tracking:
   - Tester Name
   - Test Date
   - Environment
   - Build Version
