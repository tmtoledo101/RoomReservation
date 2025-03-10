import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'ResReservationWebPartStrings';
import ResReservation from './components/ResReservation';
import { IResReservationProps } from './components/IResReservationProps';
import { sp } from "@pnp/sp/presets/all";
import { SPComponentLoader } from '@microsoft/sp-loader';
import { configService } from '../shared/services/ConfigurationService';
export interface IResReservationWebPartProps {
  description: string;
  siteUrl: string;
}

export default class ResReservationWebPart extends BaseClientSideWebPart<IResReservationWebPartProps> {
  
    protected async onInit(): Promise<void> {
      return super.onInit().then(async _ => {
        try {
          console.log("Initializing ResDisplayWebPart");
          
          // Initialize environment
          configService.initializeEnvironment();
          configService.testEnvironmentConfig();
  
          // Load common CSS files
          console.log("Loading common CSS files");
          SPComponentLoader.loadCss('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap');
          SPComponentLoader.loadCss('https://fonts.googleapis.com/icon?family=Material+Icons');
          
          // Load environment-specific CSS
          const cssUrl = configService.getCommentHideCssUrl();
          console.log("Loading environment-specific CSS from:", cssUrl);
          SPComponentLoader.loadCss(cssUrl);
  
          sp.setup({
            sp: {
              headers: {
                Accept: "application/json;odata=verbose",
              },
              baseUrl: this.context.pageContext.web.absoluteUrl,
            }
          });
        } catch (error) {
          console.error("Error in ResDisplayWebPart initialization:", error);
          throw error;
        }
    
        sp.setup({
          spfxContext: this.context,
          sp: {
            headers: {
              Accept: "application/json;odata=verbose",
            },
            baseUrl: this.context.pageContext.web.absoluteUrl,
          }
        });
      });
    }
  public render(): void {
    const element: React.ReactElement<IResReservationProps > = React.createElement(
      ResReservation,
      {
        description: this.properties.description,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
