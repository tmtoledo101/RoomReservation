/**
 * IResDisplayState.ts:
 *
 * This file defines the interface for the ResDisplay component's state.
 */
import { IDropdownItem, IFacilityData, IVenueData } from "./interfaces/IResDisplay";

export interface IResDisplayState {
  showCSRDField: boolean;
  venueImage: string;
  capacityperLayout: string;
  facilitiesAvailable: string;
  facilityData: IFacilityData[];
  Files: string[];
  isEdit: boolean;
  currentUser: string;
  requestor: string;
  departmentList: IDropdownItem[];
  buildingList: IDropdownItem[];
  venueList: IVenueData[];
  departmentSectorMap: { [key: string]: string };
  layoutList: IDropdownItem[];
  toggler: boolean;
  princialList: IDropdownItem[];
  participantList: IDropdownItem[];
  purposeOfUseList: IDropdownItem[];
  showFacilityDialog: boolean;
  facilityList: IDropdownItem[];
  quantityList: IDropdownItem[];
  saveDialog: boolean;
  files: File[];
  approverList: string[];
  guid: string;
  status: string;
  newStatus: string;
  crsdMemberList: string[];
  requestorEmail: string;
  isSavingDone: boolean;
  isSavingFailure: boolean;
  saveStart: boolean;
  ddMemeberList: string[];
  venueId: string;
  selectedID: string;
  isFssManaged: boolean;
  isDDMember: boolean;
}
