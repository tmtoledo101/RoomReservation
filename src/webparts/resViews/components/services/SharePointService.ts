import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-groups/web";
import "@pnp/sp/attachments";
import { Web } from "@pnp/sp/webs";
import { ITableItem, STATUS } from "../interfaces/IResViews";
import { IFacilityMapItem, IDropdownItem, IFacilityData } from "../interfaces/IFacility";
import { IEmailProperties } from "@pnp/sp/sputilities";
import { dateConverter } from "../utils/helpers";
import { configService } from "../../../shared/services/ConfigurationService";
import { isDevelopmentMode, hasGroupMembersAccess } from "../../../shared/utils/enivronmentHelper";
import * as moment from "moment";
export interface IPaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
}
export class SharePointService {
  private web = Web( configService.getAccessControlUrl() );
  
  public async saveEmailData(emailProps: IEmailProperties, url: string): Promise<boolean> {
    try {
      // Save email data to a SharePoint list for tracking
      const refNoMatch = emailProps.Subject.match(/(?:Request:|No\.|:)\s*([^.]+)/);
      const referenceNo = refNoMatch ? refNoMatch[1].trim() : '';
      console.log("Reference No:", referenceNo);
      
     
      // Join email addresses and truncate if necessary
      const toEmails = emailProps.To ? [...new Set(emailProps.To)].join(';') : '';
      const ccEmails = emailProps.CC ? [...new Set(emailProps.CC)].join(';') : '';
      const fromEmail = emailProps.From ? emailProps.From : '';
      const bodyEmail = emailProps.Body ? emailProps.Body : '';
      const subjectEmail = emailProps.Subject ? emailProps.Subject : '';
      console.log("To Emails:", toEmails);
      console.log("CC Emails:", ccEmails);
      console.log("From Email:", fromEmail);
      console.log("Email Subject:", emailProps.Subject);
      console.log("Email Body:", emailProps.Body);
      console.log("Record URL:", url);
      await sp.web.lists.getByTitle("EmailDataForPA").items.add({
        ReferenceNo: referenceNo.substring,
        To: toEmails,
        CC: ccEmails,
        SendAsFrom: fromEmail,
        Subject: subjectEmail,
        Body: bodyEmail,
        RecordUrl: url,
      });
      return true;
    } catch (error) {
      console.error("Error saving email data:", error);
      return false;
    }
  }
  
  private static formatRequestItems(items: any[]): ITableItem[] {
    return items.map((item: any) => ({
      building: item.Building,
      venue: item.Venue,
      fromDate: item.FromDate,
      toDate: item.ToDate,
      referenceNumber: item.ReferenceNumber,
      purposeOfUse: item.PurposeOfUse,
      numberOfParticipants: item.NoParticipant,
      requestedBy: item.RequestedBy,
      department: item.Department,
      contactNumber: item.ContactNumber,
      status: item.Status,
      ID: item.Id,
      layout: item.Layout || "",
      contactPerson: item.ContactPerson || "",
      principal: item.PrincipalUser || "",
      titleDesc: item.TitleDescription || "",
      participant: item.Participant ? JSON.parse(item.Participant) : [],
      otherRequirment: item.OtherRequirement || "",
      guid: item.GUID || ""
    }));
  }
 //start
  public static async getAllReservations(): Promise<any[]> {
    try {
    const allReservations: any[] = [];
    let page = await sp.web.lists
      .getByTitle("Request")
      .items.select(
        "Id",
        "FromDate",
        "ToDate",
        "Venue",
        "Building",
        "ReferenceNumber",
        "PurposeOfUse",
        "NoParticipant",
        "RequestedBy",
        "Department",
        "ContactNumber",
        "Status",
        "Layout",
        "ContactPerson",
        "PrincipalUser",
        "TitleDescription",
        "Participant",
        "OtherRequirement"
      )
      // .filter(`Status ne 'Cancelled' and Status ne 'Rejected'`) // <-- Remove this line
      .top(500)
      .getPaged();

    while (true) {
      allReservations.push(...page.results);
      if (page.hasNext) {
        page = await page.getNext();
      } else {
        break;
      }
    }

    // In-memory filter: exclude Cancelled and Rejected
    const filteredReservations = allReservations.filter(item =>
      item.Status !== 'Cancelled' && item.Status !== 'Rejected'
    );

    return filteredReservations;
  } catch (error) {
    console.error("Error fetching all reservations:", error);
    return [];
  }
}

