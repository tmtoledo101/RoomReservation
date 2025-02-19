
/**
 * enivronmentHelper.ts:
 *
 * This file provides utility functions for determining the current environment and access permissions.
 * It uses the ConfigurationService to check if the application is running in development mode and if the user has group members access.
 */

import { configService } from "../../shared/services/ConfigurationService";

export const isDevelopmentMode = (): boolean => {
  return configService.isDevUser() && !configService.isTestEnvironment();
};



export const hasGroupMembersAccess = (): boolean => {
  if (!configService.isDevUser()) {
    return true;
  }
  
  return configService.isTestEnvironment();
};
