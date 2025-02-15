import * as React from "react";
import { Formik } from "formik";
import { Grid, Button, Checkbox } from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import CloseIcon from "@material-ui/icons/Close";

import { BasicInformation } from "./common/BasicInformation";
import { VenueSelection } from "./common/VenueSelection";
import { CSRDFields } from "./common/CSRDFields";
import { ParticipantInformation } from "./common/ParticipantInformation";
import { DateTimeSelection } from "./common/DateTimeSelection";
import { FacilitySection } from "./common/FacilitySection";
import { FacilityDialog } from "./common/FacilityDialog";
import { ConfirmationDialog } from "./common/ConfirmationDialog";
import { Notification } from "./common/Notification";
import { SharePointService } from "./services/SharePointService";
import { validationSchema } from "./utils/validation";
import { newResEmail } from "./utils/helpers";
import { IResReservationState, IResReservationFormValues, IDropdownItem } from "./interfaces/IResReservation";
import { IResReservationFormProps } from "./IResReservationProps";
import styles from "./ResReservation.module.scss";

export class ResReservationForm extends React.Component<IResReservationFormProps, IResReservationState> {
  private spService: SharePointService;
  private formikRef: any;
  private venue: any;
  private layout: any;
  private facilityMap: any;

  constructor(props: IResReservationFormProps) {
    super(props);
    this.spService = new SharePointService();
    this.formikRef = React.createRef();
    this.state = {
      departmentList: [],
      buildingList: [],
      venueList: [],
      departmentSectorMap: {},
      showCSRDField: false,
      layoutList: [],
      venueImage: "https://wallpaperaccess.com/full/2119702.jpg",
      toggler: false,
      facilitiesAvailable: "",
      capacityperLayout: "",
      princialList: [],
      participantList: [],
      purposeOfUseList: [],
      showFacilityDialog: false,
      facilityList: [],
      quantityList: [],
      facilityData: [],
      saveDialog: false,
      files: [],
      crsdMemberList: [],
      ddMemeberList: [],
      fssMemberList: [],
      requestorEmail: "",
      isSavingDone: false,
      isSavingFailure: false,
      isFssManaged: false,
      saveStart: false,
      failureMessage: "",
      venueId: "",
      selectedID: 0,
      isddMember: false,
    };
  }

  public async componentDidMount(): Promise<void> {
    await this.initializeForm();
  }

  private async initializeForm(): Promise<void> {
    const currentUser = await this.spService.getCurrentUser();
    console.log("Terence, this the current user:");
    console.log(currentUser);
    const { departments, departmentSectorMap } = await this.spService.getDepartments(currentUser.Email);
    const { buildings, venues } = await this.spService.getBuildings();
    const layouts = await this.spService.getLayouts();
    const purposeOfUse = await this.spService.getPurposeOfUse();
    const participants = await this.spService.getParticipants();
    const facilityMap = await this.spService.getFacilities();
    //const { crsdMembers, ddMembers, fssMembers } = await this.spService.getGroupMembers();
    
    this.venue = venues;
    this.layout = layouts;
    this.facilityMap = facilityMap;

    // Convert facilityMap to facilityList dropdown format
    const facilityList = Object.keys(facilityMap).map(facility => ({
      id: facility,
      value: facility
    }));

    const buildingList = buildings.map((item, index) => ({
      id: index.toString(),
      value: item.value
    }));

    this.setState({
      departmentList: departments,
      departmentSectorMap,
      buildingList,
      venueList: venues,
      purposeOfUseList: purposeOfUse,
      participantList: participants,
      facilityList, // Add the facilityList to state
      //crsdMemberList: crsdMembers,
      //ddMemeberList: ddMembers,
      //fssMemberList: fssMembers,
      requestorEmail: currentUser.Email,
    });

    this.formikRef.current.setFieldValue("requestedBy", currentUser.Title);
  }

  private resetFormFields(): void {
    const formik = this.formikRef.current;
    formik.setFieldValue("venue", "");
    formik.setFieldValue("building", "");
    formik.setFieldValue("layout", "");
    formik.setFieldValue("principal", "");
    formik.setFieldValue("contactPerson", "");
    formik.setFieldValue("isCSDR", false);
  }

  private createQuantityList(quantity: number): IDropdownItem[] {
    return Array.from({ length: quantity }, (_, i) => ({
      id: (i + 1).toString(),
      value: (i + 1).toString()
    }));
  }

