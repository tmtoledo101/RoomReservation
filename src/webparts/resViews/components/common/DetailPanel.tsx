import * as React from 'react';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { ITableItem } from '../interfaces/IResViews';
import { formatDate } from '../utils/helpers';
import styles from '../styles/DetailPanel.module.scss';

interface IDetailPanelProps {
  isOpen: boolean;
  item: ITableItem | null;
  onDismiss: () => void;
}

export const DetailPanel: React.FC<IDetailPanelProps> = ({ isOpen, item, onDismiss }) => {
  if (!item) return null;

  const getStatusClassName = (status: string): string => {
    const baseClass = styles.statusBadge;
    switch (status.toLowerCase()) {
      case 'approved':
        return `${baseClass} ${styles.approved}`;
      case 'pending':
        return `${baseClass} ${styles.pending}`;
      case 'rejected':
        return `${baseClass} ${styles.rejected}`;
      default:
        return `${baseClass} ${styles.default}`;
    }
  };

  const renderDetailRow = (label: string, value: string, icon?: string) => (
    <Stack horizontal tokens={{ childrenGap: 8 }} className={styles.detailRow}>
      {icon && <Icon iconName={icon} className={styles.icon} />}
      <Text className={styles.detailLabel}>{label}:</Text>
      <Text className={styles.detailValue}>{value}</Text>
    </Stack>
  );

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      headerText="Reservation Details"
      type={PanelType.medium}
      closeButtonAriaLabel="Close"
      styles={{
        main: { marginTop: 0 },
        headerText: styles.panelHeader,
        content: styles.panelContent
      }}
    >
      <Stack tokens={{ childrenGap: 15 }}>
        {/* Reference and Status Section */}
        <div className={styles.section}>
          <Stack horizontal horizontalAlign="space-between">
            <Stack.Item>
              {renderDetailRow('Reference Number', item.referenceNumber, 'NumberSymbol')}
            </Stack.Item>
            <Stack.Item>
              <span className={getStatusClassName(item.status)}>{item.status}</span>
            </Stack.Item>
          </Stack>
        </div>

        {/* Date and Time Section */}
        <Text className={styles.sectionHeader}>Date and Time</Text>
        <div className={styles.section}>
          {renderDetailRow('From', formatDate(item.fromDate), 'Calendar')}
          {renderDetailRow('To', formatDate(item.toDate), 'Calendar')}
        </div>

        {/* Location Section */}
        <Text className={styles.sectionHeader}>Location</Text>
        <div className={styles.section}>
          {renderDetailRow('Building', item.building, 'CityNext')}
          {renderDetailRow('Venue', item.venue, 'Room')}
        </div>

        {/* Event Details Section */}
        <Text className={styles.sectionHeader}>Event Details</Text>
        <div className={styles.section}>
          {renderDetailRow('Purpose of Use', item.purposeOfUse, 'Info')}
          {renderDetailRow('Number of Participants', item.numberOfParticipants.toString(), 'People')}
        </div>

        {/* Contact Information Section */}
        <Text className={styles.sectionHeader}>Contact Information</Text>
        <div className={styles.section}>
          {renderDetailRow('Requested By', item.requestedBy, 'Contact')}
          {renderDetailRow('Department', item.department, 'Teamwork')}
          {renderDetailRow('Contact Number', item.contactNumber, 'Phone')}
        </div>
      </Stack>
    </Panel>
  );
};
