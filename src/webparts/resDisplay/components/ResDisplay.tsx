import * as React from "react";
import styles from "./ResDisplay.module.scss";
import { IResDisplayProps } from "./IResDisplayProps";
import { IResDisplayState } from "./IResDisplayState";
import { Formik } from "formik";
import { Grid, Checkbox } from "@material-ui/core";
import { SharePointService } from "./services/SharePointService";
import { validationSchema } from "./utils/validation";
import { mapArrayToObject, arrayToDropDownValues } from "./utils/helpers";
import { BasicInformation } from "./common/BasicInformation";
import { VenueDetails } from "./common/VenueDetails";
import { ParticipantInformation } from "./common/ParticipantInformation";
import { DateTimeSelection } from "./common/DateTimeSelection";
import { FacilityDialog } from "./common/FacilityDialog";
import { FacilityList } from "./common/FacilityList";
import { FileList } from "./common/FileList";
import { ConfirmationDialog } from "./common/ConfirmationDialog";
import { Notification } from "./common/Notification";
import { ActionButtons } from "./common/ActionButtons";
import { APPROVED, DISAPPROVED, CANCELLED } from "./interfaces/IResDisplay";

export default class ResDisplay extends React.Component<IResDisplayProps, IResDisplayState> {
  private spService: SharePointService;
  private inputRef: any;
  private venue: any;
  private layout: any;
  private princialDepartmentMap: any;
  private facilityMap: any;
  private venueState: any;

  constructor(props: IResDisplayProps) {
    super(props);
    this.spService = new SharePointService();
    this.inputRef = React.createRef();

    this.state = {
      showCSRDField: false,
      venueImage: "https://wallpaperaccess.com/full/2119702.jpg",
      capacityperLayout: "",
      facilitiesAvailable: "",
      facilityData: [],
      Files: [],
      isEdit: false,
      currentUser: "",
      requestor: "",
      departmentList: [],
      buildingList: [],
      venueList: [],
      departmentSectorMap: {},
      layoutList: [],
      toggler: false,
      princialList: [],
      participantList: [],
      purposeOfUseList: [],
      showFacilityDialog: false,
      facilityList: [],
      quantityList: [],
      saveDialog: false,
      files: [],
      approverList: [],
      guid: '',
      status: "",
      newStatus: "",
      crsdMemberList: [],
      requestorEmail: "",
      isSavingDone: false,
      isSavingFailure: false,
      saveStart: false,
      ddMemeberList: [],
      venueId: "",
      selectedID: "",
      isFssManaged: false,
      isDDMember: false,
    };
  }

  public async componentDidMount() {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get("pid");
    await this.getLoggedinUser();
    await this.getItems(id);
    await this.getCRSD();
  }

  private getLoggedinUser = async () => {
    const user = await this.spService.getLoggedinUser();
    this.setState({
      currentUser: user.Email,
    });
  }

  private getItems = async (id: string) => {
    const item = await this.spService.getRequestById(id);
    const venueData = await this.spService.getVenueImage(item.Venue);
    if (venueData) {
      this.setState({
        venueImage: venueData.venueImage,
        facilitiesAvailable: venueData.facilitiesAvailable,
        capacityperLayout: venueData.capacityperLayout,
        venueId: venueData.venueId,
        selectedID: venueData.selectedID,
      });
    }

    this.inputRef.current.setFieldValue("referenceNumber", item.ReferenceNumber);
    this.inputRef.current.setFieldValue("requestDate", item.Created);
    this.inputRef.current.setFieldValue("requestedBy", item.RequestedBy);
    this.inputRef.current.setFieldValue("department", item.Department);
    this.inputRef.current.setFieldValue("building", item.Building);
    this.inputRef.current.setFieldValue("venue", item.Venue);
    this.inputRef.current.setFieldValue("layout", item.Layout || '');
    this.inputRef.current.setFieldValue("principal", item.PrincipalUser || '');
    this.inputRef.current.setFieldValue("contactPerson", item.ContactPerson || '');
    this.inputRef.current.setFieldValue("contactNumber", item.ContactNumber);
    this.inputRef.current.setFieldValue("purposeOfUse", item.PurposeOfUse);
    
    const participant = item.Participant ? JSON.parse(item.Participant) : [];
    this.setState({
      isDDMember: !(participant.indexOf('BSP-QC Personnel') > -1 && participant.length === 1),
    });
    
    this.inputRef.current.setFieldValue("participants", participant);
    this.inputRef.current.setFieldValue("numberOfParticipant", item.NoParticipant);
    this.inputRef.current.setFieldValue("titleDesc", item.TitleDescription);
    this.inputRef.current.setFieldValue("fromDate", item.FromDate);
    this.inputRef.current.setFieldValue("toDate", item.ToDate);
    this.inputRef.current.setFieldValue("otherRequirements", item.OtherRequirement);
    this.inputRef.current.setFieldValue("status", item.Status);
    this.inputRef.current.setFieldTouched("isCSDR", true, true);
    this.inputRef.current.setFieldValue("isCSDR", item.IsCSDR);

    await this.getFiles(item.GUID);
    await this.getDepartments(item.RequestorEmail);

    this.setState({
      showCSRDField: item.IsCSDR,
      requestor: item.RequestedBy,
      facilityData: JSON.parse(item.FacilityData),
      guid: item.GUID,
      status: item.Status,
      requestorEmail: item.RequestorEmail,
    });
  }

