export type ActivityType = "Orderbook" | "Trades" | "Transfers" | "Qswap" | "Airdrop" | "QTREATZ" | "NFTS";

export interface ActivityData {
  epoch: number;
  activity: ActivityType;
  items: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  [key: string]: any; // Extensible for different activity types
}
