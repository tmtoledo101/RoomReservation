import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-groups/web";
import "@pnp/sp/attachments";
import { Web } from "@pnp/sp/webs";
import { ITableItem, STATUS } from "../interfaces/IResViews";
import { IFacilityMapItem, IDropdownItem, IFacilityData } from "../interfaces/IFacility";
import { dateConverter } from "../utils/helpers";
import { configService } from "../../../shared/services/ConfigurationService";
import { isDevelopmentMode, hasGroupMembersAccess } from "../../../shared/utils/enivronmentHelper";

export interface IPaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
}

export class SharePointService {
  private web: any;
  
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
      otherRequirment: item.OtherRequirement || ""
    }));
  }

  constructor() {
    this.web = Web(configService.getAccessControlUrl());
  }

  public static async checkVenueAvailability(fromDate: Date, toDate: Date): Promise<string[]> {
    try {
      const reservations = await sp.web.lists
        .getByTitle("Request")
        .items.select("Venue")
        .filter(`
          Status eq '${STATUS.APPROVED}' and
          ((FromDate le datetime'${toDate.toISOString()}' and ToDate ge datetime'${fromDate.toISOString()}') or
          (FromDate ge datetime'${fromDate.toISOString()}' and FromDate le datetime'${toDate.toISOString()}'))
        `)
        .get();

      return reservations.map(item => item.Venue);
    } catch (error) {
      console.error('Error checking venue availability:', error);
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
      const dateRange = `FromDate ge datetime'${dateConverter(from, 1)}' and ToDate le datetime'${dateConverter(to, 2)}'`;


      // Process departments in batches
      const BATCH_SIZE = 5; // Process 5 departments at a time
      const batchResults: any[] = [];
      
      // Process each batch of departments
      for (let i = 0; i < department.length; i += BATCH_SIZE) {
        const batchDepts = department.slice(i, i + BATCH_SIZE);
        const filterQuery = `${dateRange} and (${batchDepts.map(dept => `Department eq '${dept}'`).join(' or ')})`;
        console.log('Processing departments:', batchDepts);
        try {
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
              "OtherRequirement"
            )
            .filter(filterQuery)
            .orderBy("Id", false)
            .getPaged();

          while (page) {
            batchResults.push(...page.results);
            if (page.hasNext) {
              page = await page.getNext();
            } else {
              break;
            }
          }
        } catch (error) {
          console.error(`Error processing batch for departments ${batchDepts.join(', ')}:`, error);
        }
      }

      // Sort all items by ID in descending order
      batchResults.sort((a, b) => b.Id - a.Id);

      const batchCount = batchResults.length;

      // Apply pagination to the combined results
      const batchPageItems = batchResults.slice(skipToken, skipToken + pageSize);
console.log('Batch Page Items:', batchPageItems);
      return {
        items: this.formatRequestItems(batchPageItems),
        totalCount: batchCount,
        hasNextPage: batchCount > (skipToken + pageSize)
      };
    } catch (error) {
      console.error('Error fetching paginated request items:', error);
      return {
        items: [],
        totalCount: 0,
        hasNextPage: false
      };
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
          .top(100)  // Smaller batch size for better performance
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
      // Get user's departments with pagination
      const userDepartments = [];
      let page = await sp.web.lists
        .getByTitle("UsersPerDepartment")
        .items.select("Department/Department")
        .filter(`Title eq '${currentUserTitle}'`)
        .expand("Department/FieldValuesAsText")
        .top(100)  // Smaller batch size for better performance
        .getPaged();

      while (true) {
        userDepartments.push(...page.results);
        
        if (page.hasNext) {
          page = await page.getNext();
        } else {
          break;
        }
      }

      if (userDepartments.length === 0) {
        console.error('User department not found');
        return {
          departmentList: [],
          departmentSectorMap: {}
        };
      }

      // Get unique department names
      const departmentNames = [...new Set(
        userDepartments.map(item => item.Department.Department)
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

  private static async getRequestItemsBatch(dateRange: string, departments: string[]): Promise<any[]> {
    try {
      const BATCH_SIZE = 5; // Process 5 departments at a time
      const allResults = [];
      
      // Process departments in batches
      for (let i = 0; i < departments.length; i += BATCH_SIZE) {
        const batchDepts = departments.slice(i, i + BATCH_SIZE);
        console.log('Processing departments:', batchDepts);
        
        // Create filter query for current batch
        const filterQuery = `${dateRange} and (${batchDepts.map(dept => `Department eq '${dept}'`).join(' or ')})`;
        
        try {
          // Execute query for current batch with pagination
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
              "OtherRequirement"
            )
            .filter(filterQuery)
            .orderBy("Id", false)
            .top(100)  // Smaller batch size for better performance
            .getPaged();

          // Collect all pages for current batch
          while (true) {
            console.log(`  For Iteration ${i} Got ${page.results.length} results for departments ${batchDepts.join(', ')}`);
            allResults.push(...page.results);
            
            if (page.hasNext) {
              page = await page.getNext();
            } else {
              break;
            }
          }
        } catch (error) {
          console.error(`Error processing batch for departments ${batchDepts.join(', ')}:`, error);
        }
      }
      
      return allResults;
    } catch (error) {
      console.error('Error in getRequestItemsBatch:', error);
      return [];
    }
  }

  public static async getRequestItems(from: string, to: string, department: string[]): Promise<{
    referenceNumberList: ITableItem[];
    pastRequestList: ITableItem[];
    approvalRequest: ITableItem[];
  }> {
    const dateRange = `FromDate ge datetime'${dateConverter(from, 1)}' and ToDate le datetime'${dateConverter(to, 2)}'`;
    
    // If no departments specified, get all items
    const RequestItem: any[] = department.length
      ? await this.getRequestItemsBatch(dateRange, department)
      : await sp.web.lists
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
            "OtherRequirement"
          )
          .filter(dateRange)
          .orderBy("Id", false)
          .get();
    
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
        otherRequirment: item.OtherRequirement || ""
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

  public static async getCurrentUserGroups(): Promise<{
    isApprover: boolean;
    departments: string[];
  }> {
    try {
      // Get current user
      const user = await sp.web.currentUser.get();
      const currentUser = {
        Email: isDevelopmentMode ? user.Title : user.Email,
        Title: user.Title
      };
      const userEmail = currentUser.Email;

      // Get users from CRSD and DD groups
      const crsdUsers = hasGroupMembersAccess()? await sp.web.siteGroups.getByName("CRSD").users():[];
      const ddUsers = hasGroupMembersAccess()?await sp.web.siteGroups.getByName("DD").users():[];

      // Extract email lists
      const crsdEmails = crsdUsers.map(item => item.Email);
      const ddEmails = ddUsers.map(item => item.Email);

      // Check if user is an approver
      const isApprover =hasGroupMembersAccess()?
      crsdEmails.includes(userEmail) || ddEmails.includes(userEmail):true;

      const filterText = isDevelopmentMode? `Title eq '${userEmail}'` : `EmployeeName/Email eq '${userEmail}'`;  
      // Get user departments
      const departmentData: any[] = await sp.web.lists
        .getByTitle("UsersPerDepartment")
        .items.select(
          "EmployeeName/EMail",
          "Department/Department",
        )
        .filter(filterText)
        .expand(
          "Department/FieldValuesAsText",
          "EmployeeName/EMail",
        )
        .top(5000)
        .get();

      const departments = departmentData.map(item => item.Department.Department);

      return {
        isApprover,
        departments
      };
    } catch (error) {
      console.error('Error in getCurrentUserGroups:', error);
      return {
        isApprover: false,
        departments: []
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

  public static async getPrincipalUsers(dept: string): Promise<{ [key: string]: string[] }> {
    try {
      const principalData = await sp.web.lists.getByTitle("Employees")
        .items.select("Name", "Dept")
        .filter(`Dept eq '${dept}'`)
        .get();

      const principalMap = {};
      principalData.forEach((item) => {
        if (!principalMap[item.Dept]) {
          principalMap[item.Dept] = [];
        }
        principalMap[item.Dept].push(item.Name);
      });

      return principalMap;
    } catch (error) {
      console.error('Error getting principal users:', error);
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
}