  public static async checkDateTimeAvailability(fromDate: string, toDate: string, reservationId: number, venue: string): Promise<boolean> {
    try {
      console.log(`Checking availability for dates: ${fromDate} to ${toDate}, venue: ${venue}, excluding reservation ID: ${reservationId}`);
      
      // First, get the current reservation to check if dates are unchanged
      const currentReservation = await sp.web.lists
        .getByTitle("Request")
        .items.getById(reservationId)
        .select("FromDate", "ToDate", "Venue")
        .get();
      
      console.log("Current reservation dates:", currentReservation.FromDate, "to", currentReservation.ToDate);
      console.log("Current reservation venue:", currentReservation.Venue);
      
      // If the dates haven't changed and venue hasn't changed, no need to check for conflicts
      const currentFromDate = new Date(currentReservation.FromDate).toISOString();
      const currentToDate = new Date(currentReservation.ToDate).toISOString();
      const newFromDate = new Date(fromDate).toISOString();
      const newToDate = new Date(toDate).toISOString();
      const venueChanged = currentReservation.Venue !== venue;
      
      if (currentFromDate === newFromDate && currentToDate === newToDate && !venueChanged) {
        console.log("Dates and venue unchanged, no need to check for conflicts");
        return true; // Dates and venue unchanged, so no conflict
      }
      
      // If dates or venue have changed, check for conflicts
      console.log("Dates or venue changed, checking for conflicts");
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      // Format dates for SharePoint filtering
      const fromISO = from.toISOString();
      const toISO = to.toISOString();
      
      // Only fetch reservations that might conflict with the given date range AND have the same venue

      let page = await sp.web.lists
        .getByTitle("Request")
        .items.select(
          "Id",
          "FromDate",
          "ToDate",
          "Venue"
        )
        .top(5000) // Fetch as many as possible per page
        .getPaged();

      const allResults: any[] = [];
      while (true) {
        allResults.push(...page.results);
        if (page.hasNext) {
          page = await page.getNext();
        } else {
          break;
        }
      }

      // In-memory filter for conflicts
      const conflicts = allResults.filter(item =>
        item.Status !== 'Cancelled' &&
        item.Status !== 'Rejected' &&
        item.Status !== 'Disapproved' &&
        item.Id !== reservationId &&
        item.Venue === venue &&
        new Date(item.FromDate) < new Date(toISO) &&
        new Date(item.ToDate) > new Date(fromISO)
      );

      console.log(`Found ${conflicts.length} potentially conflicting reservations for venue ${venue}`);

      if (conflicts.length > 0) {
        console.log("Conflicting reservations:", conflicts.map(r => ({
          id: r.Id,
          from: r.FromDate,
          to: r.ToDate,
          venue: r.Venue
        })));
      }

      // If we have any results, there's a conflict
      return conflicts.length === 0;
          } catch (error) {
            console.error("Error checking date/time availability:", error);
            return false;
          }
        }
      //
  public static async checkVenueAvailability(fromDate: Date, toDate: Date): Promise<string[]> {
      const reservations = [];
      try {
      // Get reservations with pagination (no filter in query)
      let page = await sp.web.lists
        .getByTitle("Request")
        .items.select(
          "Venue",
          "FromDate",
          "ToDate",
          "Status"
        )
        .top(5000)    // Smaller batch size for better performance
        .getPaged();

      // Collect all pages
      while (true) {
        reservations.push(...page.results);
        if (page.hasNext) {
          page = await page.getNext();
        } else {
          break;
        }
      }

      // In-memory filter for venue availability
      const filtered = reservations.filter(res =>
        res.Status !== 'Cancelled' &&
        res.Status !== 'Rejected' &&
        new Date(res.FromDate) < toDate &&
        new Date(res.ToDate) > fromDate
      );

      // Return list of venue names that are already booked
      return filtered.map(res => res.Venue);

  } catch (error) {
    console.error("Error checking venue availability:", error);
     throw new Error();
    return [];
} 
}

