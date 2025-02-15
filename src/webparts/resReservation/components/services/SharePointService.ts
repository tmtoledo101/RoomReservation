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
import { result } from "lodash";
export class SharePointService {
  private web = Web( configService.getAccessControlUrl() );

  public async getCurrentUser() {

    const user = await sp.web.currentUser.get();

    const currentUser = {
      Email: configService.isDevUser() && !configService.isTestEnvironment()  ? user.Title : user.Email,
      Title: user.Title
    };
    return currentUser;
  }

  public async getDepartments(email: string) {
    console.log("Terence, here is the user : " + email);


    let departmentData = [];
    

      // Get departments with pagination
      let page;
      if (configService.isDevUser() && !configService.isTestEnvironment()) {
        const filterText = configService.isDevUser() && !configService.isTestEnvironment() 
        ? `Title eq '${email}'` 
        : `EmployeeName/Email eq '${email}'`;  // Changed EMail to Email
        const selectText = configService.isTestEnvironment() ? 
          "Department/Title" : "Department/Department";
        const firstExpandText = configService.isTestEnvironment() ? 
          "Department": "Department/FieldValuesAsText";
        const secondExpandText = configService.isTestEnvironment() ? 
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
    const principalData = await this.web.lists.getByTitle("Employees")
      .items.select("Name", "Dept")
      .filter(`Dept eq '${dept}'`)
      .get();

    const princialMap = {};
    principalData.forEach((item) => {
      if (!princialMap[item.Dept]) {
        princialMap[item.Dept] = [];
      }
      princialMap[item.Dept].push(item.Name);
    });

    return princialMap;
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
      const folderPath = `/sites/ResourceReservation/ReservationDocs/${item.data.GUID}`;
      await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders.add(item.data.GUID);

      for (const file of files) {
        if (file.size <= 10485760) {
          const fileUploadResult = await sp.web.getFolderByServerRelativeUrl(folderPath)
            .files.add(file.name, file, true);
          await fileUploadResult.file.getItem().then(fileItem => {
            return fileItem.update({
              RequestId: item.data.ID
            });
          });
        } else {
          const chunkedUploadResult = await sp.web.getFolderByServerRelativeUrl(folderPath)
            .files.addChunked(file.name, file);
          await chunkedUploadResult.file.getItem().then(fileItem => {
            return fileItem.update({
              RequestId: item.data.ID
            });
          });
        }
      }
    }

    return item.data;
  }
}
