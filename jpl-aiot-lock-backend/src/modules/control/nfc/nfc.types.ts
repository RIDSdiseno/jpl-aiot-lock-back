export interface NfcCardItem {
  id: string;
  deviceId: string;
  cardNumber: string;
  blockNumber?: string;
  status: "ACTIVE" | "PENDING_SYNC" | "REMOVED";
  syncedAt?: string;
}
