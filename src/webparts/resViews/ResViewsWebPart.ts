import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'ResViewsWebPartStrings';
import ResViews from './components/ResViews';
import { IResViewsProps } from './components/IResViewsProps';
import { sp } from "@pnp/sp/presets/all";
import { SPComponentLoader } from '@microsoft/sp-loader';
import { configService } from '../shared/services/ConfigurationService';
export interface IResViewsWebPartProps {
  description: string;
  siteUrl: string;
}

export default class ResViewsWebPart extends BaseClientSideWebPart<IResViewsWebPartProps> {
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
    const element: React.ReactElement<IResViewsProps > = React.createElement(
      ResViews,
      {
        description: this.properties.description,
        siteUrl: this.context.pageContext.web.absoluteUrl
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
