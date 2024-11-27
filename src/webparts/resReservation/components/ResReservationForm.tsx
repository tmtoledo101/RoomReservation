import * as React from "react";
import { Formik } from "formik";
import { Grid, Button, Checkbox } from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import CloseIcon from "@material-ui/icons/Close";
import { DropzoneArea } from "material-ui-dropzone";

import { CustomInput, Dropdown, CustomDateTimePicker } from "./common/FormComponents";
import { FacilityDialog } from "./common/FacilityDialog";
import { ConfirmationDialog } from "./common/ConfirmationDialog";
import { VenueDetails } from "./common/VenueDetails";
import { FacilityList } from "./common/FacilityList";
import { Notification } from "./common/Notification";
import { SharePointService } from "./services/SharePointService";
import { validationSchema } from "./utils/validation";
import { IResReservationState, IResReservationFormValues, IDropdownItem } from "./interfaces/IResReservation";
import { IResReservationFormProps } from "./IResReservationProps";
import styles from "./ResReservation.module.scss";

export class ResReservationForm extends React.Component<IResReservationFormProps, IResReservationState> {
  private spService: SharePointService;
  private formikRef: any;
  private venue: any;
  private layout: any;
  private facilityMap: any;
  private venueState: any;

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

  public async componentDidMount() {
    await this.initializeForm();
  }

  private async initializeForm() {
    console.log("RRF1")
    const currentUser = await this.spService.getCurrentUser();
    const { departments, departmentSectorMap } = await this.spService.getDepartments(currentUser.Title);
    console.log("RRF_getDepartments");
    const { buildings, venues } = await this.spService.getBuildings();
    console.log("RRF_getBuilding");
    const layouts = await this.spService.getLayouts();
    console.log("RRF_getLayouts");
    const purposeOfUse = await this.spService.getPurposeOfUse();
    console.log("RRF_getPurposeOfUse");
    const participants = await this.spService.getParticipants();
    console.log("RRF_getParticipants");
    const facilityMap = await this.spService.getFacilities();
    console.log("RRF_getFacilities");
    const { crsdMembers, ddMembers, fssMembers } = await this.spService.getGroupMembers();
    console.log("RRF_getGroupMembers");
    this.venue = venues;
    this.layout = layouts;
    this.facilityMap = facilityMap;

    const buildingList: IDropdownItem[] = buildings.map((item, index) => ({
      id: index.toString(),
      value: item.value
    }));
    console.log("buildingList")
    console.log(buildingList)
    this.setState({
      departmentList: departments,
      departmentSectorMap,
      buildingList,
      venueList: venues,
      purposeOfUseList: purposeOfUse,
      participantList: participants,
      crsdMemberList: crsdMembers,
      ddMemeberList: ddMembers,
      fssMemberList: fssMembers,
      requestorEmail: currentUser.Email,
    });
    console.log("Set currentUser : " + currentUser.Title)
    this.formikRef.current.setFieldValue("requestedBy", currentUser.Title);
  }

  private handleDepartmentChange = (e) => {
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

    this.venueState = newVenue;
    this.resetFormFields();
  }

  private handleVenueChange = async (e) => {
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
    //this.formikRef.current.setFieldValue("isCSDR", selectedVenue?.group === 'CRSD');
    this.formikRef.current.setFieldValue("isCSDR", selectedVenue && selectedVenue.group === 'CRSD');
  }

  private handleSave = async (formik) => {
    try {
      this.setState({ saveStart: true });
      
      const result = await this.spService.createReservation(
        formik.values,
        this.state.facilityData,
        this.state.files,
        this.state.venueId,
        this.state.isFssManaged
      );

      this.setState({
        isSavingDone: true,
        saveDialog: false,
      });

      setTimeout(() => {
        window.location.href = this.props.siteUrl + "/SitePages/Home.aspx";
      }, 1500);

    } catch (error) {
      this.setState({
        isSavingFailure: true,
        saveStart: false,
        failureMessage: "Error creating reservation. Please contact admin.",
      });
    }
  }