  private handleDepartmentChange = (e: any): void => {
    const { value } = e.target;
    let newVenue = this.venue;
    const { venueList: data } = this.state;
    
    if (value && this.state.departmentSectorMap[value] !== "FSS") {
      newVenue = data.filter((item) => item.exclusiveTo !== "FSS");
      this.setState({ isFssManaged: false });
    } else {
      this.setState({ isFssManaged: true });
    }

    this.setState({
      venueList: newVenue,
      venueImage: "https://wallpaperaccess.com/full/2119702.jpg",
      showCSRDField: false,
      toggler: !this.state.toggler,
      facilitiesAvailable: "",
      capacityperLayout: "",
      facilityData: [],
      selectedID: 0,
    });

    this.resetFormFields();
  }

  private handleVenueChange = async (e: any): Promise<void> => {
    const { value } = e.target;
    const selectedVenue = this.state.venueList.find(v => v.value === value);
    
    if (selectedVenue) {
      const isCRSD = selectedVenue.group === 'CRSD';
      const layouts = this.layout[value] || [];

      this.setState({
        venueImage: selectedVenue.venueImage,
        facilitiesAvailable: JSON.parse(selectedVenue.facilitiesAvailable),
        capacityperLayout: selectedVenue.capacityperLayout,
        venueId: selectedVenue.venueId,
        selectedID: selectedVenue.itemId,
        showCSRDField: isCRSD,
        layoutList: layouts,
      });

      if (isCRSD) {
        const department = this.formikRef.current.values.department;
        const principalMap = await this.spService.getPrincipalUsers(department);
        if (principalMap[department]) {
          this.setState({
            princialList: principalMap[department].sort().map(name => ({ id: name, value: name })),
          });
        }
      }
    }

    this.formikRef.current.setFieldValue("venue", value);
    this.formikRef.current.setFieldValue("IsCSDR", selectedVenue && selectedVenue.group === 'CRSD');
  }

  private participantHandler = (e: any): void => {
    const { value } = e.target;
    this.setState({
      isddMember: !(value.indexOf('BSP-QC Personnel') > -1 && value.length === 1),
    });
  }

  private handleFacilitySave = (form: any): void => {
    const newFacilityData = [...this.state.facilityData];
    const facilityItem = {
      facility: form.values.facility,
      quantity: form.values.quantity,
      assetNumber: form.values.assetNumber,
    };
    
    if (form.values.currentRecord >= 0) {
      newFacilityData[form.values.currentRecord] = facilityItem;
    } else {
      newFacilityData.push(facilityItem);
    }

    this.setState({
      facilityData: newFacilityData,
      showFacilityDialog: false,
    });
    form.setFieldValue("currentRecord", -1);
  }

  private handleFacilityDelete = (form: any): void => {
    const newFacilityData = [...this.state.facilityData];
    newFacilityData.splice(form.values.currentRecord, 1);
    this.setState({
      facilityData: newFacilityData,
      showFacilityDialog: false,
    });
    form.setFieldValue("currentRecord", -1);
  }

  private handleFacilityChange = (e: any): void => {
    const facility = e.target.value as string;
    const quantity = this.facilityMap[facility].Quantity;
    this.setState({
      quantityList: this.createQuantityList(quantity)
    });
    this.formikRef.current.setFieldValue("assetNumber", this.facilityMap[facility].AssetNumber);
  }

