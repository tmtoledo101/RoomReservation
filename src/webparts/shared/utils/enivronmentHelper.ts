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

configService.isDevUser() && configService.isTestEnvironment()