  private getFiles = async (guid: string) => {
    const docs = await this.spService.getFiles(guid, this.props.siteRelativeUrl);
    const files = docs.map(row => row.Name);
    this.setState({
      Files: [...files]
    });
  }

  private getDepartments = async (email: string) => {
    const { deparmentData, deparmentList } = await this.spService.getDepartments(email);
    const deprtObj = {};
    deparmentList.forEach(item => {
      deprtObj[item.Department] = item.Sector;
    });

    const departmentSectorMap = {};
    deparmentData.forEach((item) => {
      departmentSectorMap[item.Department.Department] = deprtObj[item.Department.Department];
    });

    const deparment = mapArrayToObject(departmentSectorMap);
    this.setState({
      departmentList: deparment,
      departmentSectorMap,
    });
  }

  private onEditClick = () => {
    this.setState({
      isEdit: true,
    });
    this.getBuildings();
    this.getLayout();
    this.getPurposeofUse();
    this.getParticipants();
    this.getFacility();
  }

  private getBuildings = async () => {
    const buildingData = await this.spService.getBuildings();
    const buildObj = {};
    const venue = [];

    buildingData.forEach((item) => {
      const ImageObj = JSON.parse(item.Image) || { serverRelativeUrl: '' };
      if (item.Building) {
        buildObj[item.Building] = item.Building;
      }
      if (item.Venue) {
        venue.push({
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

    this.setState({
      venueList: [...venue],
      buildingList: [
        ...Object.keys(buildObj).map((item, index) => ({
          id: index,
          value: item,
        })),
      ],
    });
    this.venue = venue;
  }

  private getLayout = async () => {
    const layoutData = await this.spService.getLayout();
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
    this.layout = layoutMap;
  }

  private getPrincipalUser = async (dept: string) => {
    const principalData = await this.spService.getPrincipalUser(dept);
    const princialMap = {};
    principalData.forEach((item) => {
      if (!princialMap[item.Dept]) {
        princialMap[item.Dept] = [];
      }
      princialMap[item.Dept].push(item.Name);
    });
    this.princialDepartmentMap = princialMap;
    if (this.princialDepartmentMap[dept]) {
      const sortedData = [].sort.call(this, this.princialDepartmentMap[dept]);
      this.setState({
        princialList: arrayToDropDownValues(sortedData),
      });
    }
  }

  private getPurposeofUse = async () => {
    const PurposeofUseData = await this.spService.getPurposeofUse();
    const list = PurposeofUseData.map(item => ({ id: item.Title, value: item.Title }));
    this.setState({
      purposeOfUseList: [...list],
    });
  }

  private getParticipants = async () => {
    const participant = await this.spService.getParticipants();
    const list = participant.map(item => ({ id: item.Title, value: item.Title }));
    this.setState({
      participantList: [...list],
    });
  }

  private getFacility = async () => {
    const Facility = await this.spService.getFacility();
    const facility = {};
    Facility.forEach((item) => {
      facility[item.Facility] = item;
    });
    this.facilityMap = facility;
  }

  private getCRSD = async () => {
    const { crsdUsers, ddUsers } = await this.spService.getCRSD();
    const list = crsdUsers.map(item => item.Email);
    const list2 = ddUsers.map(item => item.Email);
    this.setState({
      crsdMemberList: [...list],
      ddMemeberList: [...list2],
      approverList: [...list, ...list2],
    });
  }

  private departmentHandler = (e) => {
    const {
      target: { value },
    } = e;

    this.setState({
      isFssManaged: true,
    });

    let newVenue = this.venue;
    const { venueList: data } = this.state;
    if (value && this.state.departmentSectorMap[value] !== "FSS") {
      const newData = [...data];
      newVenue = newData.filter((item) => item.exclusiveTo !== "FSS");
      this.setState({
        isFssManaged: false,
      });
    }

    if (this.princialDepartmentMap[value]) {
      this.setState({
        princialList: arrayToDropDownValues(this.princialDepartmentMap[value]),
      });
    }

    this.setState({
      venueList: [...newVenue],
      venueImage: "https://wallpaperaccess.com/full/2119702.jpg",
      showCSRDField: false,
      toggler: !this.state.toggler,
      facilitiesAvailable: "",
      capacityperLayout: "",
      facilityData: [],
      selectedID: "",
    });

    this.venueState = newVenue;
    this.inputRef.current.setFieldValue("venue", "");
    this.inputRef.current.setFieldValue("building", "");
    this.inputRef.current.setFieldTouched("layout", true, false);
    this.inputRef.current.setFieldValue("layout", "");
    this.inputRef.current.setFieldTouched("principal", true, false);
    this.inputRef.current.setFieldValue("principal", "");
    this.inputRef.current.setFieldTouched("contactPerson", true, false);
    this.inputRef.current.setFieldValue("contactPerson", "");
    this.inputRef.current.setFieldValue("isCSDR", false);
  }

  private buildingHandler = (e) => {
    const {
      target: { value },
    } = e;

    let newVenue = this.venueState;
    if (newVenue.length) {
      newVenue = newVenue.filter(item => item.building === value);
    }

    this.setState({
      venueList: [...newVenue],
      venueImage: "https://wallpaperaccess.com/full/2119702.jpg",
      showCSRDField: false,
      toggler: !this.state.toggler,
      facilitiesAvailable: "",
      capacityperLayout: "",
      facilityData: [],
      selectedID: "",
    });

    this.inputRef.current.setFieldValue("venue", "");
    this.inputRef.current.setFieldTouched("layout", true, false);
    this.inputRef.current.setFieldValue("layout", "");
    this.inputRef.current.setFieldTouched("principal", true, false);
    this.inputRef.current.setFieldValue("principal", "");
    this.inputRef.current.setFieldTouched("contactPerson", true, false);
    this.inputRef.current.setFieldValue("contactPerson", "");
    this.inputRef.current.setFieldValue("isCSDR", false);
  }

  private venueHandler = (e) => {
    const {
      target: { value },
    } = e;

    this.inputRef.current.setFieldTouched("layout", true, false);
    this.inputRef.current.setFieldValue("layout", "");
    this.inputRef.current.setFieldTouched("principal", true, false);
    this.inputRef.current.setFieldValue("principal", "");
    this.inputRef.current.setFieldTouched("contactPerson", true, false);
    this.inputRef.current.setFieldValue("contactPerson", "");

    this.setState({
      facilityData: [],
      selectedID: "",
      layoutList: [],
    });

    const list = [...this.state.venueList];
    const selectedVenue = list.filter((item) => item.value === value);
    const check = selectedVenue[0].group === 'CRSD';

    if (selectedVenue.length) {
      const layout = this.layout[value] || [];
      this.setState({
        venueImage: selectedVenue[0].venueImage,
        facilitiesAvailable: JSON.parse(selectedVenue[0].facilitiesAvailable),
        capacityperLayout: selectedVenue[0].capacityperLayout,
        venueId: selectedVenue[0].venueId,
        selectedID: selectedVenue[0].itemId,
        showCSRDField: check,
        layoutList: [...layout],
      });
    }

    this.inputRef.current.setFieldValue("venue", value);
    this.inputRef.current.setFieldValue("isCSDR", check);
    if (!check) {
      this.inputRef.current.setFieldTouched("layout", true, false);
      this.inputRef.current.setFieldValue("layout", "");
      this.inputRef.current.setFieldTouched("principal", true, false);
      this.inputRef.current.setFieldValue("principal", "");
      this.inputRef.current.setFieldTouched("contactPerson", true, false);
      this.inputRef.current.setFieldValue("contactPerson", "");
    }

    if (check) {
      const department = this.inputRef.current.values["department"];
      this.getPrincipalUser(department);
    }
  }

  private participantHandler = (e) => {
    const { target: { value } } = e;
    this.setState({
      isDDMember: !(value.indexOf('BSP-QC Personnel') > -1 && value.length === 1),
    });
  }

  private handleDialog = (show: boolean, index = -1) => {
    if (index >= 0) {
      const facilityList = mapArrayToObject(this.facilityMap);
      this.setState({
        showFacilityDialog: show,
        facilityList: [...facilityList],
      });
      const data = this.state.facilityData[index];
      this.inputRef.current.setFieldValue("facility", data.facility);
      this.inputRef.current.setFieldValue("quantity", data.quantity);
      this.inputRef.current.setFieldValue("assetNumber", data.assetNumber);
      this.inputRef.current.setFieldValue("currentRecord", index);
    } else {
      const facilityList = mapArrayToObject(this.facilityMap);
      this.setState({
        showFacilityDialog: show,
        facilityList: [...facilityList],
      });
      this.inputRef.current.setFieldValue("facility", "");
      this.inputRef.current.setFieldValue("quantity", "");
      this.inputRef.current.setFieldValue("assetNumber", "");
      this.inputRef.current.setFieldValue("currentRecord", -1);
    }
  }

  private deleteRecord = (formik) => {
    const newFacilityData = [...this.state.facilityData];
    newFacilityData.splice(formik.values.currentRecord, 1);
    this.setState({
      facilityData: newFacilityData,
      showFacilityDialog: false,
    });
    this.inputRef.current.setFieldValue("currentRecord", -1);
  }

  private handleConfirmDialog = (show: boolean, newStatus = null) => {
    this.setState({
      saveDialog: show,
    });
    if (newStatus) {
      this.setState({
        newStatus,
      });
    }
  }

  private facilityHandler = (e) => {
    const {
      target: { value },
    } = e;
    const quantity = this.facilityMap[value].Quantity;
    const list = [];
    for (let i = 1; i <= quantity; i++) {
      list.push(i);
    }
    this.setState({
      quantityList: arrayToDropDownValues(list),
    });
    this.inputRef.current.setFieldValue(
      "assetNumber",
      this.facilityMap[value].AssetNumber
    );
    this.inputRef.current.setFieldValue("facility", value);
  }

  private handleDialogSave = (formik) => {
    const obj = {
      facility: formik.values.facility,
      quantity: formik.values.quantity,
      assetNumber: formik.values.assetNumber,
    };
    const data = [...this.state.facilityData];
    data.push(obj);
    this.setState({
      facilityData: [...data],
      showFacilityDialog: false,
    });
    this.inputRef.current.setFieldValue("facility", "");
    this.inputRef.current.setFieldValue("quantity", "");
    this.inputRef.current.setFieldValue("assetNumber", "");
    this.inputRef.current.setFieldValue("currentRecord", -1);
  }

  private handleSave = async (formik) => {
    const finalResult = formik.values;
    formik.validateForm();
    if (!Object.keys(formik.errors).length) {
      this.setState({
        saveStart: true,
      });
      delete finalResult.facility;
      delete finalResult.quantity;
      delete finalResult.assetNumber;
      finalResult["facilityData"] = this.state.facilityData;
      finalResult["files"] = this.state.files;
      finalResult["venueId"] = this.state.venueId;
      this.handleConfirmDialog(false);

      try {
        await this.spService.updateRequest(
          Number(new URLSearchParams(window.location.search).get("pid")),
          finalResult,
          this.state.newStatus,
          this.state.selectedID,
          this.state.guid
        );

        let toUser = this.state.crsdMemberList;
        if (this.state.isDDMember) {
          toUser = this.state.ddMemeberList;
        }

        await this.spService.sendEmail(
          [this.state.requestorEmail],
          [...toUser],
          finalResult,
          this.state.newStatus,
          this.props.siteUrl,
          new URLSearchParams(window.location.search).get("pid")
        );

        this.setState({
          isSavingDone: true,
        });
      } catch (error) {
        this.setState({
          isSavingFailure: true,
        });
      } finally {
        setTimeout(() => {
          this.Redirect();
        }, 1500);
      }

      formik.resetForm();
    } else {
      this.setState({
        saveDialog: false,
      });
    }
  }

  private Redirect = () => {
    window.open(
      this.props.siteUrl + "/SitePages/Home.aspx",
      "_self"
    );
  }

  private handleFileChange = (files) => {
    this.setState({
      files,
    });
  }

  private handleChipClick = (file: string) => {
    let f = `${this.props.siteUrl}/ReservationDocs/${this.state.guid}/${file}`;
    let link = document.createElement('a');
    link.href = f;
    link.download = f.substr(f.lastIndexOf('/') + 1);
    link.click();
  }

  public render(): React.ReactElement<IResDisplayProps> {
    const {
      venueImage,
      capacityperLayout,
      facilitiesAvailable,
      facilityData,
      Files,
      showCSRDField,
      isEdit,
      departmentList,
      venueList,
      buildingList,
      toggler,
      purposeOfUseList,
      princialList,
      participantList,
      layoutList,
      showFacilityDialog,
      facilityList,
      quantityList,
      saveDialog,
      currentUser,
      requestorEmail,
      status,
      approverList,
      isSavingDone,
      isSavingFailure,
      saveStart,
      newStatus,
      ddMemeberList,
      crsdMemberList,
      isDDMember,
    } = this.state;

    return (
      <Formik
        initialValues={{
          referenceNumber: "",
          requestDate: "",
          requestedBy: "",
          department: "",
          building: "",
          venue: "",
          layout: "",
          principal: "",
          contactPerson: "",
          contactNumber: "",
          purposeOfUse: "",
          participants: [],
          numberOfParticipant: "",
          titleDesc: "",
          fromDate: "",
          toDate: "",
          otherRequirements: "",
          status: "",
          facility: "",
          quantity: "",
          currentRecord: -1,
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {(formik) => {
          this.inputRef.current = formik;
          return (
            <form onSubmit={formik.handleSubmit}>
              <div className={styles.resDisplay}>
                <div className={styles.container}>
                  {saveDialog && (
                    <ConfirmationDialog
                      open={saveDialog}
                      onClose={() => this.handleConfirmDialog(false)}
                      onConfirm={this.handleSave}
                      formik={formik}
                      newStatus={newStatus}
                    />
                  )}

                  <Grid container spacing={4}>
                    {!isEdit && (
                      <Grid item xs={12}>
                        <h1>Display Room Reservation Request</h1>
                      </Grid>
                    )}

                    {isEdit && (
                      <Grid item xs={12}>
                        <h1>Edit Room Reservation Request</h1>
                      </Grid>
                    )}

                    <BasicInformation
                      formik={formik}
                      isEditing={isEdit}
                      departmentList={departmentList}
                      buildingList={buildingList}
                      venueList={venueList}
                      showCSRDField={showCSRDField}
                      layoutList={layoutList}
                      principalList={princialList}
                      departmentHandler={this.departmentHandler}
                      buildingHandler={this.buildingHandler}
                      venueHandler={this.venueHandler}
                      toggler={toggler}
                    />

                    <VenueDetails
                      venueImage={venueImage}
                      capacityperLayout={capacityperLayout}
                      facilitiesAvailable={facilitiesAvailable}
                    />

                    <ParticipantInformation
                      formik={formik}
                      isEditing={isEdit}
                      purposeOfUseList={purposeOfUseList}
                      participantList={participantList}
                      participantHandler={this.participantHandler}
                      isDDMember={isDDMember}
                      showCSRDField={showCSRDField}
                    />

                    <DateTimeSelection
                      formik={formik}
                      isEditing={isEdit}
                    />

                    {showCSRDField && (
                      <>
                        {showFacilityDialog && (
                          <FacilityDialog
                            open={showFacilityDialog}
                            onClose={() => this.handleDialog(false)}
                            facilityList={facilityList}
                            quantityList={quantityList}
                            formik={formik}
                            onSave={this.handleDialogSave}
                            onDelete={this.deleteRecord}
                            facilityHandler={this.facilityHandler}
                          />
                        )}

                        <FacilityList
                          facilityData={facilityData}
                          onView={(index) => this.handleDialog(true, index)}
                          showActions={isEdit}
                        />
                      </>
                    )}

                    <Grid item xs={12}>
                      <div className={styles.label}>Selected Files</div>
                      <FileList
                        files={Files}
                        onFileClick={this.handleChipClick}
                        isEditing={isEdit}
                        onFilesChange={this.handleFileChange}
                        initialFiles={Files}
                      />
                    </Grid>

                    <ActionButtons
                      status={status}
                      currentUser={currentUser}
                      approverList={approverList}
                      isDDMember={isDDMember}
                      ddMemberList={ddMemeberList}
                      crsdMemberList={crsdMemberList}
                      isEdit={isEdit}
                      saveStart={saveStart}
                      onEditClick={this.onEditClick}
                      onApprove={() => this.handleConfirmDialog(true, APPROVED)}
                      onDisapprove={() => this.handleConfirmDialog(true, DISAPPROVED)}
                      onCancel={() => this.handleConfirmDialog(true, CANCELLED)}
                      onClose={this.Redirect}
                      requestorEmail={requestorEmail}
                    />
                  </Grid>
                </div>
              </div>

              <Notification
                open={isSavingDone}
                message={`Request has been ${newStatus.toLowerCase()} successfully.`}
                severity="success"
              />

              <Notification
                open={isSavingFailure}
                message="Some issue while updating request, Kindly contact Admin."
                severity="error"
              />

              <Checkbox
                color="primary"
                name="isCSDR"
                style={{
                  display: "none",
                }}
                {...formik.getFieldProps("isCSDR")}
              />
            </form>
          );
        }}
      </Formik>
    );
  }
}
