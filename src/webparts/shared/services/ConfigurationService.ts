/**
 * ConfigurationService.ts:
 *
 * This file defines the ConfigurationService, a singleton class responsible for managing and providing configuration settings for the application.
 * It determines the environment (test or production) and provides URLs and other configuration values based on the detected environment.
 * This ensures that the application can adapt its behavior and settings based on where it is deployed.
 */


import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export class ConfigurationService {
  private static instance: ConfigurationService;
  private environment: string = "prd"; //test || prd
  private user : string = "bsp"; //dev || bsp
  
  public readonly TEST_URL = "https://s5b36.sharepoint.com";
  public readonly PROD_URL = "https://bspgovph.sharepoint.com";
  
  private constructor() {
    console.log("ConfigurationService initialized");
    console.log("Initial environment:", this.environment);
  }

  public testEnvironmentConfig(): void {
    console.log("Current environment configuration:");
    console.log("Environment:", this.environment);
    console.log("User:", this.user);
    console.log("Is test environment:", this.isTestEnvironment());
    console.log("Base URL:", this.getBaseUrl());
    console.log("Access Control URL:", this.getAccessControlUrl());
    console.log("Resource Reservation URL:", this.getResourceReservationUrl());
  }

  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  public setEnvironment(env: string): void {
    const previousEnv = this.environment;
    this.environment = env.toLowerCase();
    console.log(`Environment changed from ${previousEnv} to ${this.environment}`);
    this.testEnvironmentConfig();
  }

  public getWorkbenchUrl(): string {
    return `${this.getBaseUrl()}/sites/ResourceReservationDev/_layouts/15/workbench.aspx`;
  }

  public initializeEnvironment(): void {
    try {
      const currentUrl = window.location.href;
      console.log("Current URL:", currentUrl);
      
      if (currentUrl.includes('s5b36.sharepoint.com')) {
        this.setEnvironment('test');
      } else if (currentUrl.includes('bspgovph.sharepoint.com')) {
        this.setEnvironment('prod');
      } else {
        console.log("Could not detect environment from URL, using default:", this.environment);
      }
    } catch (error) {
      console.error("Error initializing environment:", error);
      console.log("Using default environment:", this.environment);
    }
  }

  public isTestEnvironment(): boolean {
    return this.environment.includes("test");
  }
  public isDevUser(): boolean {
    return this.user.includes("dev");
  }

  public getBaseUrl(): string {
    return this.isTestEnvironment() ? this.TEST_URL : this.PROD_URL;
  }

  public getAccessControlUrl(): string {
    return `${this.getBaseUrl()}/sites/AccessControl`;
  }

  public getResourceReservationUrl(): string {
    return `${this.getBaseUrl()}/sites/ResourceReservation`;
  }

  public getCommentHideCssUrl(): string {
    return `${this.getResourceReservationUrl()}/Shared%20Documents/commentHide.css`;
  }
}

export const configService = ConfigurationService.getInstance();