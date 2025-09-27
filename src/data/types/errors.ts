export interface DataLayerError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface DataLayerSuccess<T> {
  success: true;
  data: T;
}

export type DataLayerResponse<T> = DataLayerSuccess<T> | DataLayerError;