 public static async getPaginatedRequestItems(
  from: string,
  to: string,
  department: string[],
  pageSize: number = 100,
  pageNumber: number = 0
): Promise<IPaginatedResult<ITableItem>> {
  try {
    const skipToken = pageNumber * pageSize;
    const fromDateObj = new Date(from);
    const toDateObj = new Date(to);

    // Fetch all items (no filter in query)
    let page = await sp.web.lists
      .getByTitle("Request")
      .items.select(
        "Id",
        "Building",
        "Venue",
        "FromDate",
        "ToDate",
        "ReferenceNumber",
        "PurposeOfUse",
        "NoParticipant",
        "RequestedBy",
        "Department",
        "ContactNumber",
        "Status",
        "Layout",
        "ContactPerson",
        "PrincipalUser",
        "TitleDescription",
        "Participant",
        "OtherRequirement",
        "GUID"
      )
      .orderBy("Id", false)
      .getPaged();

    const allResults: any[] = [];
    while (page) {
      allResults.push(...page.results);
      if (page.hasNext) {
        page = await page.getNext();
      } else {
        break;
      }
    }

    // In-memory filter by department and date range
    const filteredResults = allResults.filter(item =>
      department.includes(item.Department) &&
      new Date(item.FromDate) >= fromDateObj &&
      new Date(item.ToDate) <= toDateObj
    );

    // Sort by ID descending
    filteredResults.sort((a, b) => b.Id - a.Id);

    // Paginate
    const batchCount = filteredResults.length;
    const batchPageItems = filteredResults.slice(skipToken, skipToken + pageSize);

    console.log('Batch Page Items:', batchPageItems);

    return {
      items: this.formatRequestItems(batchPageItems),
      totalCount: batchCount,
      hasNextPage: batchCount > (skipToken + pageSize)
    };
  } catch (error) {
    console.error('Error fetching paginated request items:', error);
    throw new Error("Exception encountered in search query. Please contact the admin");
  }
}