  private handleSave = async (formik): Promise<void> => {
    try {
      this.setState({ saveStart: true });
      
      const result = await this.spService.createReservation(
        formik.values,
        this.state.facilityData,
        this.state.files,
        this.state.venueId,
        this.state.isFssManaged
      );

      try {
        //const toEmails = [this.state.requestorEmail];
        const toEmails = ['tmtoledo@kpmg.com'];
        const ccEmails = [
          ...(formik.values.isCSDR ? this.state.crsdMemberList : []),
          ...(this.state.isFssManaged ? this.state.fssMemberList : []),
          ...(this.state.isddMember ? this.state.ddMemeberList : []),
          ...(this.state.facilityData.length > 0 
            ? this.state.facilityData.map(facility => this.facilityMap[facility.facility].FacilityOwner)
            : []
          ),
        ];

        await newResEmail(
          this.props.context,
          toEmails,
          [...new Set(ccEmails)],
          formik.values,
          this.state.isFssManaged ? 4 : 1,
          this.state.facilitiesAvailable,
          this.props.siteUrl,
          result.ReferenceNumber
        );
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      this.setState({
        isSavingDone: true,
        saveDialog: false,
      });
    
      setTimeout(() => {
        window.location.href = this.props.siteUrl + "/SitePages/Home.aspx";
      }, 1500);
    
    } catch (error) {
      console.error('Error in handleSave:', error);
      this.setState({
        isSavingFailure: true,
        saveStart: false,
        failureMessage: "Error creating reservation. Please contact admin.",
      });
    }
  }

  public render(): React.ReactElement<IResReservationFormProps> {
    return (
      <Formik
        initialValues={{
          requestedBy: "",
          department: "",
          venue: "",
          building: "",
          layout: "",
          contactPerson: "",
          principal: "",
          numberOfParticipant: "",
          fromDate: "",
          toDate: "",
          facility: "",
          quantity: "",
          otherRequirment: "",
          titleDesc: "",
          participant: [],
          purposeOfUse: "",
          contactNumber: "",
          currentRecord: -1,
          IsCSDR: false,
        }}
        validationSchema={validationSchema}
        innerRef={this.formikRef}
        onSubmit={() => this.setState({ saveDialog: true })}
      >
        {(formik) => (
          <form onSubmit={formik.handleSubmit}>
            <div className={styles.resReservation}>
              <div className={styles.container}>
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <h2>New Room Reservation Request</h2>
                  </Grid>

                  <BasicInformation
                    departmentList={this.state.departmentList}
                    onDepartmentChange={this.handleDepartmentChange}
                  />

                  <VenueSelection
                    buildingList={this.state.buildingList}
                    venueList={this.state.venueList}
                    departmentList={this.state.departmentList}
                    departmentSectorMap={this.state.departmentSectorMap}
                    onVenueChange={this.handleVenueChange}
                    onDepartmentChange={this.handleDepartmentChange}
                    venueImage={this.state.venueImage}
                    capacityperLayout={this.state.capacityperLayout}
                    facilitiesAvailable={this.state.facilitiesAvailable}
                  />

                  <DateTimeSelection />

                  <CSRDFields
                    showCSRDField={this.state.showCSRDField}
                    layoutList={this.state.layoutList}
                    principalList={this.state.princialList}
                  />

                  <ParticipantInformation
                    participantList={this.state.participantList}
                    purposeOfUseList={this.state.purposeOfUseList}
                    onParticipantChange={this.participantHandler}
                    showCSRDField={this.state.showCSRDField}
                    isddMember={this.state.isddMember}
                    participantLength={formik.values.participant.length}
                  />

                  <FacilitySection
                    showCSRDField={this.state.showCSRDField}
                    facilityData={this.state.facilityData}
                    onAddClick={() => this.setState({ showFacilityDialog: true })}
                    onEditClick={(index) => {
                      const data = this.state.facilityData[index];
                      formik.setFieldValue("facility", data.facility);
                      formik.setFieldValue("quantity", data.quantity);
                      formik.setFieldValue("assetNumber", data.assetNumber);
                      formik.setFieldValue("currentRecord", index);
                      this.setState({ showFacilityDialog: true });
                    }}
                    onFilesChange={(files) => this.setState({ files })}
                  />

                  <Grid item xs={12}>
                    <div className={styles.formHandle}>
                      <Button
                        type="button"
                        variant="contained"
                        startIcon={<CloseIcon />}
                        onClick={() => window.location.href = this.props.siteUrl + "/SitePages/Home.aspx"}
                        style={{ color: "lightgrey", background: "grey" }}
                      >
                        Close
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        color="secondary"
                        disabled={this.state.saveStart}
                      >
                        Save
                      </Button>
                    </div>
                  </Grid>
                </Grid>
              </div>
            </div>

            <FacilityDialog
              open={this.state.showFacilityDialog}
              onClose={() => this.setState({ showFacilityDialog: false })}
              facilityList={this.state.facilityList}
              quantityList={this.state.quantityList}
              formik={formik}
              onSave={this.handleFacilitySave}
              onDelete={this.handleFacilityDelete}
              onFacilityChange={this.handleFacilityChange}
            />

            <ConfirmationDialog
              open={this.state.saveDialog}
              onClose={() => this.setState({ saveDialog: false })}
              onConfirm={() => this.handleSave(formik)}
              title="Confirm Reservation"
              message="Do you want to create this request?"
            />

            <Notification
              open={this.state.isSavingDone}
              message="Entry has been created successfully"
              severity="success"
            />

            <Notification
              open={this.state.isSavingFailure}
              message={this.state.failureMessage}
              severity="error"
              onClose={() => this.setState({ isSavingFailure: false })}
            />

            <Checkbox
              color="primary"
              name="IsCSDR"
              style={{ display: "none" }}
              {...formik.getFieldProps("isCSDR")}
            />
          </form>
        )}
      </Formik>
    );
  }
}
