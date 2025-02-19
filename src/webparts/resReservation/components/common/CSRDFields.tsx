import * as React from "react";
import { Grid } from "@material-ui/core";
import { CustomInput, Dropdown } from "./FormComponents";
import styles from "../ResReservation.module.scss";
// Props Interface
interface ICSRDFieldsProps {
  showCSRDField: boolean; // Controls visibility of CRSD fields
  layoutList: any[]; // Available layout options
  principalList: any[]; // List of principal users
}

export const CSRDFields: React.FC<ICSRDFieldsProps> = ({
  showCSRDField,
  layoutList,
  principalList,
}) => {
  // Local state for principal list and initial load tracking
  const [localPrincipalList, setLocalPrincipalList] = React.useState(principalList);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  // Updates local principal list when props change
  React.useEffect(() => {
    console.log("CSRDFields - Principal list updated:", {
      newList: principalList,
      currentList: localPrincipalList,
      isInitialLoad
    });

    setLocalPrincipalList(principalList);
    
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [principalList]);
// Early return if CRSD fields should not be shown
  if (!showCSRDField) {
    console.log("CSRDFields - Not showing CRSD fields");
    return null;
  }

  console.log("CSRDFields - Rendering with principal list:", {
    localList: localPrincipalList,
    propsList: principalList,
    isInitialLoad
  });
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Layout Tables/Chairs*</div>
          <Dropdown items={layoutList} name="layout" />
        </div>
      </Grid>
      
      <Grid item xs={6}>
        <div className={styles.label}>Contact Person*</div>
        <CustomInput name="contactPerson" />
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Principal User*</div>
          <Dropdown 
            items={localPrincipalList} 
            name="principal"
            handleChange={async (e, formik) => {
              const value = e.target.value;
              console.log("CSRDFields - Principal selection changed:", value);
              
              try {
                // Set the value in formik and wait for it to complete
                await formik.setFieldValue("principal", value);
                await formik.setFieldTouched("principal", true);
                
                // Validate the form
                const errors = await formik.validateForm();
                
                // Log the updated formik values
                console.log("CSRDFields - Principal selection complete:", {
                  value,
                  formikValue: formik.values.principal,
                  allValues: formik.values,
                  touched: formik.touched,
                  errors
                });

                // If there are errors, reset the value
                if (errors.principal) {
                  console.error("CSRDFields - Principal validation error:", errors.principal);
                  await formik.setFieldValue("principal", "");
                }
              } catch (error) {
                console.error("CSRDFields - Error setting principal value:", error);
                // Reset on error
                await formik.setFieldValue("principal", "");
              }
            }}
            disabled={!showCSRDField}
          />
        </div>
      </Grid>
    </>
  );
};
