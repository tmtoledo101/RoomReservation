/*
This file defines the interfaces for the ResReservation component, including the data structures for facility data,
 * venue items, dropdown items, reservation state, reservation form values, and facility map items.
 */

export interface IFacilityData {
    facility: string;
    quantity: string;
    assetNumber: string;
  }
  
  export interface IVenueItem {
    id: string;
    value: string;
    venueImage: string;
    facilitiesAvailable: string;
    exclusiveTo: string;
    group: string;
    capacityperLayout: string;
    venueId: string;
    building: string;
    itemId: number;
  }
  
  export interface IDropdownItem {
    id: string;
    value: string;
  }
  
  export interface IResReservationState {
    departmentList: IDropdownItem[];
    buildingList: IDropdownItem[];
    departmentSectorMap: { [key: string]: string };
    venueList: IVenueItem[];
    showCSRDField: boolean;
    layoutList: IDropdownItem[];
    venueImage: string;
    toggler: boolean;
    facilitiesAvailable: string;
    capacityperLayout: string;
    princialList: IDropdownItem[];
    participantList: IDropdownItem[];
    purposeOfUseList: IDropdownItem[];
    showFacilityDialog: boolean;
    facilityList: IDropdownItem[];
    quantityList: IDropdownItem[];
    facilityData: IFacilityData[];
    saveDialog: boolean;
    files: File[];
    crsdMemberList: string[];
    requestorEmail: string;
    isSavingDone: boolean;
    isSavingFailure: boolean;
    isFssManaged: boolean;
    saveStart: boolean;
    venueId: string;
    failureMessage: string;
    selectedID: number;
    ddMemeberList: string[];
    isddMember: boolean;
    fssMemberList: string[];
  }
  
  export interface IResReservationFormValues {
    requestedBy: string;
    department: string;
    building: string;
    venue: string;
    layout: string;
    contactPerson: string;
    principal: string;
    numberOfParticipant: string;
    fromDate: string;
    toDate: string;
    facility: string;
    quantity: string;
    otherRequirment: string;
    titleDesc: string;
    participant: string[];
    purposeOfUse: string;
    contactNumber: string;
    currentRecord: number;
    isCSDR: boolean;
    assetNumber: string;
  }
  
  export interface IFacilityMapItem {
    Title: string;
    AssetNumber: string;
    Facility: string;
    Quantity: number;
    FacilityOwner: string;
  }
  