  public static async getBuildings(): Promise<{
    buildings: IDropdownItem[];
    venues: any[];
  }> {
    try {
      const buildingData = await sp.web.lists
        .getByTitle("Venue")
        .items.select(
          "Id",
          "Building",
          "Venue",
          "Group",
          "CapacityperLayout",
          "FacilitiesAvailable",
          "ExclusiveTo",
          "Image",
          "VenueId"
        )
        .get();
      const buildObj = {};
      const venues: any[] = [];
      buildingData.forEach((item) => {
        const ImageObj = JSON.parse(item.Image) || { serverRelativeUrl: '' };
        if (item.Building) {
          buildObj[item.Building] = item.Building;
        }
        if (item.Venue) {
          venues.push({
            id: item.Venue,
            value: item.Venue,
            venueImage: ImageObj.serverRelativeUrl,
            facilitiesAvailable: JSON.stringify(item.FacilitiesAvailable),
            exclusiveTo: item.ExclusiveTo,
            group: item.Group,
            capacityperLayout: item.CapacityperLayout,
            venueId: item.VenueId,
            building: item.Building,
            itemId: item.Id,
          });
        }
      });
      return {
        buildings: Object.keys(buildObj).map((item, index) => ({
          id: index.toString(),
          value: item,
        })),
        venues
      };
    } catch (error) {
      console.error('Error getting buildings:', error);
      return {
        buildings: [],
        venues: []
      };
    }
  }
  private static async getDepartmentsBatch(departmentNames: string[]): Promise<any[]> {
    const BATCH_SIZE = 10; // Process 10 departments at a time
    const allResults = [];
    
    for (let i = 0; i < departmentNames.length; i += BATCH_SIZE) {
      const batchDepts = departmentNames.slice(i, i + BATCH_SIZE);
      const filterQuery = batchDepts.map(dept => `Title eq '${dept}'`).join(' or ');
      
      try {
        let page = await sp.web.lists
          .getByTitle("Department")
          .items.select("Title", "Sector")
          .filter(filterQuery)
          .top(100)    // Smaller batch size for better performance
          .getPaged();
        // Collect all pages
        while (true) {
          allResults.push(...page.results);
          
          if (page.hasNext) {
            page = await page.getNext();
          } else {
            break;
          }
        }
      } catch (error) {
        console.error(`Error processing department batch: ${batchDepts.join(', ')}`, error);
      }
    }
    
    return allResults;
  }
  public static async getDepartments(currentUserTitle: string): Promise<{
    departmentList: IDropdownItem[];
    departmentSectorMap: { [key: string]: string };
  }> {   
    try {
    // Get user's departments with pagination (no filter in query)
    const userDepartments = [];
    let page = await sp.web.lists
      .getByTitle("UsersPerDepartment")
      .items.select("Department/Department")
      .expand("Department/FieldValuesAsText")
      .top(5000)    // Smaller batch size for better performance
      .getPaged();
    while (true) {
      userDepartments.push(...page.results);
      if (page.hasNext) {
        page = await page.getNext();
      } else {
        break;
      }
    }
    // In-memory filter by user title
    const filteredUserDepartments = userDepartments.filter(item =>
      item.Title === currentUserTitle
    );
    if (filteredUserDepartments.length === 0) {
      console.error('User department not found');
      return {
        departmentList: [],
        departmentSectorMap: {}
      };
    }
    // Get unique department names
    const departmentNames = [...new Set(
      filteredUserDepartments.map(item => item.Department.Department)
    )];
    // Get departments in batches
    const departments = await this.getDepartmentsBatch(departmentNames);
    // Process results
    const departmentList: IDropdownItem[] = [];
    const departmentSectorMap: { [key: string]: string } = {};
    departments.forEach(dept => {
      if (dept.Title && !departmentList.some(item => item.id === dept.Title)) {
        departmentList.push({
          id: dept.Title,
          value: dept.Title
        });
        departmentSectorMap[dept.Title] = dept.Sector;
      }
    });
    return {
      departmentList,
      departmentSectorMap
    };
  } catch (error) {
    console.error('Error getting departments:', error);
    return {
      departmentList: [],
      departmentSectorMap: {}
    };
  }
}
private static async getRequestItemsBatch(dateFrom: Date, dateTo: Date, departments: string[]): Promise<any[]> {
  try {
    const allResults: any[] = [];
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    // Fetch all items (optionally with a date filter to reduce result size)
    let page = await sp.web.lists
      .getByTitle("Request")
      .items.select(
        "Id",
        "Building",
        "Venue",
        "FromDate",
        "ToDate",
        "ReferenceNumber",
        "PurposeOfUse",
        "NoParticipant",
        "RequestedBy",
        "Department",
        "ContactNumber",
        "Status",
        "Layout",
        "ContactPerson",
        "PrincipalUser",
        "TitleDescription",
        "Participant",
        "OtherRequirement",
        "GUID"
      )
      .orderBy("Id", false)
      .top(5000)
      .getPaged();

    // Collect all pages
    while (true) {
      allResults.push(...page.results);
      if (page.hasNext) {
        page = await page.getNext();
      } else {
        break;
      }
    }

    console.log('fromDate:', fromDate);
    console.log('toDate:', toDate);
    console.log('All results', allResults.length, 'items:', allResults);

    // In-memory filter by department and date range (UTC-safe)
   function toDateOnlyString(date: Date): string {
  // Returns 'YYYY-MM-DD'
  return date.toISOString().split('T')[0];
}

const filteredResults = allResults.filter(item => {
  const itemFromDate = toDateOnlyString(new Date(item.FromDate));
  const itemToDate = toDateOnlyString(new Date(item.ToDate));
  const searchFromDate = toDateOnlyString(fromDate);
  const searchToDate = toDateOnlyString(toDate);
  return (
    departments.includes(item.Department) &&
    itemToDate >= searchFromDate &&
    itemFromDate <= searchToDate
  );
});

    return filteredResults;
  } catch (error) {
    console.error('Error in getRequestItemsBatch:', error);
    throw new Error("Exception encountered in search query. Please contact the admin");
  }
}
  public static async getRequestItems(from: Date, to: Date, department: string[]): Promise<{
    referenceNumberList: ITableItem[];
    pastRequestList: ITableItem[];
    approvalRequest: ITableItem[];
  }> {
    // Modified dateRange to filter based on FromDate
    //const dateRange = `ToDate ge datetime'${dateConverter(from, 1)}' and FromDate le datetime'${dateConverter(to, 2)}'`;
    // If no departments specified, get all items
    const RequestItem: any[] = department.length
      ? await this.getRequestItemsBatch(from, to, department)
      : [];
    console.log('Request items:', RequestItem);
    const itemArray1: ITableItem[] = [];
    const itemArray2: ITableItem[] = [];
    const itemArray3: ITableItem[] = [];
    RequestItem.forEach((item) => {
      const tempObj: ITableItem = {
        building: item.Building,
        venue: item.Venue,
        fromDate: item.FromDate,
        toDate: item.ToDate,
        referenceNumber: item.ReferenceNumber,
        purposeOfUse: item.PurposeOfUse,
        numberOfParticipants: item.NoParticipant,
        requestedBy: item.RequestedBy,
        department: item.Department,
        contactNumber: item.ContactNumber,
        status: item.Status,
        ID: item.Id,
        layout: item.Layout || "",
        contactPerson: item.ContactPerson || "",
        principal: item.PrincipalUser || "",
        titleDesc: item.TitleDescription || "",
        participant: item.Participant ? JSON.parse(item.Participant) : [],
        otherRequirment: item.OtherRequirement || "",
        guid: item.GUID || ""
      };
      itemArray1.push(tempObj);
      if (
        item.Status === STATUS.APPROVED ||
        item.Status === STATUS.DISAPPROVED ||
        item.Status === STATUS.CANCELLED
      ) {
        itemArray2.push(tempObj);
      }
      if (item.Status === STATUS.PENDING) {
        itemArray3.push(tempObj);
      }
    });
    return {
      referenceNumberList: itemArray1,
      pastRequestList: itemArray2,
      approvalRequest: itemArray3,
    };
  }

