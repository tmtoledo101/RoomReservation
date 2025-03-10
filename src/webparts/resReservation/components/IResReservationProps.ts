import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IResReservationProps {
  context: WebPartContext;
  description: string;
  siteUrl: string;
  //siteRelativeUrl :string;
}

export interface IResReservationFormProps extends IResReservationProps {
  // Add any additional props specific to the form component
}
