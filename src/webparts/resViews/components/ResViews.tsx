import * as React from "react";
import { Grid, Button } from "@material-ui/core";
import { Formik } from "formik";
import CloseIcon from "@material-ui/icons/Close";
import * as yup from "yup";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";

import { SharePointService, IRequestItem } from "./services/SharePointService";
import { DateRangePicker } from "./common/DateRangePicker";
import { RequestTable } from "./common/RequestTable";
import { TabPanel, TabContent } from "./common/TabPanel";
import { TAB_HEADERS } from "./constants";
import { validateDateTime } from "./utils/dateUtils";
import { IResViewsProps } from "./IResViewsProps";
import { IResViewState } from "./IResViewState";
import styles from "./ResViews.module.scss";

const validate = yup.object().shape({
  fromDate: yup.date().required("From date is required"),
  toDate: yup.date()
    .required("To date is required")
    .test("date-range", "Invalid date range", function(value) {
      return validateDateTime(this.parent.fromDate, value);
    })
});
export default class ResViews extends React.Component<IResViewsProps, IResViewState> {
  private spService: SharePointService;
  private formikRef: any;

  constructor(props: IResViewsProps) {
    super(props);
    this.spService = new SharePointService();
    this.formikRef = React.createRef();

    this.state = {
      items: [],
      menuTabs: ["By Reference No", "Past Request"],
      tabValue: 0,
      referenceNumberList: [],
      pastRequestList: [],
      approvalRequest: [],
      department: [],
    };
  }

  public async componentDidMount() {
    await this.initializeComponent();
  }

  private async initializeComponent() {
    try {
      const currentUser = await this.spService.getCurrentUser();
      const { crsdUsers, ddUsers } = await this.spService.getUserGroups();
      const departments = await this.spService.getUserDepartments(currentUser.Email);

      const isApprover = crsdUsers.includes(currentUser.Email) || 
                        ddUsers.includes(currentUser.Email);

      this.setState({
        department: departments,
        menuTabs: isApprover ? 
          ["By Reference No", "Past Request", "For Approval"] :
          ["By Reference No", "Past Request"]
      });
    } catch (error) {
      console.error('Error initializing component:', error);
    }
  }

  private handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    this.setState({ tabValue: newValue });
  }

  private handleSearch = async (fromDate: MaterialUiPickersDate, toDate: MaterialUiPickersDate) => {
    try {
      const { allRequests, pastRequests, pendingRequests } = 
        await this.spService.getRequestItems(fromDate, toDate, this.state.department);

      this.setState({
        referenceNumberList: allRequests,
        pastRequestList: pastRequests,
        approvalRequest: pendingRequests
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  }

  private handleView = (rowData: IRequestItem) => {
    window.open(
      `${this.props.siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${rowData.ID}`,
      "_self"
    );
  }

  private handleClose = () => {
    window.open(`${this.props.siteUrl}/SitePages/Home.aspx`, "_self");
  }

  private getCurrentData = (): IRequestItem[] => {
    const { referenceNumberList, pastRequestList, approvalRequest, tabValue } = this.state;
    
    switch (tabValue) {
      case 1:
        return pastRequestList;
      case 2:
        return approvalRequest;
      default:
        return referenceNumberList;
    }
  }

  public render(): React.ReactElement<IResViewsProps> {
    const { tabValue, menuTabs } = this.state;
    const currentTitle = TAB_HEADERS[tabValue] || "";

    return (
      <Formik
        initialValues={{ fromDate: null, toDate: null }}
        validationSchema={validate}
        innerRef={this.formikRef}
        onSubmit={() => {}}
      >
        {(formik) => (
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                View Reservation Request
              </Grid>

              <Grid item xs={12}>
                <TabPanel
                  tabs={menuTabs}
                  value={tabValue}
                  onChange={this.handleTabChange}
                />
              </Grid>

              <DateRangePicker
                onSearch={this.handleSearch}
                formik={formik}
              />

              <Grid item xs={12}>
                <TabContent value={tabValue} index={tabValue}>
                  <RequestTable
                    title={currentTitle}
                    data={this.getCurrentData()}
                    onView={this.handleView}
                  />
                </TabContent>
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="button"
                  variant="contained"
                  startIcon={<CloseIcon />}
                  onClick={this.handleClose}
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
        )}
      </Formik>
    );
  }
}