  public static async getRequestById(id: string): Promise<any> {
    try {
      console.log('Getting request by ID:', id);
      const item = await sp.web.lists
        .getByTitle("Request")
        .items.getById(parseInt(id))
        .select(
          "Id",
          "Building",
          "Venue",
          "FromDate",
          "ToDate",
          "ReferenceNumber",
          "PurposeOfUse",
          "NoParticipant",
          "RequestedBy",
          "Department",
          "ContactNumber",
          "Status",
          "Layout",
          "ContactPerson",
          "PrincipalUser",
          "TitleDescription",
          "Participant",
          "OtherRequirement",
          "IsCSDR",
          "FacilityData",
          "GUID",
          "RequestorEmail",
          "Created"
        )
        .get();
      console.log('Retrieved request item:', item);
      console.log('GUID from request:', item.GUID);
      return item;
    } catch (error) {
      console.error('Error getting request by ID:', error);
      throw error;
    }
  }

  public static async getCurrentUserGroups(): Promise<{
    isApprover: boolean;
    departments: string[];
    approverGroups: {
      isCRSD: boolean;
      isDD: boolean;
      isFSSApprover: boolean;
    };
}> {
    let crsdUsers = [];
    let ddUsers = [];
    let fssApprovers = [];
    let departmentData = [];
    try {
        // Get current user
        const user = await sp.web.currentUser.get();
        const currentUser = {
            Email:  user.Email,
            Title: user.Title
        };
        const userEmail = currentUser.Email;
        // Get users from groups with error handling
        try {
            if (hasGroupMembersAccess()) {
              crsdUsers = await sp.web.siteGroups.getByName("CRSD").users();
              console.log('CRSD Users:', crsdUsers);
            }
        } catch (error) {
            console.warn("Unable to fetch CRSD members:", error);
        }
        try {
            if (hasGroupMembersAccess()) {
              ddUsers = await sp.web.siteGroups.getByName("DD").users();
              console.log('DD Users:', ddUsers);
            }
        } catch (error) {
            console.warn("Unable to fetch DD members:", error);
        }
        try {
            if (hasGroupMembersAccess()) {
              fssApprovers = await sp.web.siteGroups.getByName("FSS Approvers").users();
              console.log('FSS Approvers Users:', fssApprovers);
            }
        } catch (error) {
            console.warn("Unable to fetch FSS Approvers members:", error);
        }
        // Extract email lists
        const crsdEmails = crsdUsers.map(item => item.Email);
        const ddEmails = ddUsers.map(item =>  item.Email);
        const fssApproverEmails = fssApprovers.map(item =>  item.Email);
        console.log('userEmail:', userEmail);
        
        // Check which groups the user belongs to
        const isCRSD = crsdEmails.includes(userEmail);
        const isDD = ddEmails.includes(userEmail);
        const isFSSApprover = fssApproverEmails.includes(userEmail);
        
        // Check if user is an approver (in any of the groups)
        const isApprover =
            isCRSD || isDD || isFSSApprover;
        console.log('Is Approver:', isApprover);
        // Get departments with pagination
      let filteredDepartments: any[] = [];
      try {
            // Get user's departments with pagination (no filter in query)
            let page = await sp.web.lists
                .getByTitle("UsersPerDepartment")
                .items
                .select("EmployeeName/EMail", "Department/Department")
                .expand("Department", "EmployeeName")
                .top(5000)
                .getPaged();

            // Collect all pages
            const allDepartmentData: any[] = [];
            while (true) {
                allDepartmentData.push(...page.results);
                if (page.hasNext) {
                    page = await page.getNext();
                } else {
                    break;
                }
            }
           
            // In-memory filter by user email
            filteredDepartments = allDepartmentData.filter(item =>
                item.EmployeeName && item.EmployeeName.EMail === userEmail
            );



        } catch (error) {
            console.warn("Unable to fetch department data:", error);
        }
        const departments = filteredDepartments.map(item => item.Department.Department);
        return {
            isApprover,
            departments,
            approverGroups: {
                isCRSD,
                isDD,
                isFSSApprover
            }
        };
    } catch (error) {
        console.error('Error in getCurrentUserGroups:', error);
        return {
            isApprover: false,
            departments: [],
            approverGroups: {
                isCRSD: false,
                isDD: false,
                isFSSApprover: false
            }
        };
    }
}
  public static async getFacilities(): Promise<{
    facilityList: IDropdownItem[];
    facilityMap: { [key: string]: IFacilityMapItem };
  }> {
    const facilities: any[] = await sp.web.lists
      .getByTitle("Facility")
      .items.select("*")
      .get();
    const facilityMap: { [key: string]: IFacilityMapItem } = {};
    const facilityList: IDropdownItem[] = [];
    facilities.forEach(facility => {
      facilityMap[facility.Title] = {
        Title: facility.Title,
        AssetNumber: facility.AssetNumber,
        Facility: facility.Facility,
        Quantity: facility.Quantity,
        FacilityOwner: facility.FacilityOwner
      };
      facilityList.push({
        id: facility.Title,
        value: facility.Title
      });
    });
    return {
      facilityList,
      facilityMap
    };
  }
  public static async isVenueCRSD(venue: string): Promise<boolean> {
    try {
      const venueItem = await sp.web.lists
        .getByTitle("Venue")
        .items.select("Group")
        .filter(`Venue eq '${venue}'`)
        .get();
      return venueItem.length > 0 && venueItem[0].Group === 'CRSD';
    } catch (error) {
      console.error('Error checking venue group:', error);
      return false;
    }
  }
  public static async updateReservation(id: number, data: any): Promise<void> {
    try {
      const updateData = {
        Building: data.building,
        Venue: data.venue,
        FromDate: data.fromDate,
        ToDate: data.toDate,
        PurposeOfUse: data.purposeOfUse,
        NoParticipant: data.numberOfParticipants,
        RequestedBy: data.requestedBy,
        Department: data.department,
        ContactNumber: data.contactNumber,
        Status: data.status,
        FacilityData: JSON.stringify(data.facilityData || []),
        Layout: data.layout,
        ContactPerson: data.contactPerson,
        PrincipalUser: data.principal,
        TitleDescription: data.titleDesc,
        Participant: JSON.stringify(data.participant || []),
        OtherRequirement: data.otherRequirment || ""
      };
      await sp.web.lists.getByTitle("Request").items.getById(id).update(updateData);
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw new Error('Failed to update reservation');
    }
  }

