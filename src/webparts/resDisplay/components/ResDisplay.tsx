import * as React from "react";
import styles from "./ResDisplay.module.scss";
import { IResDisplayProps } from "./IResDisplayProps";
import { IResDisplayState } from "./IResDisplayState";

import * as yup from "yup";
import * as moment from "moment";
import { Formik, FormikProps, Field } from "formik";
import DateFnsUtils from "@date-io/date-fns";
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Checkbox,
  Chip,
  Box,
  Tooltip,
  Fab,
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import AttachFileIcon from '@material-ui/icons/AttachFile';
import { DropzoneArea } from "material-ui-dropzone";
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';

import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/sputilities";
import { IEmailProperties } from "@pnp/sp/sputilities";
import "@pnp/sp/site-groups";

const FSS = "FSS";
const PENDING = "Pending for Approval";
const APPROVED = 'Approved';
const DISAPPROVED = 'Disapproved';
const CANCELLED = "Cancelled";

const statusMapper = {
  "Approved": "approved",
  "Disapproved": "disapprove",
  "Cancelled": "cancel",
};

const validateDateTime = (startDateTime, endDateTime) =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isAfter(startDateTime);

const dateFormat = (date) => {
  return moment(date).format("MM/DD/yyyy HH:mm");
};

const CustomInput = (props) => {
  const { name, disabled = false } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <TextField
              value={field.value}
              variant="standard"
              onChange={(e) => {
                field.onChange(e);
              }}
              onBlur={(e) => {
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              name={name}
              disabled={disabled}
              className={styles.width}
              style={{
                border: form.errors[field.name] ? "1px solid red" : "none",
              }}
            />
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

const validate = yup.object().shape({
  requestedBy: yup.string().required(),
  department: yup.string().required("Department is required"),
  building: yup.string().required("Building is required"),
  venue: yup.string().required("Venue is required"),
  participants: yup.string().required("Participant is required"),
  purposeOfUse: yup.string().required("Purpose of use is required"),
  contactNumber: yup.number().required("Contact number is required"),
  numberOfParticipant: yup
    .number()
    .required("Number of participant is required"),
  titleDesc: yup.string().required("Title is required"),
  isCSDR: yup.boolean(),
  layout: yup.string().when("isCSDR", {
    is: (isCSDR) => isCSDR === true,
    then: yup.string().required("Layout is required"),
    otherwise: yup.string(),
  }),
  principal: yup.string().when("isCSDR", {
    is: (isCSDR) => isCSDR === true,
    then: yup.string().required("Principal is required"),
    otherwise: yup.string(),
  }),
  contactPerson: yup.string().when("isCSDR", {
    is: (isCSDR) => isCSDR === true,
    then: yup.string().required("Contact person is required"),
    otherwise: yup.string(),
  }),
  fromDate: yup.lazy((data) => {
    if (data) {
      return yup
        .mixed()
        .test(
          "Is date valid",
          "Enter valid date",
          (val) => val && moment(val).isValid()
        )
        .required("From date is required");
    }
    return yup.string().required("From date is required");
  }),
  toDate: yup.lazy((data) => {
    if (data) {
      return yup
        .mixed()
        .test(
          "Is date valid",
          "Enter valid date",
          (val) => val && moment(val).isValid()
        )
        .when("fromDate", (fromDate, schema) => {
          return schema.test({
            test: (toDate) => validateDateTime(fromDate, toDate),
            message: "Invalid date range, fromDate < toDate",
          });
        })
        .required("toDate is required");
    }
    return yup.mixed().when("fromDate", (fromDate, schema) => {
      if (fromDate) {
        return schema
          .test({
            test: (toDate) => validateDateTime(fromDate, toDate),
            message: "Invalid date range",
          })
          .required("toDate is required");
      }
      return yup.mixed().required("toDate is required");
    });
  }),
});
function Alert(props1: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props1} />;
}

const Dropdown = (props) => {
  const { items, handleChange, name, multiple } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
            <FormControl fullWidth>
              <Select
                name={field.name}
                multiple={multiple}
                onChange={(e) => {
                  field.onChange(e);
                  if (handleChange) {
                    handleChange(e);
                  }
                }}
                onBlur={(e) => {
                  form.setFieldTouched(name, true, false);
                  field.onBlur(e);
                }}
                value={field.value}
                variant="standard"
                style={{
                  border: form.errors[field.name] ? "1px solid red" : "none"
                }}
                renderValue={(selected: any) => {
                  if (multiple) {
                    return (
                      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                        {selected &&
                          selected.map((value) => (
                            <Chip
                              key={value}
                              label={value}
                              style={{ margin: "3px", height: "20px" }}
                            />
                          ))}
                      </Box>
                    );
                  } else {
                    return selected;
                  }
                }}
                {...props}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {items.map((item) => (
                  <MenuItem key={item.id} value={item.value}>
                    {multiple && <Checkbox checked={field.value.indexOf(item.value) > -1} /> }
                    {item.value}
                  </MenuItem>
                ))}
              </Select>
              {error && touched ? (
                <span className={styles.error}>{error}</span>
              ) : null}
            </FormControl>
        );
      }}
    </Field>
  );
};

