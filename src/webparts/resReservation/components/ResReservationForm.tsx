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
import { hasGroupMembersAccess } from "../../shared/utils/enivronmentHelper";


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
    console.log("Terence, this the departments:", departments);
    console.log("Terence, this the departmentSectorMap:", departmentSectorMap);
    const { buildings, venues } = await this.spService.getBuildings();
    const layouts = await this.spService.getLayouts();
    const purposeOfUse = await this.spService.getPurposeOfUse();
    const participants = await this.spService.getParticipants();
    const facilityMap = await this.spService.getFacilities();
    const { crsdMembers, ddMembers, fssMembers } = hasGroupMembersAccess() ? await this.spService.getGroupMembers(): { crsdMembers: [], ddMembers: [], fssMembers: [] };
    
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
      crsdMemberList: crsdMembers,
      ddMemeberList: ddMembers,
      fssMemberList: fssMembers,
      requestorEmail: currentUser.Email,
    });

    this.formikRef.current.setFieldValue("requestedBy", currentUser.Title);
  }

  private resetFormFields(preserveBuilding: boolean = false, preserveVenue: boolean = false): void {
    const formikInstance = this.formikRef.current;
    const currentPrincipal = formikInstance.values.principal;
    const currentBuilding = formikInstance.values.building;
    const currentVenue = formikInstance.values.venue;
    
    // Only reset venue if not preserving it
    if (!preserveVenue) {
      formikInstance.setFieldValue("venue", "");
    } else {
      formikInstance.setFieldValue("venue", currentVenue);
    }

    // Handle building field
    if (!preserveBuilding) {
      formikInstance.setFieldValue("building", "");
    } else {
      formikInstance.setFieldValue("building", currentBuilding);
    }

    // Always reset these fields
    formikInstance.setFieldValue("layout", "");
    formikInstance.setFieldValue("contactPerson", "");
    formikInstance.setFieldValue("isCSDR", false);
    
    // Always preserve principal if it exists
    if (currentPrincipal) {
      formikInstance.setFieldValue("principal", currentPrincipal);
    }
    
    console.log("ResReservationForm - After reset:", {
      principal: formikInstance.values.principal,
      building: formikInstance.values.building,
      venue: formikInstance.values.venue
    });
  }

  private createQuantityList(quantity: number): IDropdownItem[] {
    return Array.from({ length: quantity }, (_, i) => ({
      id: (i + 1).toString(),
      value: (i + 1).toString()
    }));
  }

  private handleDepartmentChange = async (e: any, preserveBuilding: boolean = false): Promise<void> => {
    const { value } = e.target;
    console.log("ResReservationForm - Department changing to:", value, "preserveBuilding:", preserveBuilding);
    
    try {
      // First update formik values
      await this.formikRef.current.setFieldValue("department", value);
      await this.formikRef.current.setFieldTouched("department", true);
      console.log("ResReservationForm - Department set in formik:", this.formikRef.current.values.department);

      // Then update FSS state
      let newVenue = this.venue;
      const { venueList: data } = this.state;
      const isFssManaged = value ? this.state.departmentSectorMap[value] === "FSS" : false;
      
      // If department is cleared, reset all venue-related fields
      if (!value) {
        console.log("ResReservationForm - Department cleared, resetting all venue-related fields");
        const departmentFormik = this.formikRef.current;
        departmentFormik.setFieldValue("venue", "");
        departmentFormik.setFieldTouched("venue", false);
        departmentFormik.setFieldValue("isCSDR", false);
        departmentFormik.setFieldTouched("isCSDR", false);
        departmentFormik.setFieldValue("layout", "");
        departmentFormik.setFieldTouched("layout", false);
        newVenue = [];
      } else if (!isFssManaged) {
        newVenue = data.filter((item) => item.exclusiveTo !== "FSS");
      }

      // Get current venue value before state update
      const currentVenue = this.formikRef.current.values.venue;
      console.log("ResReservationForm - Current venue before state update:", currentVenue);
      
      // Check if current venue will still be valid after update
      const willVenueBeValid = currentVenue ? newVenue.some(v => v.value === currentVenue) : false;
      console.log("ResReservationForm - Will venue remain valid:", willVenueBeValid);

      // Update state and wait for it to complete
      await new Promise<void>(resolve => {
        this.setState({
          isFssManaged,
          venueList: newVenue,
          venueImage: willVenueBeValid ? this.state.venueImage : "https://wallpaperaccess.com/full/2119702.jpg",
          showCSRDField: false,
          toggler: !this.state.toggler,
          facilitiesAvailable: willVenueBeValid ? this.state.facilitiesAvailable : "",
          capacityperLayout: willVenueBeValid ? this.state.capacityperLayout : "",
          facilityData: [],
          selectedID: willVenueBeValid ? this.state.selectedID : 0,
          princialList: [] // Clear principal list when department changes
        }, resolve);
      });

      // If venue will become invalid, reset venue-related fields
      if (!willVenueBeValid && currentVenue) {
        console.log("ResReservationForm - Resetting venue and related fields as venue is no longer valid");
        const invalidVenueFormik = this.formikRef.current;
        invalidVenueFormik.setFieldValue("venue", "");
        invalidVenueFormik.setFieldTouched("venue", false);
        invalidVenueFormik.setFieldValue("isCSDR", false);
        invalidVenueFormik.setFieldTouched("isCSDR", false);
        invalidVenueFormik.setFieldValue("layout", "");
        invalidVenueFormik.setFieldTouched("layout", false);
      }

      // Get principal users for the new department if it exists
      if (value) {
        try {
          const principalMap = await this.spService.getPrincipalUsers(value);
          console.log("ResReservationForm - Principal map for new department:", principalMap);
          
          if (principalMap[value]) {
            const principalList = principalMap[value].sort().map(name => ({
              id: name,
              value: name
            }));
            console.log("ResReservationForm - Setting principal list for new department:", principalList);
            
            await new Promise<void>(resolve => {
              this.setState({
                princialList: principalList
              }, resolve);
            });
          }
        } catch (error) {
          console.error("Error getting principal users for new department:", error);
        }
      }

      // Reset non-venue related fields
      const formikInstance = this.formikRef.current;
      
      // Handle building field
      if (!preserveBuilding) {
        formikInstance.setFieldValue("building", "");
        formikInstance.setFieldTouched("building", false);
      }

      // Always reset contact person
      formikInstance.setFieldValue("contactPerson", "");
      formikInstance.setFieldTouched("contactPerson", false);
      
      console.log("ResReservationForm - Department change complete:", {
        formikValues: this.formikRef.current.values,
        state: {
          isFssManaged: this.state.isFssManaged,
          showCSRDField: this.state.showCSRDField,
          principalList: this.state.princialList
        }
      });
    } catch (error) {
      console.error("ResReservationForm - Error in handleDepartmentChange:", error);
    }
  }

  private handleVenueChange = async (e: any): Promise<void> => {
    try {
      const { value } = e.target;
      console.log("ResReservationForm - Starting venue change with value:", value);

      // Check if department is set
      const currentDepartment = this.formikRef.current.values.department;
      if (!currentDepartment && value) {
        console.log("ResReservationForm - Cannot select venue without department");
        const formikInstance = this.formikRef.current;
        formikInstance.setFieldValue("venue", "");
        formikInstance.setFieldTouched("venue", false);
        return;
      }

      // If venue is cleared, reset all venue-related fields
      if (!value) {
        console.log("ResReservationForm - Venue cleared, resetting all venue-related fields");
        const venueFormik = this.formikRef.current;
        venueFormik.setFieldValue("venue", "");
        venueFormik.setFieldTouched("venue", false);
        venueFormik.setFieldValue("isCSDR", false);
        venueFormik.setFieldTouched("isCSDR", false);
        venueFormik.setFieldValue("layout", "");
        venueFormik.setFieldTouched("layout", false);

        this.setState({
          venueImage: "https://wallpaperaccess.com/full/2119702.jpg",
          facilitiesAvailable: "",
          capacityperLayout: "",
          venueId: "",
          selectedID: 0,
          showCSRDField: false,
          layoutList: [],
          princialList: []
        });
        return;
      }
      
      const selectedVenue = this.state.venueList.find(v => v.value === value);
      console.log("ResReservationForm - Selected venue:", selectedVenue);
      
      // Validate that selected venue exists in current venue list
      if (!selectedVenue) {
        console.log("ResReservationForm - Selected venue not found in current venue list");
        const validateVenueFormik = this.formikRef.current;
        validateVenueFormik.setFieldValue("venue", "");
        validateVenueFormik.setFieldTouched("venue", false);
        validateVenueFormik.setFieldValue("isCSDR", false);
        validateVenueFormik.setFieldTouched("isCSDR", false);
        validateVenueFormik.setFieldValue("layout", "");
        validateVenueFormik.setFieldTouched("layout", false);

        this.setState({
          venueImage: "https://wallpaperaccess.com/full/2119702.jpg",
          facilitiesAvailable: "",
          capacityperLayout: "",
          venueId: "",
          selectedID: 0,
          showCSRDField: false,
          layoutList: [],
          princialList: []
        });
        return;
      }
      
      // Process valid venue selection
      const isCRSD = selectedVenue.group === 'CRSD';
      const layouts = this.layout[value] || [];
      
      // Set venue and CRSD values first
      this.formikRef.current.setFieldValue("venue", value);
      this.formikRef.current.setFieldTouched("venue", true);
      
      this.formikRef.current.setFieldValue("isCSDR", isCRSD);
      this.formikRef.current.setFieldTouched("isCSDR", true);
      
      // Update state and wait for it to complete
      await new Promise<void>(resolve => {
        this.setState({
          venueImage: selectedVenue.venueImage,
          facilitiesAvailable: JSON.parse(selectedVenue.facilitiesAvailable),
          capacityperLayout: selectedVenue.capacityperLayout,
          venueId: selectedVenue.venueId,
          selectedID: selectedVenue.itemId,
          showCSRDField: isCRSD,
          layoutList: layouts,
        }, resolve);
      });

      if (isCRSD) {
        // Get the department value
        const selectedDepartment = this.formikRef.current.values.department;
        console.log("ResReservationForm - Department value for principal users:", selectedDepartment);
        
        if (selectedDepartment) {
          try {
            // Get principal users
            const principalMap = await this.spService.getPrincipalUsers(selectedDepartment);
            console.log("ResReservationForm - Principal map:", principalMap);
            
            if (principalMap[selectedDepartment]) {
              const principalList = principalMap[selectedDepartment].sort().map(name => ({
                id: name,
                value: name
              }));
              console.log("ResReservationForm - Setting principal list:", principalList);
              
              // Wait for principal list to be set
              await new Promise<void>(resolve => {
                this.setState({
                  princialList: principalList
                }, resolve);
              });

              // Only reset principal value if it's not in the new principal list
              const currentPrincipal = this.formikRef.current.values.principal;
              if (currentPrincipal && !principalList.find(p => p.value === currentPrincipal)) {
                await this.formikRef.current.setFieldValue("principal", "");
                await this.formikRef.current.setFieldTouched("principal", true);
              }
              
              console.log("ResReservationForm - Venue change complete:", {
                venue: value,
                isCRSD,
                department: selectedDepartment,
                principalList,
                currentPrincipal,
                formikValues: this.formikRef.current.values,
                touched: this.formikRef.current.touched
              });
            } else {
              console.log("ResReservationForm - No principals found for department:", selectedDepartment);
            }
          } catch (error) {
            console.error("Error getting principal users:", error);
          }
        } else {
          console.log("ResReservationForm - Department value is not set");
        }
      }
    } catch (error) {
      console.error("Error in handleVenueChange:", error);
    }
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

  private handleSave = async (formikProps): Promise<void> => {
    try {
      this.setState({ saveStart: true });
      
      const result = await this.spService.createReservation(
        formikProps.values,
        this.state.facilityData,
        this.state.files,
        this.state.venueId,
        this.state.isFssManaged
      );

      try {
        //const toEmails = [this.state.requestorEmail];
        const toEmails = ['tmtoledo@kpmg.com'];
        const ccEmails = [
          ...(formikProps.values.isCSDR ? this.state.crsdMemberList : []),
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
          formikProps.values,
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
    const initialValues: IResReservationFormValues = {
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
      isCSDR: false,
      assetNumber: "", // Add missing field
    };

    return (
      <Formik<IResReservationFormValues>
        initialValues={initialValues}
        validationSchema={validationSchema}
        innerRef={this.formikRef}
        onSubmit={() => this.setState({ saveDialog: true })}
      >
        {(formikProps) => (
          <form onSubmit={formikProps.handleSubmit}>
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
                    participantLength={formikProps.values.participant.length}
                  />

                  <FacilitySection
                    showCSRDField={this.state.showCSRDField}
                    facilityData={this.state.facilityData}
                    onAddClick={() => this.setState({ showFacilityDialog: true })}
                    onEditClick={(index) => {
                      const data = this.state.facilityData[index];
                      formikProps.setFieldValue("facility", data.facility);
                      formikProps.setFieldValue("quantity", data.quantity);
                      formikProps.setFieldValue("assetNumber", data.assetNumber);
                      formikProps.setFieldValue("currentRecord", index);
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
              formik={formikProps}
              onSave={this.handleFacilitySave}
              onDelete={this.handleFacilityDelete}
              onFacilityChange={this.handleFacilityChange}
            />

            <ConfirmationDialog
              open={this.state.saveDialog}
              onClose={() => this.setState({ saveDialog: false })}
              onConfirm={() => this.handleSave(formikProps)}
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
              name="isCSDR"
              style={{ display: "none" }}
              {...formikProps.getFieldProps("isCSDR")}
            />
          </form>
        )}
      </Formik>
    );
  }
}
