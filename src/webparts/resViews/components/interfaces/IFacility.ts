export interface IFacilityData {
  facility: string;
  quantity: string;
  assetNumber: string;
}

export interface IDropdownItem {
  id: string;
  value: string;
}

export interface IFacilityMapItem {
  Title: string;
  AssetNumber: string;
  Facility: string;
  Quantity: number;
  FacilityOwner: string;
}

export interface IFacilityDialogProps {
  open: boolean;
  onClose: () => void;
  facilityList: IDropdownItem[];
  quantityList: IDropdownItem[];
  formik: any;
  onSave: (form: any) => void;
  onDelete: (form: any) => void;
  onFacilityChange: (e: any, formik: any) => void;
}