const CustomDateTimePicker = (props) => {
  const { name, handleChange } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DateTimePicker
                clearable
                autoOk
                hideTabs
                ampm={false}
                format="MM/dd/yyyy HH:MM"
                style={{
                  border: form.errors[field.name] ? "1px solid red" : "none"
                }}
                value={field.value ? field.value : null}
                onChange={(e) => {
                  form.setFieldValue(name, e);
                  if (handleChange) {
                    handleChange(e, name);
                  }
                }}
                onBlur={(e) => {
                  form.setFieldTouched(name, true, false);
                  field.onBlur(e);
                }}
              />
            </MuiPickersUtilsProvider>
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

const ModalPopup = ({ children, title, open, onClose, hideCloseIcon }) => {
  return (
    <Dialog
      open={open}
      keepMounted
      aria-labelledby="faciliites-dialog-title"
      aria-describedby="faciliites-dialog-description"
    >
      <DialogTitle id="faciliites-dialog-title" disableTypography>
        <h4>{title}</h4>
        {!hideCloseIcon && (
          <Button
            onClick={onClose}
            className={styles.closeBtn}
            style={{
              position: "absolute",
              top: "0",
              right: "0",
            }}
          >
            <CloseIcon />
          </Button>
        )}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};

const newResEmail = async (to:Array<string>,cc: Array<string>, values: any, type: any,siteUrl: string, id) => {
  let toEmail = [...to];
  let ccEmail = [...cc];
  console.log('Cc',cc );
  let emailProps: IEmailProperties = {
    From: "NTT_LagmayJ_JavierGO@bsp.gov.ph",
    To: toEmail,
    CC: ccEmail,
    Subject: '',
    Body: '',
    AdditionalHeaders: {
      "content-type": "application/json;odata=verbose",
    }
  };
  
   if(type  ===  APPROVED) {
    emailProps.Subject = `Approved Request for Reservation.:  ${id}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
    emailProps.Body = `We are pleased to inform you that your venue reservation request is approved. <br/>
    For further assistance, you may e-mail us at coraoreservations@bsp.gov.ph or call our Events and  
    Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>
    Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>`;
  }
  if(type === DISAPPROVED) {
    emailProps.Subject = `Disapproved Request for Reservation.:  ${id}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
    emailProps.Body = `We regret to inform you that your venue reservation request is disapproved. 
    For further clarifications, you may e-mail us at coraoreservations@bsp.gov.ph or call our
     Events and Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>
    Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>`;
  }

   await sp.utility.sendEmail(emailProps); 
};

const mapArrayToObject = (obj) =>
  Object.keys(obj).map((item) => {
    return { id: item, value: item };
  });
  
const arrayToDropDownValues = (array) =>
  array.map((item) => ({ id: item, value: item }));


export default class ResDisplay extends React.Component<
  IResDisplayProps,
  IResDisplayState
> {
  public inputRef: any;
  public venue: any;
  public layout: any;
  public princialDepartmentMap: any;
  public facilityMap: any;
  public venueState: any;

  constructor(props) {
    super(props);

    this.state = {
      showCSRDField: false,
      venueImage: "https://wallpaperaccess.com/full/2119702.jpg",
      capacityperLayout: "",
      facilitiesAvailable: "",
      facilityData: [],
      Files: [],
      isEdit: false,
      currentUser: "",
      requestor:"",
      // edit state
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
    this.inputRef = React.createRef<HTMLInputElement>();
  }

  public onEditClick = () => {
    this.setState({
      isEdit: true,
    });
    this.getBuildings();
    this.getLayout();
    this.getPrincipalUser();
    this.getPurposeofUse();
    this.getParticipants();
    this.getFacility();
  }

  /** set field value and error message for all the fields */
  private getFieldProps = (formik: FormikProps<any>, field: string) => {
    return {
      ...formik.getFieldProps(field),
      errorMessage: formik.errors[field] as string,
    };
  }

  public handleFileChange = (files) => {
    this.setState({
      files,
    });
  }

  /*if deparment sector is not fss then venue dropdown
     should have all values except exclusivetocolumn fss value.
     In case it is in fss sector then  venue dropdown
     should have all the values. We need to clear the selected value in
     venue dropdown. Reset the venue image and hide the csdr field.
    */

     public departmentHandler = (e) => {
      const {
        target: { value },
      } = e;
  
      this.setState({
        isFssManaged: true,
      });
      let newVenue = this.venue;
      const { venueList: data } = this.state;
      if (value && this.state.departmentSectorMap[value] !== FSS) {
        const newData = [...data];
        newVenue = newData.filter((item) => item.exclusiveTo !== FSS);
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
      this.venueState =  newVenue;
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

  public handleDialog = (show, index = -1) => {
    if(index >=0) {
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

public deleteRecord = (formik) => {
    const newFacilityData = [...this.state.facilityData];
    newFacilityData.splice(formik.values.currentRecord,1);
    this.setState({
      facilityData: newFacilityData,
      showFacilityDialog: false,
    });
  this.inputRef.current.setFieldValue("currentRecord", -1);
}

  public handleConfirmDialog = (show, newStatus =  null) => {
    this.setState({
      saveDialog: show,
    });
    if(newStatus) {
      this.setState({
        newStatus,
      });
    }
  }

  public facilityHandler = (e) => {
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

  public handleDialogSave = (formik) => {
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

  public handleSave = (formik) => {
    const finalResult = formik.values;
    formik.validateForm();
    if(!Object.keys(formik.errors).length) {
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
    this.UpdateRequest(finalResult);
    formik.resetForm();
    } else {
      this.setState({
        saveDialog: false,
      });
    }
  }
  
 public Redirect = () => {
  window.open(
    this.props.siteUrl +
      "/SitePages/Home.aspx",
    "_self"
  );
 }

 public  buildingHandler = (e) => {
  const {
    target: { value },
  } = e;

  let newVenue = this.venueState;
  if(newVenue.length) {
    newVenue = newVenue.filter(item =>  item.building ===  value);
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
public ISODate = (date) => {
  return moment(date).toISOString();
}
  public UpdateRequest = async (Formdata) => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = Number(queryParams.get("pid"));
    const participant = JSON.stringify(Formdata["participant"]);
    const facility = JSON.stringify(Formdata["facilityData"]);
    try {  
      const { isEdit } = this.state;
      let dataNeedsToBeUpdated = { };
      this.setState({
        isSavingFailure: false,
      });
      const isAvailable = await this.checkRoomAvailablity(Formdata["venueId"], this.ISODate(Formdata["fromDate"]),this.ISODate(Formdata["toDate"]));

      if(isEdit) {
          if(this.state.newStatus === APPROVED && isAvailable){
            await this.updateRoomTimeSlot(this.state.selectedID, Formdata["venueId"], this.ISODate(Formdata["fromDate"]),this.ISODate(Formdata["toDate"]));
          }
        dataNeedsToBeUpdated =  {  
          Title: Formdata["requestedBy"],
          RequestedBy: Formdata["requestedBy"],
          Department: Formdata["department"],
          Building: Formdata["building"],
          Venue: Formdata["venue"],
          Layout: Formdata["layout"],
          PrincipalUser: Formdata["principal"],
          ContactPerson: Formdata["contactPerson"],
          ContactNumber: Formdata["contactNumber"],
          PurposeOfUse: Formdata["purposeOfUse"],
          Participant:  participant,
          NoParticipant: Formdata["numberOfParticipant"],
          TitleDescription: Formdata["titleDesc"],
          FromDate: Formdata["fromDate"],
          ToDate: Formdata["toDate"],
          OtherRequirement: Formdata["otherRequirements"],
          IsCSDR: Formdata["isCSDR"],
          FacilityData : facility,
        };
      }
      const iar:any = await sp.web.lists.getByTitle('Request').items.getById(id).update({
        ...dataNeedsToBeUpdated,
        Status: this.state.newStatus
      });
      const  _itemId = this.state.guid;

      
      const f = "/sites/ResourceReservation" + "/ReservationDocs/" + _itemId;
      await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders.getByName(_itemId).delete();
      await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders
      .add(_itemId)
      .then(r => {
         Promise.all(Formdata.files.map( (file) => {
         if (file.size <= 10485760) {
             sp.web.getFolderByServerRelativeUrl(f).files.add(file.name, file, true)
             .then(result => {  
              result.file.getItem()
              .then(item => {  
                  item.update({  
                    RequestId : _itemId  
                  });
              });  
          });
          } else {
             sp.web.getFolderByServerRelativeUrl(f).files.addChunked(file.name, file, d1 => {
            }, true).then(({ file:fileData }) => fileData.getItem()).then((item:any) => {  
                return item.update({  
                  RequestId : _itemId
                });
            });
          }
        }));
      });
    
      let toUser = this.state.crsdMemberList; 
      if(this.state.isDDMember) {
        toUser = this.state.ddMemeberList;
      }
      await newResEmail([this.state.requestorEmail],[...toUser],
        Formdata, this.state.newStatus, this.props.siteUrl, id);
      
       this.setState({
          isSavingDone: true,
        });
     
    }  
    catch (error) {   
      this.setState({
        isSavingFailure: true,
       });
    }  
    finally {
       setTimeout(() => {
        this.Redirect();
      }, 1500);
    }
  }
  public venueHandler = (e) => {
    const {
      target: { value },
    } = e;
    // if venue is in CSRD group then show the layout column and
    // and update value. We need to add the image also as per venue
    this.inputRef.current.setFieldTouched("layout", true, false);
    this.inputRef.current.setFieldValue("layout", "");
    this.inputRef.current.setFieldTouched("principal", true, false);
    this.inputRef.current.setFieldValue("principal", "");
    this.inputRef.current.setFieldTouched("contactPerson", true, false);
    this.inputRef.current.setFieldValue("contactPerson", "");

    const layout = this.layout[value] || [];
    const check = layout.length ? true : false;
    this.setState({
      showCSRDField: check,
      layoutList: [...layout],
      facilityData: [],
      selectedID: "",
    });

    const list = [...this.state.venueList];
    const selectedVenue = list.filter((item) => item.value === value);
    if (selectedVenue.length) {
      this.setState({
        venueImage: selectedVenue[0].venueImage,
        facilitiesAvailable: JSON.parse(selectedVenue[0].facilitiesAvailable),
        capacityperLayout: selectedVenue[0].capacityperLayout,
        venueId: selectedVenue[0].venueId,
        selectedID: selectedVenue[0].itemId,
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
  }

public participantHandler = (e) => {
    const { target : { value }}  = e;
     this.setState({
      isDDMember:  !(value.indexOf('BSP-QC Personnel') > -1 && value.length === 1),
  });
 
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
        validationSchema={validate}
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
                        <ModalPopup
                          title=""
                          hideCloseIcon={false}
                          open={saveDialog}
                          onClose={() => this.handleConfirmDialog(false)}
                        >
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <h3> Do you want to {statusMapper[newStatus]} this request?</h3>
                            </Grid>
                            <Grid item xs={12}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "end",
                                  alignItems: "center",
                                }}
                              >
                                <Button
                                  color="secondary"
                                  variant="contained"
                                  onClick={() =>
                                    this.handleConfirmDialog(false)
                                  }
                                >
                                  Cancel
                                </Button>
                                <Button
                                  color="primary"
                                  variant="contained"
                                  style={{
                                    marginLeft: "20px",
                                  }}
                                  onClick={() => this.handleSave(formik)}
                                >
                                  Ok
                                </Button>
                              </div>
                            </Grid>
                          </Grid>
                        </ModalPopup>
                      )}
                <Grid container spacing={4}>
                  {!isEdit && (<>
                   
                      <Grid item xs={12}>
                       <h1> Display Room Reservation Request </h1>
                      </Grid>
                    { status === PENDING && 
                     ((isDDMember && ddMemeberList.indexOf(currentUser) > -1) || (!isDDMember && crsdMemberList.indexOf(currentUser) > -1)) && <Grid item xs={12} sm={12}>
                        <Tooltip title="Edit">
                          <Fab
                            id="editFab"
                            size="medium"
                            color="primary"
                            onClick={this.onEditClick}
                          >
                            <EditIcon />
                          </Fab>
                        </Tooltip>
                      </Grid>
                    }
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Reference Number</div>
                        <CustomInput name="referenceNumber" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Request Date</div>
                        <CustomInput name="requestDate" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Requested By</div>
                        <CustomInput name="requestedBy" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Department</div>
                        <CustomInput name="department" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Building</div>
                        <CustomInput name="building" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Venue</div>
                        <CustomInput name="venue" disabled />
                      </Grid>
                      {showCSRDField && (
                        <Grid item xs={12} sm={12}>
                          <div className={styles.label}>
                            Layout Tables/Chairs*
                          </div>
                          <CustomInput name="layout" disabled />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={12}>
                        <div className={styles.imageData}>
                          <img src={venueImage} />
                        </div>
                      </Grid>

                      <Grid item xs={12} sm={12}>
                        <div className={styles.facilityDetails}>
                          <table>
                            <thead>
                              <th>
                                <div>CAPACITY PER LAY-OUT </div>
                                <div>(NO. OF PAX)</div>
                              </th>
                              <th>
                                <div>FACLITIES AVAILABLE </div>
                                <div>IN THE VENUE </div>
                              </th>
                            </thead>
                            <tbody>
                              <tr>
                                <td>{capacityperLayout}</td>
                                <td>
                                  <pre>{facilitiesAvailable}</pre>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </Grid>
                      {showCSRDField && (
                        <Grid item xs={12} sm={6}>
                          <div className={styles.label}>Principal User</div>
                          <CustomInput name="principal" disabled />
                        </Grid>
                      )}
                      {showCSRDField && (
                        <Grid item xs={12} sm={6}>
                          <div className={styles.label}>Contact Person</div>
                          <CustomInput name="contactPerson" disabled />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Contact No</div>
                        <CustomInput name="contactNumber" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Purpose of Use</div>
                        <CustomInput name="purposeOfUse" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.width}>
                        <div className={styles.label}>Participants</div>
                        <Dropdown
                            items={participantList}
                            name="participants"
                            multiple
                            disabled
                            />
                            </div>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>
                          Number of Participants
                        </div>
                        <CustomInput name="numberOfParticipant" disabled />
                      </Grid>
                      <Grid item xs={12} sm={12}>
                        <div className={styles.label}>Title Description</div>
                        <CustomInput name="titleDesc" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>
                          Date and Time of use - From
                        </div>
                        <CustomInput name="fromDate" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>
                          Date and Time of use - To
                        </div>
                        <CustomInput name="toDate" disabled />
                      </Grid>

                      {showCSRDField && (
                        <Grid item xs={12} sm={12}>
                          {  facilityData.length > 0  && (<>
                          <div className={styles.label}>Facilites</div>
                          <div className={styles.facilityDetails}>
                            <table>
                              <thead>
                                <th>Facility</th>
                                <th>Quantity</th>
                                <th>Asset Number</th>
                              </thead>
                              <tbody>
                                {facilityData.map((item) => {
                                  return (
                                    <tr>
                                      <td>{item.facility}</td>
                                      <td>{item.quantity}</td>
                                      <td>{item.assetNumber}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          </>
                          )}
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Other Requirements</div>
                        <CustomInput name="otherRequirements" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <div className={styles.label}>Status</div>
                        <CustomInput name="status" disabled />
                      </Grid>
                      <Grid item xs={12} sm={12}>
                        <div className={styles.label}>Selected Files</div>
                        <div>
                          {Files &&
                            Files.map((value) => (
                              <Chip
                                key={value}
                                label={value}
                                icon={<AttachFileIcon />}
                                style={{ margin: "3px", height: "20px" }}
                                onClick={(e) => this.handleChipClick(e, value)}
                              />
                            ))}
                        </div>
                      </Grid>
                   </>
                  )}
                  {isEdit && (
                    <>
                      {showFacilityDialog && (
                        <ModalPopup
                          title="Add Facilities"
                          hideCloseIcon={false}
                          open={showFacilityDialog}
                          onClose={() => this.handleDialog(false)}
                        >
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <div className={styles.label}>Facility</div>
                              
                                <Dropdown
                                  items={facilityList}
                                  name="facility"
                                  onChange={(e) => this.facilityHandler(e)}
                                />
                              
                            </Grid>
                            <Grid item xs={6}>
                              <div className={styles.label}>Quantity</div>
                              
                                <Dropdown
                                  items={quantityList}
                                  name="quantity"
                                  key={toggler}
                                />
                            
                            </Grid>
                            <Grid item xs={6}>
                              <div className={styles.label}>Asset Number</div>
                                <CustomInput name="assetNumber" disabled />
                            </Grid>
                            <Grid item xs={6}>
                              {" "}
                            </Grid>
                            <Grid item xs={12}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "end",
                                  alignItems: "center",

                                }}
                              >
                                <Button
                                  color="secondary"
                                  variant="contained"
                                  onClick={() => this.handleDialog(false)}
                                >
                                  Cancel
                                </Button>
                               { formik.values.currentRecord >= 0 && <Button
                                  color="secondary"
                                  variant="contained"
                                  style={{
                                    marginLeft: "20px",
                                  }}
                                  onClick={() => this.deleteRecord(formik)}
                                >
                                  Delete
                                </Button>}
                                <Button
                                  color="primary"
                                  variant="contained"
                                  style={{
                                    marginLeft: "20px",
                                  }}
                                  disabled={
                                    !formik.values.facility ||
                                    !formik.values.quantity
                                  }
                                  onClick={() => this.handleDialogSave(formik)}
                                >
                                  Save
                                </Button>
                                
                              </div>
                            </Grid>
                          </Grid>
                        </ModalPopup>
                      )}
                      
                     
                      <Grid item xs={12}>
                       <h1> Edit Room Reservation Request</h1>
                      </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Requested By</div>
                            <CustomInput name="requestedBy" disabled/>
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Department</div>
                            <Dropdown
                              items={departmentList}
                              name="department"
                              disabled
                              handleChange={(e) => this.departmentHandler(e)}
                            />
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Building</div>
                            <Dropdown items={buildingList} name="building"  
                             handleChange={(e) => this.buildingHandler(e)} />
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Venue</div>
                            <Dropdown
                              items={venueList}
                              name="venue"
                              handleChange={(e) => this.venueHandler(e)}
                              key={toggler}
                            />
                            </div>
                          </Grid>
                          {showCSRDField && (
                            <>
                           
                              <Grid item xs={6}>
                              <div className={styles.width}>
                                <div className={styles.label}>
                                  Layout Tables/Chairs*
                                </div>
                                <Dropdown items={layoutList} name="layout" />
                                </div>
                              </Grid>
                              <Grid item xs={6}></Grid>
                            </>
                          )}
                          <Grid item xs={12}>
                            <div className={styles.imageData}>
                              <img src={venueImage} />
                            </div>
                          </Grid>
                          <Grid item xs={12}>
                            <div className={styles.facilityDetails}>
                              <table>
                                <thead>
                                  <th>
                                    <div>CAPACITY PER LAY-OUT </div>
                                    <div>(NO. OF PAX)</div>
                                  </th>
                                  <th>
                                    <div>FACLITIES AVAILABLE </div>
                                    <div>IN THE VENUE </div>
                                  </th>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>{capacityperLayout}</td>
                                    <td>
                                      <pre>{facilitiesAvailable}</pre>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </Grid>
                          {showCSRDField && (
                            <>
                              <Grid item xs={6}>
                              <div className={styles.width}>
                                <div className={styles.label}>
                                  Principal User*
                                </div>
                                <Dropdown
                                  items={princialList}
                                  name="principal"
                                />
                                </div>
                              </Grid>

                              <Grid item xs={6}>
                              <div className={styles.width}>
                                <div className={styles.label}>
                                  Contact Person*
                                </div>
                                  <CustomInput name="contactPerson" />
                                  </div>
                              </Grid>
                            </>
                          )}
                          <Grid item xs={6}>
                          <div className={styles.width}>
                             <div className={styles.label}>Contact No.</div>
                              <CustomInput name="contactNumber" />
                              </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Purpose Of Use</div>
                            <Dropdown
                              items={purposeOfUseList}
                              name="purposeOfUse"
                            />
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Participants</div>
                            <Dropdown
                              items={participantList}
                              name="participants"
                              multiple
                              handleChange={(e) => this.participantHandler(e)}
                              />
                             { formik.values.participants.length > 0 &&  showCSRDField && (
                                <span>Selected type of participants are subject for approval by { isDDMember ?  'DD' : 'CRSD' } staff level</span>)
                             }
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>
                              Number of Participants
                            </div>
                            <CustomInput name="numberOfParticipant" />
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>
                              Title Description
                            </div>
                            <CustomInput name="titleDesc" />
                            </div>
                          </Grid>
                          <Grid item xs={6}></Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>
                              Date and Time of use - From
                            </div>

                            <CustomDateTimePicker name="fromDate" />
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>
                              Date and Time of use - To
                            </div>

                            <CustomDateTimePicker name="toDate" />
                            </div>
                          </Grid>
                          {showCSRDField && (
                            <Grid item xs={12}>
                              
                              <div className={styles.label}>Facilities</div>
                              <div className={styles.data}>
                                <Fab
                                  color="primary"
                                  aria-label="add"
                                  size="small"
                                  onClick={() => this.handleDialog(true)}
                                >
                                  <AddIcon />
                                </Fab>
                              </div>
                              {facilityData.length > 0 && (
                                <div className={styles.facilityDetails}>
                                  <table>
                                    <thead>
                                      <th>Action</th>
                                      <th>Facility</th>
                                      <th>Quantity</th>
                                      <th>Asset Number</th>
                                    </thead>
                                    <tbody>
                                      {facilityData.map((item, index) => {
                                        return (
                                          <tr key={`${item.assetNumber}-${index}`}>
                                            <td>
                                            <div onClick={() => this.handleDialog(true, index)}><VisibilityIcon /></div></td>
                                            <td>{item.facility}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.assetNumber}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </Grid>
                          )}
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>
                              Other Requirements
                            </div>
                            <CustomInput name="otherRequirements" />
                            </div>
                          </Grid>
                          <Grid item xs={6}></Grid>
                          <Grid item xs={6}>
                            <div className={styles.label}> Attachment Here</div>
                          </Grid>
                          <Grid item xs={6}></Grid>
                          <Grid item xs={12}>
                            <DropzoneArea
                              initialFiles={Files}
                              acceptedFiles={['.docx', '.xlsx', '.xls', 'doc', '.mov', 'image/*', 'video/*', ' application/*']}
                              showPreviews={true}
                              showFileNames={true}
                              maxFileSize={70000000}
                              filesLimit={10}
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
                              onChange={(files) => this.handleFileChange(files)}
                              dropzoneText="Attach general document here"
                            />
                          </Grid>
                         
                        
                        <Checkbox
                          color="primary"
                          name="isCSDR"
                          style={{
                            display: "none",
                          }}
                          {...this.getFieldProps(formik, "isCSDR")}
                        />
                    </>
                  )}
                  <Grid item xs={12}>
                   <div className={styles.formHandle}>
                     
                            { status === PENDING && approverList.indexOf(currentUser) > -1 && isEdit
                            && (<>
                                        <Button
                                          type="submit"
                                          variant="contained"
                                          startIcon={<SaveIcon />}
                                          onClick={() => this.handleConfirmDialog(true, APPROVED) }
                                          color="primary"
                                          disabled={saveStart}
                                        >
                                          Approve
                                        </Button>

                                        <Button
                                          type="submit"
                                          variant="contained"
                                          startIcon={<SaveIcon />}
                                          color="secondary"
                                          onClick={() => this.handleConfirmDialog(true, DISAPPROVED) }
                                          disabled={saveStart}
                                        >
                                          Disapprove
                                        </Button>
                                        </>
                                        )
                              }
                            
                              { ((currentUser === requestorEmail || approverList.indexOf(currentUser) > -1 ) && status === PENDING ) && (<Button
                                type="submit"
                                variant="contained"
                                startIcon={<CloseIcon />}
                                onClick={() => this.handleConfirmDialog(true, CANCELLED) }
                                style={{
                                  color: "lightgrey",
                                  background: "grey",
                                }}
                                disabled={saveStart}
                              >
                                Cancel
                              </Button>)
                              }

                              <Button
                                type="button"
                                variant="outlined"
                                style={{
                                  color: "lightgrey",
                                  background: "grey",
                                }}
                                onClick={() => this.Redirect() }
                              >
                                Close
                              </Button>
                      </div>
                  </Grid>
                 </Grid>
                  </div>
              </div>
              <Snackbar open={isSavingDone} autoHideDuration={1000} >
                <Alert severity="success">
                   Request has been {statusMapper[newStatus]} successfully.
                </Alert>
              </Snackbar>
              <Snackbar open={isSavingFailure} autoHideDuration={1000} >
                <Alert severity="error">
                  Some issue while updating request, Kindly contact Admin.
                </Alert>
              </Snackbar>
            </form>
          );
        }}
      </Formik>
    );
  }

  public componentDidMount() {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get("pid");
    this.getLoggedinUser();
    this.getItems(id);
    this.getCRSD();
  }
  public getLoggedinUser = () => {
    sp.web.currentUser.get().then((user) => {
       this.setState({
        currentUser: user.Email,
       });
    });
  }
  public getVenueImage = async (filterData) => {
    const buildingData: any[] = await sp.web.lists
      .getByTitle("Venue")
      .items.select("Image", "CapacityperLayout", "FacilitiesAvailable", "VenueId", "Id")
      .filter(`Venue eq '${filterData}'`)
      .get();
    buildingData.forEach((item) => {
      const image = JSON.parse(item.Image);
      this.setState({
        venueImage: image.serverRelativeUrl,
        facilitiesAvailable: JSON.parse(
          JSON.stringify(item.FacilitiesAvailable)
        ),
        capacityperLayout: item.CapacityperLayout,
        venueId: item.VenueId,
        selectedID: item.Id,
      });
    });
  }
  public getItems = async (id) => {
    const item = await sp.web.lists
      .getByTitle("Request")
      .items.getById(id)
      .get();
    this.getVenueImage(item.Venue);
    this.inputRef.current.setFieldValue("referenceNumber", item.Id);
    this.inputRef.current.setFieldValue(
      "requestDate",
      dateFormat(item.Created)
    );
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
     // Room is managed by CRSD group
     this.setState({
          isDDMember:  !(participant.indexOf('BSP-QC Personnel') > -1 && participant.length === 1),
      });
    this.inputRef.current.setFieldValue("participants", participant);
    this.inputRef.current.setFieldValue("numberOfParticipant", item.NoParticipant);
    this.inputRef.current.setFieldValue("titleDesc", item.TitleDescription);
    this.inputRef.current.setFieldValue("fromDate", dateFormat(item.FromDate));
    this.inputRef.current.setFieldValue("toDate", dateFormat(item.ToDate));
    this.inputRef.current.setFieldValue(
      "otherRequirements",
      item.OtherRequirement
    );
    this.inputRef.current.setFieldValue("status", item.Status);
    this.inputRef.current.setFieldTouched("isCSDR", true, true);
    this.inputRef.current.setFieldValue("isCSDR", item.IsCSDR);
    this.getFiles(item.GUID);
    this.getDepartments(item.RequestorEmail);
    this.setState({
      showCSRDField: item.IsCSDR,
      requestor: item.RequestedBy,
      facilityData: JSON.parse(item.FacilityData),
      guid: item.GUID,
      status: item.Status,
      requestorEmail: item.RequestorEmail,
    });
  }
  public getDepartments = async (email) => {
    // get department as per current user only.
    const deparmentData: any[] = await sp.web.lists
      .getByTitle("UsersPerDepartment")
      .items.select(
        "EmployeeName/EMail",
        "Department/Department",
      ).filter(`EmployeeName/EMail eq '${email}'`)
      .expand(
        "Department/FieldValuesAsText",
        "EmployeeName/EMail",
      )
      .get();
  // Fetch department list and sector.
  const deparmentList: any[] = await sp.web.lists
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
    deparmentData.forEach((item) => {
      departmentSectorMap[item.Department.Department] = deprtObj[item.Department.Department];
    });
    const deparment = mapArrayToObject(departmentSectorMap);
    this.setState({
      departmentList: deparment,
      departmentSectorMap,
    });
  }
   public getBuildings = async () => {
    const buildingData: any[] = await sp.web.lists
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
    const venue = [];
    buildingData.forEach((item) => {
      const ImageObj = JSON.parse(item.Image) || { serverRelativeUrl : ''};
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
          venueId:item.VenueId,
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
  public getLayout = async () => {
    const layoutData: any[] = await sp.web.lists
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
    this.layout = layoutMap;
  }
  public getPrincipalUser = async () => {
    const principalData: any[] = await sp.web.lists
      .getByTitle("Employee")
      .items.select("EmployeeName", "Department/Department")
      .expand("Department/FieldValuesAsText")
      .filter(`PrincipalUser eq 'Yes'`)
      .get();
    const princialMap = {};
    principalData.forEach((item) => {
      if (!princialMap[item.Department.Department]) {
        princialMap[item.Department.Department] = [];
      }
      princialMap[item.Department.Department].push(item.EmployeeName);
    });
    this.princialDepartmentMap = princialMap;
  }
  public getPurposeofUse = async () => {
    const PurposeofUseData: any[] = await sp.web.lists
      .getByTitle("PurposeofUse")
      .items.select("Title")
      .get();
    const list = [];
    PurposeofUseData.forEach((item) => {
      list.push({ id: item.Title, value: item.Title });
    });
    this.setState({
      purposeOfUseList: [...list],
    });
  }
  public getParticipants = async () => {
    const participant: any[] = await sp.web.lists
      .getByTitle("Participants")
      .items.select("Title")
      .get();
    const list = [];
    participant.forEach((item) => {
      list.push({ id: item.Title, value: item.Title });
    });
    this.setState({
      participantList: [...list],
    });
  }
  public getFacility = async () => {
    const Facility: any[] = await sp.web.lists
      .getByTitle("Facility")
      .items.select("Title", "AssetNumber", "Facility", "Quantity")
      .get();
    const facility = {};
    Facility.forEach((item) => {
      facility[item.Facility] = item;
    });
    this.facilityMap = facility;
  }
  public getFiles = async (guid) => {
    let docs = await sp.web.getFolderByServerRelativeUrl(this.props.siteRelativeUrl + '/ReservationDocs/' + guid)
            .files
            .select("*")
            .top(5000)
            .expand('ListItemAllFields') // For Metadata extraction
            .get();

          let files = docs.map(row => {
            return row.Name;
          });
      this.setState({
        Files: [...files]
      });
  }
  public handleChipClick = (e, row) => {
    let f = `${this.props.siteUrl}/ReservationDocs/${this.state.guid}/${row}`;
    let link = document.createElement('a');
    link.href = f;
    link.download = f.substr(f.lastIndexOf('/') + 1);
    link.click();  
  }
  public getCRSD = async () => {
 
    const crsdUsers = await sp.web.siteGroups.getById(27).users();
    const ddUsers = await sp.web.siteGroups.getById(28).users();
    const list = crsdUsers.map(item => item.Email);
    const list2 = ddUsers.map(item => item.Email);
    this.setState({
      crsdMemberList: [...list],
      ddMemeberList: [...list2],
      approverList: [...list, ...list2],
    });
  }
  public updateRoomTimeSlot = async (id, venueId, fromDate, toDate) => {
    const venueData: any[] = await sp.web.lists.getByTitle("Venue").items.select(
      "Timeslot",
      "VenueId",
    )
    .filter(`VenueId eq ${venueId}`)
    .get();
    
    const venue  = venueData[0];
    const timeSlot = JSON.parse(venue.Timeslot) || [];
    // date is saved in ISO format.
    //const currentDate = moment().toISOString();
    // time will be [{fromDate - toDate}]
    // old date or past date need to remove.
    
   timeSlot.push(`${fromDate} ${toDate}`);

    await sp.web.lists.getByTitle('Venue').items.getById(id).update({
      Timeslot: JSON.stringify(timeSlot),
    });
  }
  public checkRoomAvailablity = async (venueId, fromDate, toDate) => {
    const venueData: any[] = await sp.web.lists
    .getByTitle("Venue")
    .items.select(
      "Timeslot",
      "VenueId",
    )
    .filter(`VenueId eq ${venueId}`)
    .get();
    
    const venue  = venueData[0];
    const TimeSlot = JSON.parse(venue.Timeslot) || [];
    let isAvailable = true;
    // if room is not available for any date then
    // immediately break the loop and exit with room status unavailable.
    for(let i = 0 ;i < TimeSlot.length; i++){
      const data = TimeSlot[i].split(" ");
      const [start , end] = data;
      isAvailable = (moment(fromDate).isAfter(start) && moment(fromDate).isAfter(end) 
                   && moment(toDate).isAfter(start) && moment(toDate).isAfter(end)) || 
                  ( moment(fromDate).isBefore(start) && moment(fromDate).isBefore(end) 
                  && moment(toDate).isBefore(start) && moment(toDate).isBefore(end)
                  );
      if(!isAvailable) {
         break;
      }
    }
   return isAvailable;
  }
}
