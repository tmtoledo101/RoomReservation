import * as React from "react";
import styles from "./ResViews.module.scss";
import { IResViewsProps } from "./IResViewsProps";
import { IResViewState } from "./IResViewState";
import {
  Grid,
  Paper,
  AppBar,
  Tabs,
  Tab,
  Button,
  FormControl,
} from "@material-ui/core";
import MaterialTable from "material-table";
import VisibilityIcon from "@material-ui/icons/Visibility";
import CloseIcon from "@material-ui/icons/Close";
import { Formik, Field } from "formik";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import * as yup from "yup";

import * as moment from "moment";

import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

const PENDING = "Pending for Approval";
const APPROVED = "Approved";
const DISAPPROVED = "Disapproved";
const CANCELLED = "Cancelled";

const headerObj = {
  "0": "By Reference No",
  "1": "Past Request",
  "2": "For Approval",
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
              <DatePicker
                clearable
                autoOk
                format="MM/dd/yyyy"
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
                className={styles.width}
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



const validateDateTime = (startDateTime, endDateTime) =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isSameOrAfter(startDateTime);

const validate = yup.object().shape({
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

export default class ResViews extends React.Component<
  IResViewsProps,
  IResViewState
> {
  public inputRef: any;

  constructor(props: IResViewsProps) {
    super(props);

    this.state = {
      items: [],
      menuTabs: ["By Reference No", "Past Request"],
      tabValue: 0,
      referenceNumberList: [],
      pastRequestList: [],
      approvalRequest: [],
      department: "",
    };
    this.inputRef = React.createRef<HTMLInputElement>();
  }
  protected handletabChange = (event, tabValue: Number) => {
    this.setState({
      tabValue,
    });
  }

  protected getData = () => {
    const { referenceNumberList, pastRequestList, approvalRequest, tabValue } =
      this.state;
    let array = referenceNumberList;
    if (tabValue === 1) {
      array = pastRequestList;
    }
    if (tabValue === 2) {
      array = approvalRequest;
    }
    return array;
  }

  public ViewAction = (event, rowData) => {
    window.open(
      this.props.siteUrl +
        "/SitePages/DisplayReservation_appge.aspx?pid=" +
        rowData["ID"],
      "_self"
    );
  }

  public handleSearch = (fromDate, toDate) => {
    this.getItems(fromDate, toDate);
  }

  public render(): React.ReactElement<IResViewsProps> {
    const { tabValue, menuTabs } = this.state;
    return (
      <Formik
        initialValues={{
          fromDate: "",
          toDate: "",
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
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  View Reservation Request
                </Grid>
                <Grid item xs={12}>
                  <Paper square className={styles.paper}>
                    <AppBar position="static" color="default">
                      <Tabs
                        value={tabValue}
                        indicatorColor="primary"
                        textColor="primary"
                        onChange={this.handletabChange}
                        aria-label="tabs example"
                        variant="scrollable"
                        scrollButtons="auto"
                      >
                        {menuTabs.map((item: any) => (
                          <Tab label={item} className={styles.tabbar} />
                        ))}
                      </Tabs>
                    </AppBar>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <div className={styles.width}>
                    <div className={styles.label}>From</div>
                    <CustomDateTimePicker name="fromDate" />
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <div className={styles.width}>
                    <div className={styles.label}>To</div>
                    <CustomDateTimePicker name="toDate" />
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <div className={styles.width}>
                    <Button
                      type="button"
                      variant="contained"
                      onClick={() =>
                        this.handleSearch(
                          formik.values.fromDate,
                          formik.values.toDate
                        )
                      }
                      color="primary"
                      disabled={ !formik.values.fromDate || !formik.values.toDate}
                    >
                      Search
                    </Button>
                  </div>
                </Grid>
                <Grid item xs={12}>
                  <Paper variant="outlined" className={styles.paper}>
                    <div>
                      <MaterialTable
                        title={headerObj[`${tabValue}`]}
                        columns={[
                          {
                            title: "Date of use - From",
                            field: "fromDate",
                            type: "date",
                            cellStyle: {
                              minWidth: 150,
                            },
                            render: (value) =>
                              value.fromDate
                                ? moment(value.fromDate).format("MM/DD/yyyy")
                                : null,
                          },
                          {
                            title: "Date of use - To",
                            field: "toDate",
                            type: "date",
                            cellStyle: {
                              minWidth: 150,
                            },
                            render: (value) =>
                              value.toDate
                                ? moment(value.toDate).format("MM/DD/yyyy")
                                : null,
                          },
                          {
                            title: "Building",
                            field: "building",
                          },
                          {
                            title: "Venue",
                            field: "venue",
                          },
                          {
                            title: "Reference No.",
                            field: "referenceNumber",
                          },
                          {
                            title: "Purpose of Use",
                            field: "purposeOfUse",
                          },
                          {
                            title: "Number of Participants",
                            field: "numberOfParticipants",
                          },
                          {
                            title: "Requested By",
                            field: "requestedBy",
                          },
                          {
                            title: "Department",
                            field: "department",
                          },
                          {
                            title: "Contact No.",
                            field: "contactNumber",
                          },
                          {
                            title: "Status",
                            field: "status",
                          },
                        ]}
                        data={this.getData()}
                        options={{
                          filtering: true,
                          pageSize: 5,
                          pageSizeOptions: [5, 10, this.getData().length],
                          search: false,
                          grouping: true,
                          selection: false,
                          columnsButton: false,
                          exportButton: true,
                        }}
                        actions={[
                          {
                            icon: () => <VisibilityIcon />,
                            tooltip: "View Record",
                            onClick: (event, rowData) => {
                              this.ViewAction("view", rowData);
                            },
                          },
                        ]}
                      />
                    </div>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="button"
                    variant="contained"
                    startIcon={<CloseIcon />}
                    onClick={() => this.Redirect()}
                    style={{
                      color: "lightgrey",
                      background: "grey",
                      float: "right",
                    }}
                  >
                    Close
                  </Button>
                </Grid>
              </Grid>
            </form>
          );
        }}
      </Formik>
    );
  }

  public Redirect = () => {
    window.open(this.props.siteUrl + "/SitePages/Home.aspx", "_self");
  }

  public componentDidMount() {
    this.getUser();
   
  }

  public dateConverter = (date, type) =>   {
    let result = null;
   if(type === 1) {
   result = `${moment(date).format("YYYY-MM-DD")}T00:00:00Z`;
   }  else if (type === 2) {
    result = `${moment(date).add(1, 'days').format("YYYY-MM-DD")}T00:00:00Z`;
   } 
  return result;
  }


  public getItems = async (from, to) => {
    // 2022-04-19T09:00:56.763
    const  { department } =  this.state;
    const dateRange = `FromDate ge datetime'${this.dateConverter(from, 1)}'and ToDate le datetime'${this.dateConverter(to, 2)}'`;
    let filterQuery = null;
    if(department.length) {
      let query = "";
      department.forEach((item, index) => {
        query += `Department eq '${item}'`;
        if((department.length - 1) != index){
          query+= ' or ';
        }
      });
      filterQuery = `${dateRange} and ${query}`;
    } else {
      filterQuery = `${dateRange}`;
    }

    const RequestItem: any[] = await sp.web.lists
      .getByTitle("Request")
      .items.select("*")
      .filter(`${filterQuery}`)
      .orderBy("Id", false)
      .get();
    const itemArray1 = [];
    const itemArray2 = [];
    const itemArray3 = [];
    RequestItem.forEach((item) => {
      const tempObj = {
        building: item.Building,
        venue: item.Venue,
        fromDate: item.FromDate,
        toDate: item.ToDate,
        referenceNumber: item.ReferenceNumber,
        purposeOfUse: item.PurposeOfUse,
        numberOfParticipants: item.NoParticipant,
        requestedBy: item.RequestedBy,
        department: item.Department,
        contactNumber: item.ContactNumber,
        status: item.Status,
        ID: item.Id,
      };
      itemArray1.push(tempObj);
      if (
        item.Status === APPROVED ||
        item.Status === DISAPPROVED ||
        item.Status === CANCELLED
      ) {
        itemArray2.push(tempObj);
      }
      if (item.Status === PENDING) {
        itemArray3.push(tempObj);
      }
    });
    this.setState({
      referenceNumberList: [...itemArray1],
      pastRequestList: [...itemArray2],
      approvalRequest: [...itemArray3],
    });
  }

  public getUser = async () => {
    const crsdUsers = await sp.web.siteGroups.getByName("CRSD").users();
    const ddUsers = await sp.web.siteGroups.getByName("DD").users();
    const currentUser = await sp.web.currentUser.get();

    const list = crsdUsers.map((item) => item.Email);
    const list2 = ddUsers.map((item) => item.Email);
    const useremail = currentUser.Email;

    if (list.indexOf(useremail) > -1 || list2.indexOf(useremail) > -1) {
      this.setState({
        menuTabs: ["By Reference No", "Past Request", "For Approval"],
      });
    }

    const deparmentData: any[] = await sp.web.lists
    .getByTitle("UsersPerDepartment")
    .items.select(
      "EmployeeName/EMail",
      "Department/Department",
    ).filter(`EmployeeName/EMail eq '${useremail}'`)
    .expand(
      "Department/FieldValuesAsText",
      "EmployeeName/EMail",
    )
    .get();
    const departList = [];
    deparmentData.forEach((item) => {
      departList.push(item.Department.Department);
    });
  this.setState({
    department: departList,
  });
  }
}