  public static async deleteReservation(id: number): Promise<void> {
    try {
      await sp.web.lists.getByTitle("Request").items.getById(id).delete();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw new Error('Failed to delete reservation');
    }
  }
  public static async getFacilityData(reservationId: number): Promise<IFacilityData[]> {
    try {
      const item = await sp.web.lists
        .getByTitle("Request")
        .items.getById(reservationId)
        .select("FacilityData")
        .get();
      if (item.FacilityData) {
        try {
          return JSON.parse(item.FacilityData);
        } catch (error) {
          console.error('Error parsing facility data:', error);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error getting facility data:', error);
      return [];
    }
  }
  public static async getLayouts(venue: string): Promise<IDropdownItem[]> {
    try {
      const layoutData = await sp.web.lists
        .getByTitle("LayoutTablesChairs")
        .items.select("Venue/Venue", "Layout")
        .filter(`Venue/Venue eq '${venue}'`)
        .expand("Venue/FieldValuesAsText")
        .get();
      return layoutData.map(item => ({
        id: item.Layout,
        value: item.Layout
      }));
    } catch (error) {
      console.error('Error getting layouts:', error);
      return [];
    }
  }
  public async getPrincipalUsers(dept: string) {
    console.log("SharePointService - Getting principal users for department:", dept);
    console.log("SharePointService - Is test environment:", configService.isTestEnvironment());
    
    try {
      let principalData;
      if (!configService.isTestEnvironment()) {
    
        console.log("SharePointService - Using test environment");
        principalData = await sp.web.lists.getByTitle("Employees")      
          .items.select("Name", "Dept")
          .filter(`Dept eq '${dept}'`)
          .top(5000)
          .get();      
      } else {
        console.log("SharePointService - Using production environment");
        principalData = await this.web.lists.getByTitle("Employees")      
          .items.select("Name", "Dept")
          .filter(`Dept eq '${dept}'`)
          .top(5000)
          .get();
      }
      console.log("SharePointService - Principal data:", principalData);
      const princialMap = {};
      principalData.forEach((item) => {
        if (!princialMap[item.Dept]) {
          princialMap[item.Dept] = [];
        }
        princialMap[item.Dept].push(item.Name);
      });
      console.log("SharePointService - Principal map:", princialMap);
      return princialMap;
    } catch (error) {
      console.error("SharePointService - Error getting principal users:", error);
      return {};
    }
  }
  public static async getPurposeOfUse(): Promise<IDropdownItem[]> {
    try {
      const purposeData = await sp.web.lists
        .getByTitle("PurposeOfUse")
        .items.select("Title")
        .get();
      return purposeData.map(item => ({
        id: item.Title,
        value: item.Title
      }));
    } catch (error) {
      console.error('Error getting purpose of use:', error);
      return [];
    }
  }

   public static async getApproverEmails(): Promise<{ crsdMembers: string[], ddMembers: string[], fssApproversMembers: string[] }> {
    try {
      let crsdMembers: string[] = [];
      let ddMembers: string[] = [];
      let fssApproversMembers: string[] = [];

      try {
        const crsdUsers = await sp.web.siteGroups.getByName("CRSD").users();
        crsdMembers = crsdUsers.map(user => user.Email);
      } catch (error) {
        console.error("Error getting CRSD members:", error);
      }

      try {
        const ddUsers = await sp.web.siteGroups.getByName("DD").users();
        ddMembers = ddUsers.map(user => user.Email);
      } catch (error) {
        console.error("Error getting DD members:", error);
      }

      try {
        const fssApproversUsers = await sp.web.siteGroups.getByName("FSS Approvers").users();
        fssApproversMembers = fssApproversUsers.map(user => user.Email);
      } catch (error) {
        console.error("Error getting FSS Approvers members:", error);
      }

      return { crsdMembers, ddMembers, fssApproversMembers };
    } catch (error) {
      console.error("Error getting approver emails:", error);
      return { crsdMembers: [], ddMembers: [], fssApproversMembers: [] };
    }
  }

 public static async getRequestorEmail(requestedBy: string): Promise<string> {
    try {
      const users = await sp.web.lists
        .getByTitle("UsersPerDepartment")
        .items.select("EmployeeName/EMail", "Title")
        .expand("EmployeeName")
        .filter(`Title eq '${requestedBy}'`)
        .get();

      if (users.length > 0 && users[0].EmployeeName) {
        return users[0].EmployeeName.EMail;
      }
      
      return "";
    } catch (error) {
      console.error("Error getting requestor email:", error);
      return "";
    }
  }

  public static async getFiles(guid: string, siteRelativeUrl?: string): Promise<any[]> {
    try {
      console.log('SharePointService.getFiles called with GUID:', guid);
      console.log('Site Relative URL:', siteRelativeUrl);
      
      if (!guid) {
        console.warn('GUID is empty or undefined');
        return [];
      }
      
      //const serverRelativeUrl = "/sites/ResourceReservationDev" + "/ReservationDocs/" + guid;
      const serverRelativeUrl = siteRelativeUrl + "/ReservationDocs/" + guid;
      console.log('Attempting to get files from folder:', serverRelativeUrl);
      
      try {
        // First check if the folder exists
        const folderExists = await sp.web.getFolderByServerRelativeUrl(serverRelativeUrl).get()
          .then(() => true)
          .catch(() => false);
        
        console.log('Folder exists:', folderExists);
        
        if (!folderExists) {
          console.warn('Folder does not exist');
          return [];
        }
        
        // If folder exists, get the files
        const files = await sp.web.getFolderByServerRelativeUrl(serverRelativeUrl)
          .files
          .select("*")
          .top(5000)
          .expand('ListItemAllFields')
          .get();
        
        console.log('Files retrieved:', files);
        return files;
      } catch (folderError) {
        console.error('Error checking folder or getting files:', folderError);
        return [];
      }
    } catch (error) {
      console.error("Error in getFiles method:", error);
      return [];
    }
  }
}
