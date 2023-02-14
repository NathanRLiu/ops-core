import { Json } from '../types';

export abstract class Parseable {
  static fromYaml (_yamlJson: Json, _id?: string): Parseable {
    throw new Error('Method not implemented.');
  }
  abstract toYaml (): Json;
  
  static fromJson (_object: Json): Parseable {
    throw new Error('Method not implemented.');
  }
  abstract toJson (): Json;
}