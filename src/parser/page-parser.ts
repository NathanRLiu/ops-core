import { YamlPage } from '../types';
import { validatePropertyExists } from './parser-utils';
import { Parser } from './parser';
import { Page as PageType } from '@tinystacks/ops-model';

export class PageParser extends Parser implements PageType {
  id?: string;
  route: string;
  widgetIds: string[];

  constructor (
    route: string,
    widgetIds: string[] = [], 
    id?: string
  ) {
    super();
    this.id = id;
    this.route = route;
    this.widgetIds = widgetIds;
  }

  static parse (yamlPage: YamlPage, id?:string): PageType { 

    const {
      route,
      widgets
    } = yamlPage; 

    const widgetIds = widgets.map((item) => { 
      const [_, __, ___, widgetId ] = item.$ref.split('/');
      return widgetId;
    });

  
    return {
      route, 
      widgetIds, 
      id
    };
  }

  static fromJson (object: PageType): PageParser {
    const { 
      id,
      route,
      widgetIds
    } = object; 

    validatePropertyExists(object, 'widgets', 'Page');
    validatePropertyExists(object, 'route', 'Page'); 

    return new PageParser (
      route, 
      widgetIds, 
      id
    );
  }

  toJson (): PageType { 

    return { 
      id: this.id, 
      route: this.route, 
      widgetIds: this.widgetIds
    };
  }

  toYaml (page: PageType): YamlPage {
    const { 
      route, 
      widgetIds,
      id
    } = page;
    // This is cheap and restrictive, we should store the original ref on the widget and use that here.
    const widgets = widgetIds.map(widgetId => ({ $ref: `#/Console/widgets/${widgetId}` }));
    return {
      route,
      widgets,
      id 
    };
  }

}