  private resetFormFields() {
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

  public render(): React.ReactElement {
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
          isCSDR: false,
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

                  {/* Basic Information */}
                  <Grid item xs={6}>
                    <div className={styles.label}>Requested By</div>
                    <CustomInput name="requestedBy" disabled />
                  </Grid>
                  <Grid item xs={6}>
                    <div className={styles.label}>Department</div>
                    <Dropdown
                      items={this.state.departmentList}
                      name="department"
                      handleChange={this.handleDepartmentChange}
                    />
                  </Grid>

                  {/* Venue Selection */}
                  <Grid item xs={6}>
                    <div className={styles.label}>Building</div>
                    <Dropdown
                      items={this.state.buildingList}
                      name="building"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <div className={styles.label}>Venue</div>
                    <Dropdown
                      items={this.state.venueList}
                      name="venue"
                      handleChange={this.handleVenueChange}
                    />
                  </Grid>

                  {/* Venue Details */}
                  <VenueDetails
                    venueImage={this.state.venueImage}
                    capacityperLayout={this.state.capacityperLayout}
                    facilitiesAvailable={this.state.facilitiesAvailable}
                  />

                  {/* CSRD Fields */}
                  {this.state.showCSRDField && (
                    <>
                      <Grid item xs={6}>
                        <div className={styles.label}>Layout Tables/Chairs*</div>
                        <Dropdown items={this.state.layoutList} name="layout" />
                      </Grid>
                      <Grid item xs={6}>
                        <div className={styles.label}>Principal User*</div>
                        <Dropdown items={this.state.princialList} name="principal" />
                      </Grid>
                      <Grid item xs={6}>
                        <div className={styles.label}>Contact Person*</div>
                        <CustomInput name="contactPerson" />
                      </Grid>
                    </>
                  )}

                  {/* Other Fields */}
                  <Grid item xs={6}>
                    <div className={styles.label}>Contact No.</div>
                    <CustomInput name="contactNumber" />
                  </Grid>
                  <Grid item xs={6}>
                    <div className={styles.label}>Purpose Of Use</div>
                    <Dropdown items={this.state.purposeOfUseList} name="purposeOfUse" />
                  </Grid>

                  {/* Date and Time */}
                  <Grid item xs={6}>
                    <div className={styles.label}>Date and Time of use - From</div>
                    <CustomDateTimePicker name="fromDate" />
                  </Grid>
                  <Grid item xs={6}>
                    <div className={styles.label}>Date and Time of use - To</div>
                    <CustomDateTimePicker name="toDate" />
                  </Grid>

                  {/* Facilities */}
                  {this.state.showCSRDField && (
                    <Grid item xs={12}>
                      <FacilityList
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
                      />
                    </Grid>
                  )}

                  {/* File Upload */}
                  <Grid item xs={12}>
                    <div className={styles.label}>Attachments</div>
                    <DropzoneArea
                      showPreviews={true}
                      showPreviewsInDropzone={false}
                      useChipsForPreview
                      dropzoneClass={styles.dropZone}
                      previewGridProps={{
                        container: { spacing: 1, direction: "row" },
                      }}
                      previewChipProps={{
                        classes: { root: styles.previewChip },
                      }}
                      previewText="Selected files"
                      onChange={(files) => this.setState({ files })}
                    />
                  </Grid>

                  {/* Action Buttons */}
                  <Grid item xs={12}>
                    <div className={styles.formHandle}>
                      <Button
                        type="button"
                        variant="contained"
                        startIcon={<CloseIcon />}
                        onClick={() => window.location.href = this.props.siteUrl + "/SitePages/Home.aspx"}
                        style={{
                          color: "lightgrey",
                          background: "grey",
                        }}
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

            {/* Dialogs */}
            <FacilityDialog
              open={this.state.showFacilityDialog}
              onClose={() => this.setState({ showFacilityDialog: false })}
              facilityList={this.state.facilityList}
              quantityList={this.state.quantityList}
              formik={formik}
              onSave={(form) => {
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
              }}
              onDelete={(form) => {
                const newFacilityData = [...this.state.facilityData];
                newFacilityData.splice(form.values.currentRecord, 1);
                this.setState({
                  facilityData: newFacilityData,
                  showFacilityDialog: false,
                });
                form.setFieldValue("currentRecord", -1);
              }}
              onFacilityChange={(e) => {
                const facility = e.target.value as string;
                const quantity = this.facilityMap[facility].Quantity;
                this.setState({
                  quantityList: this.createQuantityList(quantity)
                });
                formik.setFieldValue("assetNumber", this.facilityMap[facility].AssetNumber);
              }}
            />

            <ConfirmationDialog
              open={this.state.saveDialog}
              onClose={() => this.setState({ saveDialog: false })}
              onConfirm={() => this.handleSave(formik)}
              title="Confirm Reservation"
              message="Do you want to create this request?"
            />

            {/* Notifications */}
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
              {...formik.getFieldProps("isCSDR")}
            />
          </form>
        )}
      </Formik>
    );
  }
}
