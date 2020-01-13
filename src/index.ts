export * from './intent';

export interface IEndConfig {
  intentFilters?: IIntentFilter[];
  name: string;
}

export interface IIntent {
  action: string;
  data: any;
}

export interface IIntentFilter {
  action: string;
}
