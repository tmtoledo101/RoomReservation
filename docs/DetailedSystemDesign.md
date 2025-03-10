# 7. DETAILED SYSTEM DESIGN

## 7.1 Classification

The Reservation System is composed of several key SPFx webparts and their supporting components:

- **Webparts (Top-level Components)**
  - ResDisplayWebPart
  - ResReservationWebPart
  - ResViewsWebPart
  - SendEmailWebPart

- **Component Types**
  - React Components (.tsx files)
  - Service Classes (.ts files)
  - Utility Modules (.ts files)
  - Style Modules (.scss files)
  - Localization Files (.js files)

## 7.2 Definition

The system is a SharePoint Framework-based reservation management solution designed to handle facility and venue bookings. Its primary purposes are:

1. Facility Reservation Management
2. Reservation Display and Tracking
3. Approval Workflow Management
4. Email Notifications
5. Resource Availability Management

## 7.3 Responsibilities

### ResReservationWebPart
- Handles the creation of new reservations
- Manages facility and venue selection
- Validates reservation requests
- Handles form submission and data persistence

### ResDisplayWebPart
- Displays existing reservations
- Provides reservation details viewing
- Manages reservation status updates
- Handles file attachments and listings

### ResViewsWebPart
- Manages approval workflows
- Provides different views based on user roles
- Handles reservation modifications
- Manages reservation status updates

### SendEmailWebPart
- Handles email notifications
- Manages communication templates
- Processes email triggers

## 7.4 Constraints

1. **Technical Constraints**
   - Must run within SharePoint Framework environment
   - Compatible with SharePoint Online
   - Follows Microsoft 365 authentication protocols

2. **Operational Constraints**
   - Single reservation per time slot per facility
   - Approval required for specific reservation types
   - File attachment size limits:
     * Standard upload limit: 10MB per file
     * Larger files use chunked upload process
   - Time slot validation:
     * No overlapping reservations allowed
     * Dates must be in ISO format
     * Time slots must be available in venue's schedule
   - Department-specific constraints:
     * Users must belong to valid departments
     * Principal user validation per department
   - Venue-specific constraints:
     * Capacity limits per layout
     * Exclusive access restrictions
     * Available facilities validation

## 7.5 Composition

### ResReservation Component Structure
- BasicInformation
- DateTimeSelection
- FacilitySection
- ParticipantInformation
- CSRDFields
- VenueSelection
- ConfirmationDialog

### ResDisplay Component Structure
- ActionButtons
- BasicInformation
- FileList
- VenueDetails
- Notification

### ResViews Component Structure
- ApproverReservationForm
- CustomTable
- CustomTabs
- FacilityDialog
- VenueDateTimePicker

## 7.6 Uses/Interactions

### Component Interactions
1. **SharePointService**
   - Used by all webparts for data operations
   - Handles CRUD operations with SharePoint lists
   - Manages file operations

2. **Common Components**
   - Shared across multiple webparts
   - Provides consistent UI/UX
   - Handles common functionalities

3. **Helper Utilities**
   - Provides shared validation logic
   - Handles date-time formatting
   - Manages common helper functions

## 7.7 Resources

1. **SharePoint Resources**
   - SharePoint Lists:
     * Request - Stores reservation request data
     * Venue - Manages venue information and time slots
     * UsersPerDepartment - Maps users to departments
     * Department - Stores department information
     * PurposeofUse - Maintains list of valid purposes
     * Participants - Manages participant information
     * Facility - Stores facility details
     * ReservationDocs - Handles document attachments
   - SharePoint REST API (@pnp/sp)
   - SharePoint Utilities (sputilities) for email operations

2. **External Resources**
   - SharePoint User Profiles for user information
   - Active Directory integration for user authentication
   - Email service for notifications:
     * Approval notifications
     * Disapproval notifications
     * Cancellation notifications
   - File storage for venue images and attachments

## 7.8 Processing

