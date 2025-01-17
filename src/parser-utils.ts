import get from 'lodash.get';
import isNil from 'lodash.isnil';
import { Console as ConsoleType, Provider, Widget } from '@tinystacks/ops-model';
import { BaseWidget } from './base-widget';

export function validatePropertyExists (obj: any, propertyName: string, objectType: string){
  const propertyValue = get(obj, propertyName);
  if (isNil(propertyValue)) {
    throw Error(`Property '${propertyName}' is missing on object type '${objectType}' object ${JSON.stringify(obj)}`);
  }
  return;
}

export function validateWidgetReferences (widgets: { [id: string]: Widget} , widgetReferences: string[]){
  for(let i = 0; i < widgetReferences.length; ++i){
    const found = widgets[ widgetReferences[i]];
    if(!found){
      throw Error(`Widget reference ${widgetReferences[i]} is not defined`);
    }
  }
}

export function validateProviderReferences (providers: { [id: string]: Provider}, providerReferences: string[]){
  for(let i = 0; i < providerReferences.length; ++i){
    const found = providers[providerReferences[i]];
    if(!found){
      throw Error(`Provider reference ${providerReferences[i]} is not defined`);
    }
  }
}

export function validateConsole (console: ConsoleType): void{
  validatePropertyExists(console, 'name', 'Console');
  validatePropertyExists(console, 'providers', 'Console');
  validatePropertyExists(console, 'dashboards', 'Console');
  validatePropertyExists(console, 'widgets', 'Console');
  validatePropertyExists(console, 'dependencies', 'Console');

  const allWidgetIds: string[] = [];
  const allProviders: string[] = [];
  Object.keys(console.dashboards).forEach((id) => {
    allWidgetIds.push(...console.dashboards[id].widgetIds);
  });


  Object.keys(console.widgets).forEach((id) => {
    allProviders.push(...(console.widgets[id].providerIds || []));
  });


  validateWidgetReferences(console.widgets, allWidgetIds);
  validateProviderReferences(console.providers, allProviders);
}

export async function dynamicRequire<E extends { type: string }> (object: E, dependencySource: string): Promise<BaseWidget> {
  try {
    const WidgetType: any = (await import(dependencySource))[object.type];
    const widget = await WidgetType.fromJson(object);
    return widget;
  } catch(e){
    console.error(e);
    throw Error(`Error trying to load module ${dependencySource} for type ${object.type}`);
  }
}