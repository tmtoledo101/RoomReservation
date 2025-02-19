
{/* The ResReservation component serves as the main entry point for the Resource Reservation System web part in SharePoint. 
  It acts as a container component that renders the main reservation form.*/}
import * as React from "react";
import { ResReservationForm } from "./ResReservationForm";
import { IResReservationProps } from "./IResReservationProps";

export default class ResReservation extends React.Component<IResReservationProps> {
  public render(): React.ReactElement<IResReservationProps> {
    return (
      <ResReservationForm 
        siteUrl={this.props.siteUrl}
        description=""
        context={this.props.context}
      />
    );
  }
}