### Reservation Creation Flow
1. User inputs reservation details including:
   - Basic information (requestor, department)
   - Venue selection and layout
   - Date and time preferences
   - Purpose of use and participant information
   - Facility requirements
   - File attachments

2. System performs validations:
   - Checks room availability using checkRoomAvailablity()
   - Validates time slot conflicts
   - Verifies facility availability
   - Ensures all required fields are filled

3. Data Processing:
   - Formats dates to ISO format
   - Processes participant data to JSON
   - Handles facility data serialization
   - Manages file uploads to ReservationDocs library

4. SharePoint Operations:
   - Creates request item in Request list
   - Updates room time slots
   - Uploads attached files
   - Updates related facility information

5. Notification Process:
   - Sends confirmation emails to requestor
   - Notifies relevant department users
   - Includes reservation details and links

### Approval Process Flow
1. Approver reviews request details through ResViews interface
2. System validates room availability and time slot conflicts
3. Updates room time slot allocation if approved
4. Processes approval/disapproval status update in SharePoint
5. Sends email notifications to requestor with:
   - Approval/Disapproval status
   - Date and time of reservation
   - Link to reservation details
   - Contact information for further assistance
6. Updates SharePoint list with final status and modified data

## 7.9 Interface/Exports

### SharePointService Interface
The SharePointService class provides the following key methods for interacting with SharePoint:

```typescript
class SharePointService {
  // User Management
  getLoggedinUser(): Promise<any>;
  getPrincipalUser(dept: string): Promise<any>;
  
  // Venue Management
  getVenueImage(filterData: string): Promise<{
    venueImage: string;
    facilitiesAvailable: any;
    capacityperLayout: any;
    venueId: string;
    selectedID: number;
  } | null>;
  getBuildings(): Promise<any[]>;
  getLayout(): Promise<any[]>;
  
  // Request Management
  getRequestById(id: string): Promise<any>;
  updateRequest(id: string | number, formData: any, newStatus: string, selectedID: string | number, guid: string): Promise<void>;
  
  // Room Management
  checkRoomAvailablity(venueId: string, fromDate: string, toDate: string): Promise<boolean>;
  updateRoomTimeSlot(id: string | number, venueId: string, fromDate: string, toDate: string, isRemoved?: boolean): Promise<void>;
  
  // Resource Management
  getDepartments(email: string): Promise<{deparmentData: any[], deparmentList: any[]}>;
  getPurposeofUse(): Promise<any[]>;
  getParticipants(): Promise<any[]>;
  getFacility(): Promise<any[]>;
  getFiles(guid: string, siteRelativeUrl: string): Promise<any[]>;
  getCRSD(): Promise<{crsdUsers: any, ddUsers: any}>;
  
  // Communication
  sendEmail(to: string[], cc: string[], values: any, type: string, siteUrl: string, id: string): Promise<void>;
}
```

### Component Props Interfaces
```typescript
interface IResDisplayProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
}

interface IResReservationProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
}
```

## 7.10 Detailed Subsystem Design

### ResReservation Subsystem
The reservation subsystem handles the core booking functionality:

1. **Form Management**
   - Implements multi-step form logic
   - Handles form state management
   - Provides validation at each step

2. **Data Processing**
   - Formats input data
   - Validates against business rules
   - Handles submission to SharePoint

3. **UI Components**
   - Implements responsive design
   - Provides real-time validation
   - Handles user interactions

4. **Integration Points**
   - SharePoint list operations
   - File upload handling
   - Email notification triggers

### ResViews Subsystem
The views subsystem manages reservation display and approval:

1. **View Management**
   - Different views based on user roles
   - Filtering and sorting capabilities
   - Status tracking and updates

2. **Approval Workflow**
   - Approval status management
   - Comment handling
   - Status update notifications

3. **Data Display**
   - Tabular data presentation
   - Detail view implementation
   - Export capabilities
