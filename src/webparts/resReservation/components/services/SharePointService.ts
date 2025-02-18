import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/sputilities";
import { Web } from "@pnp/sp/webs";
import { IDropdownItem, IVenueItem } from "../interfaces/IResReservation";
import { arrayToDropDownValues, dateFormat, getCount } from "../utils/helpers";
import * as moment from "moment";
import { configService } from "../../../shared/services/ConfigurationService";
import { isDevelopmentMode } from "../../../shared/utils/enivronmentHelper";
export class SharePointService {
  private web = Web( configService.isTestEnvironment()? configService.getResourceReservationUrl() :configService.getAccessControlUrl()  );

  public async getCurrentUser() {

    const user = await sp.web.currentUser.get();

    const currentUser = {
      Email: isDevelopmentMode()? user.Title : user.Email,
      Title: user.Title
    };
    return currentUser;
  }

  public async getDepartments(email: string) {
    console.log("Terence, here is the user : " + email, "developmentMode:",isDevelopmentMode());

    let departmentData = [];
    

      // Get departments with pagination
      let page;
      if (isDevelopmentMode()) {
        const filterText = isDevelopmentMode() ? `Title eq '${email}'` 
        : `EmployeeName/Email eq '${email}'`;  // Changed EMail to Email
        //const selectText =isDevelopmentMode() ? 
         // "Department/Title" : "Department/Department";
         const selectText = "Department/Department";
        const firstExpandText = isDevelopmentMode() ? 
          "Department": "Department/FieldValuesAsText";
        const secondExpandText = isDevelopmentMode() ? 
          "EmployeeName": "EmployeeName/EMail";

        page = await sp.web.lists
          .getByTitle("UsersPerDepartment")
          .items
          .select("EmployeeName/EMail", selectText)
          .expand(firstExpandText, secondExpandText)
          .filter(filterText)
          .top(5000)  // Process 100 items at a time
          .getPaged();
      } else {
        page = await sp.web.lists
          .getByTitle("UsersPerDepartment")
          .items
          .select("EmployeeName/EMail", "Department/Department")
          .expand("Department", "EmployeeName")
          .filter(`EmployeeName/EMail eq '${email}'`)
          .top(5000)
          .getPaged();
      }

      // Collect all pages
      while (true) {
        departmentData.push(...page.results);
        
        if (page.hasNext) {
          page = await page.getNext();
        } else {
          break;
        }
      }

      
    const deparmentList = await sp.web.lists
      .getByTitle("Department")
      .items.select(
        "Department",
        "Sector"
      )
      .get();

    const deprtObj = {};
    deparmentList.forEach(item => {
      deprtObj[item.Department] = item.Sector;
    });

    const departmentSectorMap = {};
    departmentData.forEach((item) => {
      departmentSectorMap[item.Department.Department] = deprtObj[item.Department.Department];
    });

    return {
      departments: Object.keys(departmentSectorMap).map(item => ({ id: item, value: item })),
      departmentSectorMap
    };
  }


  public async getBuildings() {
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
        "VenueId",
      )
      .get();

