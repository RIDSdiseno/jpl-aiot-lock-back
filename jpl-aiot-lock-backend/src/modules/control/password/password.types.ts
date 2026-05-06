export interface DynamicPasswordResponse {
  deviceId: string;
  hasPassword: boolean;
  password?: string;
  generatedAt?: string;
  warning: string;
}
