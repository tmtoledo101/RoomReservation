/**
 * IResDisplayProps.ts:
 *
 * This file defines the interface for the ResDisplay component's properties.
 */
import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IResDisplayProps {
  context: WebPartContext;
  description: string;
  siteUrl: string;
  siteRelativeUrl: string;
}
