import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/sputilities";
import { IEmailProperties } from "@pnp/sp/sputilities";
import { Web } from "@pnp/sp/webs";
import { IDropdownItem, IVenueItem } from "../interfaces/IResReservation";
import { arrayToDropDownValues, dateFormat, getCount } from "../utils/helpers";
import * as moment from "moment";
import { configService, ConfigurationService } from "../../../shared/services/ConfigurationService";
import { isDevelopmentMode } from "../../../shared/utils/enivronmentHelper";
export class SharePointService {

    private web = Web(!configService.isTestEnvironment() ? configService.getResourceReservationUrl() : configService.getAccessControlUrl());
    private isCreatingReservation: boolean = false; // Flag to track reservation creation

    // User authentication and department access
    public async getCurrentUser() {
        // Fetches current user details
        // Handles both development and production environments
        const user = await sp.web.currentUser.get();
        console.log("TESTENV", configService.isTestEnvironment());
        console.log("DEVUSER", configService.isDevUser());
        const currentUser = {
            //Email: isDevelopmentMode()? user.Title : user.Email,
            Email: user.Email,
            Title: user.Title
        };
        return currentUser;
    }

    public async getDepartments(email: string) {
        // Retrieves department information for a user
        // Includes sector mapping and pagination handling
        console.log("TESTENV_department", configService.isTestEnvironment());
        console.log("DEVUSER_department", configService.isDevUser());
        console.log("Terence, here is the user : " + email, "developmentMode:", isDevelopmentMode());

        let departmentData = [];


        // Get departments with pagination
        let page;
        if (isDevelopmentMode()) {
            const filterText = isDevelopmentMode() ? `Title eq '${email}'`
                : `EmployeeName/Email eq '${email}'`;  // Changed EMail to Email
            //const selectText =isDevelopmentMode() ?
            // "Department/Title" : "Department/Department";
            const selectText = "Department/Department";
            const firstExpandText = isDevelopmentMode() ?
                "Department" : "Department/FieldValuesAsText";
            const secondExpandText = isDevelopmentMode() ?
                "EmployeeName" : "EmployeeName/EMail";

            page = await sp.web.lists
                .getByTitle("UsersPerDepartment")
                .items
                .select("EmployeeName/EMail", selectText)
                .expand(firstExpandText, secondExpandText)
                .filter(filterText)
                .top(5000)   // Process 100 items at a time
                .getPaged();
        } else {
            page = await sp.web.lists
                .getByTitle("UsersPerDepartment")
                .items
                .select("EmployeeName/EMail", "Department/Department")
                .expand("Department", "EmployeeName")
                .filter(`EmployeeName/Email eq '${email}'`)
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
        // Fetches building and venue information
        // Includes venue details like capacity and facilities
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

public async checkVenueAvailability(fromDate: Date, toDate: Date, venue?: string): Promise<string[]> {
    const reservations = [];
    try {
        // Fetch all relevant reservations (without filter to avoid threshold issues)
        let page = await sp.web.lists
            .getByTitle("Request")
            .items.select(
                "Venue",
                "FromDate",
                "ToDate",
                "Status"
            )
            .top(1000) // Fetch as many as possible per page
            .getPaged();

        // Collect all pages
        while (true) {
            console.log("Processing page with results:", page.results.length);
            console.log("Page has next:", page.hasNext);
            console.log("results:", page.results);
            reservations.push(...page.results);
            if (page.hasNext) {
                page = await page.getNext();
            } else {
                break;
            }
        }

        // Filter in-memory: not Cancelled/Rejected, overlapping dates, and (if provided) matching venue
        const filtered = reservations.filter(res =>
            res.Status !== 'Cancelled' &&
            res.Status !== 'Rejected' &&
            new Date(res.FromDate) < toDate &&
            new Date(res.ToDate) > fromDate &&
            (!venue || (res.Venue && res.Venue === venue))
        );

        // Return list of venue names that are already booked
        return filtered.map(res => res.Venue);

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
    public async getFacilities() {
        // Retrieves facility information
        // Includes asset numbers and facility owners
        // Handles null checks for facility owner data
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
        let crsdUsers = [];
        let ddUsers = [];
        let fssUsers = [];
        let fssApproversUsers = [];
    
        try {
            try {
                crsdUsers = await sp.web.siteGroups.getByName("CRSD").users();
            } catch (error) {
                console.warn("Unable to fetch CRSD members:", error);
            }
    
            try {
                ddUsers = await sp.web.siteGroups.getByName("DD").users();
            } catch (error) {
                console.warn("Unable to fetch DD members:", error);
            }
    
            try {
                fssUsers = await sp.web.siteGroups.getByName("FSS").users();
            } catch (error) {
                console.warn("Unable to fetch FSS members:", error);
            }
            
            try {
                fssApproversUsers = await sp.web.siteGroups.getByName("FSS Approvers").users();
                console.log("FSS Approvers Users:", fssApproversUsers);
            } catch (error) {
                console.warn("Unable to fetch FSS Approvers members:", error);
            }
    
            return {
                crsdMembers: crsdUsers.map(item => item.Email),
                ddMembers: ddUsers.map(item => item.Email),
                fssMembers: fssUsers.map(item => item.Email),
                fssApproversMembers: fssApproversUsers.map(item => item.Email)
            };
        } catch (error) {
            console.error("Error in getGroupMembers:", error);
            return {
                crsdMembers: [],
                ddMembers: [],
                fssMembers: [],
                fssApproversMembers: []
            };
        }
    }

    public async createReservation(formData: any, facilityData: any[], files: File[], venueId: string, isFssManaged: boolean, siteURL: string) {
        // Creates new reservations
        // Handles file attachments
        // Manages reference numbers
        // Supports both regular and chunked file uploads
        // Implements optimistic concurrency with retry

        // Prevent multiple submissions
        if (this.isCreatingReservation) {
            console.warn("Reservation creation is already in progress. Please wait.");
            throw new Error("Reservation creation is already in progress. Please wait.");
            //return null; // Or throw an error
        }
        this.isCreatingReservation = true;
        console.log("createReservation started");

        const participant = JSON.stringify(formData["participant"]);
        const facility = JSON.stringify(facilityData);

        const fromDate = moment(formData["fromDate"]).toISOString();
        const toDate = moment(formData["toDate"]).toISOString();
        const venue = formData["venue"];
        const building = formData["building"]; // Capture the building for logging

        const maxRetries = 3; // Maximum number of retries
        let retryCount = 0;
        let createdItem = null; // Store the created item

        try {
            while (retryCount < maxRetries) {
                console.log(`Attempt ${retryCount + 1} to create reservation for venue: ${venue}, building: ${building}, from: ${fromDate}, to: ${toDate}`);
                // 1. Check for existing overlapping reservations
                const existingReservations = await this.checkVenueAvailability(formData["fromDate"], formData["toDate"], venue);
                console.log(`Existing reservations for venue "${venue}":`, existingReservations);

                if (existingReservations.length > 0) {
                    // Conflict found! Another reservation overlaps with this request.
                    console.warn(`Conflict detected for venue "${venue}" for the selected time range.  Retrying...`);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 500)); // Add a short delay before retrying
                    continue; // Retry the operation
                }

                // 2. Proceed with creating the reservation if no conflict is found
                const itemLength = await sp.web.lists.getByTitle('Request').items
                    .select("referCount")
                    .top(1)
                    .orderBy("Id", false)
                    .get();
                const count = itemLength.length ? Number(itemLength[0].referCount) : 0;
                const ReferenceNumber = `RR-${moment().year()}${getCount(moment().month())}-${getCount(count, 4)}`;
                console.log("Data to be saved:", {
                    Title: formData["requestedBy"],
                    RequestedBy: formData["requestedBy"],
                    Department: formData["department"],
                    Building: building, // Use the building variable
                    Venue: venue,
                    Layout: formData["layout"],
                    PrincipalUser: formData["principal"],
                    ContactPerson: formData["contactPerson"],
                    ContactNumber: formData["contactNumber"],
                    PurposeOfUse: formData["purposeOfUse"],
                    Participant: participant,
                    NoParticipant: formData["numberOfParticipant"],
                    TitleDescription: formData["titleDesc"],
                    FromDate: fromDate,
                    ToDate: toDate,
                    OtherRequirement: formData["otherRequirment"],
                    IsCSDR: formData["IsCSDR"],
                    FacilityData: facility,
                    Status: isFssManaged ? "Approved" : "Pending for Approval",
                    RequestorEmail: formData["requestorEmail"],
                    referCount: `${count + 1}`,
                    ReferenceNumber: ReferenceNumber,
                });
                const item = await sp.web.lists.getByTitle('Request').items.add({
                    Title: formData["requestedBy"],
                    RequestedBy: formData["requestedBy"],
                    Department: formData["department"],
                    Building: building, // Use the building variable
                    Venue: venue,
                    Layout: formData["layout"],
                    PrincipalUser: formData["principal"],
                    ContactPerson: formData["contactPerson"],
                    ContactNumber: formData["contactNumber"],
                    PurposeOfUse: formData["purposeOfUse"],
                    Participant: participant,
                    NoParticipant: formData["numberOfParticipant"],
                    TitleDescription: formData["titleDesc"],
                    FromDate: fromDate,
                    ToDate: toDate,
                    OtherRequirement: formData["otherRequirment"],
                    IsCSDR: formData["IsCSDR"],
                    FacilityData: facility,
                    Status: isFssManaged ? "Approved" : "Pending for Approval",
                    RequestorEmail: formData["requestorEmail"],
                    referCount: `${count + 1}`,
                    ReferenceNumber: ReferenceNumber,
                });
                createdItem = item.data;
                console.log("Created item:", createdItem);
                break; // Exit the retry loop if successful
            }

            if (!createdItem) {
                // If the loop finishes without success, throw an error
                throw new Error(`Failed to create reservation after ${maxRetries} attempts.`);
            }

            if (files.length > 0) {
                const _itemId = createdItem.ID;
                //const f = configService.isDevUser() ? "/sites/ResourceReservationDev" + "/ReservationDocs/" + createdItem.GUID : "/sites/ResourceReservation" + "/ReservationDocs/" + createdItem.GUID;
                const cleanSiteUrl = (url: string): string => {
                    try {
                        // Method 1: Using URL object
                        const urlObj = new URL(url);
                        return urlObj.pathname;
                    } catch {
                        // Method 2: Fallback to string manipulation
                        return url.replace(/^https?:\/\/[^\/]+/, '');
                    }
                };
                const f = cleanSiteUrl(siteURL) + "/ReservationDocs/" + createdItem.GUID;
                console.log("this is the folder path", f);
                await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders.add(createdItem.GUID)
                    .then(r => {
                        Promise.all(files.map((file) => {
                            if (file.size <= 10485760) {
                                // Regular file upload
                                return sp.web.getFolderByServerRelativeUrl(f).files.add(file.name, file, true)
                                    .then(fileResult => {
                                        return fileResult.file.getItem()
                                            .then(fileItem => {  // Renamed from 'item' to 'fileItem'
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
                                .then((fileItem: any) => {  // Renamed from 'item' to 'fileItem'
                                    return fileItem.update({
                                        RequestId: _itemId
                                    });
                                });
                        }
                    }));
                    });
            }

            return createdItem;

        } catch (error) { // Removed : any
            console.error("Error creating reservation:", error);
            // Optionally, provide more specific feedback to the user based on the error.
            throw error; // Re-throw the error to be handled by the calling component.
        } finally {
            // Reset the flag after the operation is complete (success or failure)
            this.isCreatingReservation = false;
            console.log("createReservation completed");
        }
    }

    public async saveEmailData(emailProps: IEmailProperties, url: string): Promise<boolean> {
        try {
            // Extract reference number from subject
            const refNoMatch = emailProps.Subject.match(/(?:Request:|No\.|:)\s*([^.]+)/);
            const referenceNo = refNoMatch ? refNoMatch[1].trim() : '';
            console.log("Body", emailProps.Body);
            // Save to SharePoint list
            await sp.web.lists.getByTitle("EmailDataForPA").items.add({
                ReferenceNo: referenceNo,
                To: emailProps.To  ? [...new Set(emailProps.To)].join(';') : '',
                CC:  emailProps.CC ? [...new Set(emailProps.CC)].join(';') : '',
                SendAsFrom: emailProps.From,
                Subject: emailProps.Subject,
                Body: emailProps.Body,
                RecordUrl: url
            });

            return true;
        } catch (error) {
            console.error("Failed to save email data:", error);
            return false;
        }
    }
}
//TestComment[...new Set(emailProps.To)].join(';') : '';