    const buildObj = {};
    const venues: IVenueItem[] = [];

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
        id: index,
        value: item,
      })),
      venues
    };
  }

  public async checkVenueAvailability(fromDate: Date, toDate: Date): Promise<string[]> {
    const reservations = [];
    try {
      // Get reservations with pagination
      let page = await sp.web.lists
        .getByTitle("Request")
        .items.select(
          "Venue",
          "FromDate",
          "ToDate",
          "Status"
        )
        .filter(`
          Status ne 'Cancelled' and Status ne 'Rejected' and
          ((FromDate lt '${moment(toDate).toISOString()}' and ToDate gt '${moment(fromDate).toISOString()}'))
        `)
        .top(1000)  // Smaller batch size for better performance
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

      // Return list of venue names that are already booked
      return reservations.map(res => res.Venue);
      
    } catch (error) {
      console.error("Error checking venue availability:", error);
      return [];
    }
  }

  public async getLayouts() {
    const layoutData = await sp.web.lists
      .getByTitle("LayoutTablesChairs")
      .items.select("Venue/Venue", "Layout")
      .expand("Venue/FieldValuesAsText")
      .get();

    const layoutMap = {};
    layoutData.forEach((item) => {
      if (!layoutMap[item.Venue.Venue]) {
        layoutMap[item.Venue.Venue] = [];
      }
      layoutMap[item.Venue.Venue].push({
        id: item.Layout,
        value: item.Layout,
      });
    });

    return layoutMap;
  }

  public async getPrincipalUsers(dept: string) {
    console.log("SharePointService - Getting principal users for department:", dept);
    console.log("SharePointService - Is test environment:", configService.isTestEnvironment());
    
    try {
      let principalData;
      if (configService.isTestEnvironment()) {
     
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

  public async getPurposeOfUse(): Promise<IDropdownItem[]> {
    const purposeData = await sp.web.lists
      .getByTitle("PurposeofUse")
      .items.select("Title")
      .get();

    return arrayToDropDownValues(purposeData.map(item => item.Title));
  }

  public async getParticipants(): Promise<IDropdownItem[]> {
    const participants = await sp.web.lists
      .getByTitle("Participants")
      .items.select("Title")
      .get();

    return arrayToDropDownValues(participants.map(item => item.Title));
  }
/*
  public async getFacilities() {
    const facilities = await sp.web.lists
      .getByTitle("Facility")
      .items.select("Title", "AssetNumber", "Facility", "Quantity", "FacilityOwner/Title", "FacilityOwner/ID", "FacilityOwner/EMail")
      .expand("FacilityOwner")
      .get();

    const facilityMap = {};
    facilities.forEach((item) => {
      facilityMap[item.Facility] = { 
        ...item, 
        "FacilityOwner": item.FacilityOwner.results[0].EMail 
      };
    });

    return facilityMap;
  }
*/
public async getFacilities() {
  const facilities = await sp.web.lists
    .getByTitle("Facility")
    .items.select("Title", "AssetNumber", "Facility", "Quantity", "FacilityOwner/Title", "FacilityOwner/ID", "FacilityOwner/EMail")
    .expand("FacilityOwner")
    .get();

  const facilityMap = {};
  facilities.forEach((item) => {
    facilityMap[item.Facility] = { 
      ...item, 
      "FacilityOwner": 
        item.FacilityOwner && item.FacilityOwner.results && item.FacilityOwner.results.length > 0
          ? item.FacilityOwner.results[0].EMail 
          : null // Or provide a default value like an empty string
    };
});


  return facilityMap;
}


  public async getGroupMembers() {
    const crsdUsers = await sp.web.siteGroups.getByName("CRSD").users();
    const ddUsers = await sp.web.siteGroups.getByName("DD").users();
    const fssUsers = await sp.web.siteGroups.getByName("FSS").users();

    return {
      crsdMembers: crsdUsers.map(item => item.Email),
      ddMembers: ddUsers.map(item => item.Email),
      fssMembers: fssUsers.map(item => item.Email)
    };
  }

  public async createReservation(formData: any, facilityData: any[], files: File[], venueId: string, isFssManaged: boolean) {
    const participant = JSON.stringify(formData["participant"]);
    const facility = JSON.stringify(facilityData);
    
    const itemLength = await sp.web.lists.getByTitle('Request').items
      .select("referCount")
      .top(1)
      .orderBy("Id", false)
      .get();
      console.log("this is ISCRSD:" + formData["IsCSDR"]);
    const count = itemLength.length ? Number(itemLength[0].referCount) : 0;
    const ReferenceNumber = `RR-${moment().year()}${getCount(moment().month())}-${getCount(count, 4)}`;

    const item = await sp.web.lists.getByTitle('Request').items.add({
      Title: formData["requestedBy"],
      RequestedBy: formData["requestedBy"],
      Department: formData["department"],
      Building: formData["building"],
      Venue: formData["venue"],
      Layout: formData["layout"],
      PrincipalUser: formData["principal"],
      ContactPerson: formData["contactPerson"],
      ContactNumber: formData["contactNumber"],
      PurposeOfUse: formData["purposeOfUse"],
      Participant: participant,
      NoParticipant: formData["numberOfParticipant"],
      TitleDescription: formData["titleDesc"],
      FromDate: moment(formData["fromDate"]).toISOString(),
      ToDate: moment(formData["toDate"]).toISOString(),
      OtherRequirement: formData["otherRequirment"],
      IsCSDR: formData["IsCSDR"],
      //IsCSDR: formData["IsCSDR"] || false,
      FacilityData: facility,
      Status: isFssManaged ? "Approved" : "Pending for Approval",
      RequestorEmail: formData["requestorEmail"],
      referCount: `${count + 1}`,
      ReferenceNumber: ReferenceNumber,
    });
    console.log("Created item:", item.data);

    if (files.length > 0) {
      const _itemId = item.data.ID;
      
      const f = configService.isDevUser() ? "/sites/ResourceReservationDev" : "/sites/ResourceReservation" + "/ReservationDocs/" + item.data.GUID;
      
      await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders.add(item.data.GUID)
        .then(r => {
          Promise.all(files.map((file) => {
            if (file.size <= 10485760) {
              // Regular file upload
              return sp.web.getFolderByServerRelativeUrl(f).files.add(file.name, file, true)
                .then(fileResult => {
                  return fileResult.file.getItem()
                    .then(fileItem => {  // Renamed from 'item' to 'fileItem'
                      return fileItem.update({
                        RequestId: _itemId
                      });
                    });
                });
            } else {
              // Chunked upload for large files
              return sp.web.getFolderByServerRelativeUrl(f).files.addChunked(file.name, file, d1 => {
                console.log({ data: d1 });
              }, true)
                .then(({ file: fileData }) => fileData.getItem())
                .then((fileItem: any) => {  // Renamed from 'item' to 'fileItem'
                  return fileItem.update({
                    RequestId: _itemId
                  });
                });
            }
          }));
        });
    }

    return item.data;
  }
}
