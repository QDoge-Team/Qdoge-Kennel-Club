import { BACKEND_API_URL } from "@/constants";

export interface Epoch {
  epoch_num: number;
  start_tick: string;
  end_tick: string | null;
  total_airdrop: string;
  is_ongoing: boolean;
}

export interface EpochsResponse {
  epochs: Epoch[];
}

export interface EpochTrade {
  trade_id: number;
  tx_hash: string;
  taker_wallet: string;
  taker_is_zealy_registered: boolean;
  maker_wallet: string;
  maker_is_zealy_registered: boolean;
  tickdate: string;
  price: string;
  quantity: string;
  type: "buy" | "sell";
  total: string;
}

export interface EpochTradesResponse {
  epoch_num: number;
  trades: EpochTrade[];
}

export interface EpochRangeTradesResponse {
  start_epoch: number;
  end_epoch: number;
  trades: EpochTrade[];
}

export interface AirdropResult {
  rank: number;
  wallet_id: string;
  is_zealy_registered: boolean;
  buy_amount: string;
  token_amount: string;
  trade_result: string;
  send_transfer_amount: string;
  total_balance: string;
  airdrop_amount: string;
}

export interface AirdropResultsResponse {
  epoch_num: number;
  threshold: string;
  results: AirdropResult[];
}

export interface AirdropPreviewResponse {
  epoch_num: number;
  total_airdrop: string;
  threshold: string;
  distributed: number;
  is_ongoing: boolean;
  preview: boolean;
  results: AirdropResult[];
}

export interface EpochTransfer {
  transfer_id: number;
  tx_hash: string;
  source: string;
  destination: string;
  issuer: string;
  asset_name: string;
  amount: string;
  tick: number;
  tickdate: string;
  money_flew: boolean;
}

export interface EpochTransfersResponse {
  epoch_num: number;
  transfers: EpochTransfer[];
}

export interface EpochRangeTransfersResponse {
  start_epoch: number;
  end_epoch: number;
  transfers: EpochTransfer[];
}

export interface MonthlyAirdropResult {
  rank: number;
  wallet_id: string;
  is_zealy_registered: boolean;
  buy_amount: string;
  token_amount: string;
  airdrop_amount: string;
}

export interface MonthlyAirdropPreviewResponse {
  start_epoch: number;
  end_epoch: number;
  period: string;
  epochs_included?: number[];
  window_complete?: boolean;
  total_airdrop: string;
  distributed: number;
  is_ongoing: boolean;
  preview: boolean;
  results: MonthlyAirdropResult[];
}

export interface QTreatzAssetBalance {
  asset_name: string;
  balance: string;
}

export interface QTreatzOverview {
  updated_at: string;
  qtreatz_wallet: {
    wallet_id: string;
    qubic_balance: string;
    assets: QTreatzAssetBalance[];
  };
  qdoge_wallet: {
    wallet_id: string;
    qtreat_asset_balance: string;
  };
  qtreat_total_supply: string;
  circulating_qtreat: string;
  qubic_per_circulating_qtreat: string | null;
}

export interface QubicBayMetadata {
  trait_type: string;
  value: string;
}

export interface QubicBayNFT {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  uri: string;
  metadata: QubicBayMetadata[];
  creatorId: string;
  ownerId: string;
  collectionId: number;
  royalty: number;
  lastPrice: string;
  totalTrades: number;
  totalTradeVolume: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export interface QubicBayUser {
  id: string;
  username: string | null;
  admin: boolean;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  socialLinks: Record<string, string | null> | null;
  createdAt: string;
  updatedAt: string;
}

export interface QubicBayListing {
  id: number;
  nftId: number;
  sellerId: string;
  price: string;
  fee: string | null;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  nft: QubicBayNFT;
  seller: QubicBayUser;
}

export interface QubicBayListingsResponse {
  results: QubicBayListing[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface QSwapTransaction {
  transaction_id: number;
  tx_hash: string;
  wallet: string;
  source: string;
  amount: string;
  number_of_shares: string;
  tick_number: number;
  timestamp: string;
  issuer: string;
  asset_name: string;
  transaction_type: "buy" | "sell";
  input_type: number;
}

export interface QSwapTransactionsResponse {
  page: number;
  size: number;
  transactions: QSwapTransaction[];
}

export interface WalletQSwapTransactionsResponse {
  wallet_id: string;
  page: number;
  size: number;
  total_shares_bought: string;
  total_shares_sold: string;
  net_shares: string;
  transactions: QSwapTransaction[];
}

export interface EpochQSwapTransactionsResponse {
  epoch_num: number;
  transactions: QSwapTransaction[];
}

// Fetch all epochs
export const fetchEpochs = async (): Promise<Epoch[]> => {
  const response = await fetch(`${BACKEND_API_URL}/epochs`);
  if (!response.ok) {
    throw new Error(`Failed to fetch epochs: ${response.statusText}`);
  }
  const data: EpochsResponse = await response.json();
  return data.epochs;
};

// Fetch a specific epoch
export const fetchEpoch = async (epochNum: number): Promise<Epoch> => {
  const response = await fetch(`${BACKEND_API_URL}/epochs/${epochNum}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch epoch ${epochNum}: ${response.statusText}`);
  }
  const data: Epoch = await response.json();
  return data;
};

// Fetch current epoch
export const fetchCurrentEpoch = async (): Promise<Epoch> => {
  const response = await fetch(`${BACKEND_API_URL}/epochs/current`);
  if (!response.ok) {
    throw new Error(`Failed to fetch current epoch: ${response.statusText}`);
  }
  const data: Epoch = await response.json();
  return data;
};

// Fetch trades for a specific epoch
export const fetchEpochTrades = async (epochNum: number): Promise<EpochTrade[]> => {
  const response = await fetch(`${BACKEND_API_URL}/epochs/${epochNum}/trades`);
  if (!response.ok) {
    throw new Error(`Failed to fetch trades for epoch ${epochNum}: ${response.statusText}`);
  }
  const data: EpochTradesResponse = await response.json();
  return data.trades;
};

export const fetchEpochRangeTrades = async (startEpoch: number, endEpoch: number): Promise<EpochTrade[]> => {
  const response = await fetch(`${BACKEND_API_URL}/epoch-ranges/${startEpoch}/${endEpoch}/trades`);
  if (!response.ok) {
    throw new Error(`Failed to fetch trades for epoch range ${startEpoch}~${endEpoch}: ${response.statusText}`);
  }
  const data: EpochRangeTradesResponse = await response.json();
  return data.trades;
};

// Fetch airdrop results for a specific epoch (ADMIN ONLY)
export const fetchAirdropResults = async (epochNum: number, walletId: string): Promise<AirdropResult[]> => {
  const response = await fetch(`${BACKEND_API_URL}/epochs/${epochNum}/airdrop-results`, {
    headers: {
      "X-Wallet-Id": walletId,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch airdrop results for epoch ${epochNum}: ${response.statusText}`);
  }
  const data: AirdropResultsResponse = await response.json();
  return data.results;
};

// Fetch airdrop preview for a specific epoch (real-time calculation) (ADMIN ONLY)
export const fetchAirdropPreview = async (epochNum: number, walletId: string): Promise<AirdropPreviewResponse> => {
  const response = await fetch(`${BACKEND_API_URL}/epochs/${epochNum}/airdrop-preview`, {
    headers: {
      "X-Wallet-Id": walletId,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch airdrop preview for epoch ${epochNum}: ${response.statusText}`);
  }
  const data: AirdropPreviewResponse = await response.json();
  return data;
};

// Fetch transfers for a specific epoch
export const fetchEpochTransfers = async (epochNum: number): Promise<EpochTransfer[]> => {
  const response = await fetch(`${BACKEND_API_URL}/epochs/${epochNum}/transfers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transfers for epoch ${epochNum}: ${response.statusText}`);
  }
  const data: EpochTransfersResponse = await response.json();
  return data.transfers;
};

export const fetchEpochRangeTransfers = async (startEpoch: number, endEpoch: number): Promise<EpochTransfer[]> => {
  const response = await fetch(`${BACKEND_API_URL}/epoch-ranges/${startEpoch}/${endEpoch}/transfers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transfers for epoch range ${startEpoch}~${endEpoch}: ${response.statusText}`);
  }
  const data: EpochRangeTransfersResponse = await response.json();
  return data.transfers;
};

export const fetchMonthlyAirdropPreview = async (startEpoch: number, endEpoch: number, walletId: string): Promise<MonthlyAirdropPreviewResponse> => {
  const response = await fetch(`${BACKEND_API_URL}/epoch-ranges/${startEpoch}/${endEpoch}/monthly-airdrop-preview`, {
    headers: {
      "X-Wallet-Id": walletId,
    },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const msg = typeof detail?.detail === "string" ? detail.detail : response.statusText;
    throw new Error(`Failed to fetch monthly airdrop preview for ${startEpoch}~${endEpoch}: ${msg}`);
  }
  return response.json();
};

export const fetchQTreatzOverview = async (): Promise<QTreatzOverview> => {
  const response = await fetch(`${BACKEND_API_URL}/qtreatz/overview`);
  if (!response.ok) {
    throw new Error(`Failed to fetch QTREATZ overview: ${response.statusText}`);
  }
  return response.json();
};

export interface FetchQubicBayQdogeListingsOptions {
  page?: number;
  limit?: number;
  fetchAllPages?: boolean;
}

export const fetchQubicBayQdogeListings = async (
  options: FetchQubicBayQdogeListingsOptions = {},
): Promise<QubicBayListing[]> => {
  const { page = 1, limit = 46, fetchAllPages = true } = options;

  const fetchPage = async (targetPage: number): Promise<QubicBayListingsResponse> => {
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(targetPage),
      details: "true",
      status: "ACTIVE",
      sortBy: "createdAt",
      sortType: "desc",
      collectionId: "15",
    });

    const response = await fetch(`https://api.qubicbay.io/v1/listings?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch QDOGE NFT listings: ${response.statusText}`);
    }
    return response.json();
  };

  const firstPage = await fetchPage(page);
  if (!fetchAllPages || firstPage.totalPages <= page) {
    return firstPage.results;
  }

  const allListings = [...firstPage.results];
  for (let nextPage = page + 1; nextPage <= firstPage.totalPages; nextPage += 1) {
    const next = await fetchPage(nextPage);
    allListings.push(...next.results);
  }

  return allListings;
};

export interface UserInfo {
  wallet_id: string;
  role: "normal" | "admin";
  created_at: string;
  updated_at: string;
}

export interface RegisterUserResponse {
  success: boolean;
  wallet_id: string;
  role: "normal" | "admin";
  is_new: boolean;
}

export interface CreateWalletChangeRequestPayload {
  old_address: string;
  new_address: string;
  email: string;
  discord_handle: string;
  twitter_username: string;
}

export interface CreateWalletChangeRequestResponse {
  success: boolean;
  request_id: number;
  message: string;
}

export interface WalletChangeRequestItem {
  request_id: number;
  zealy_user_id: string;
  zealy_name: string | null;
  old_address: string;
  new_address: string;
  email: string | null;
  discord_handle: string | null;
  twitter_username: string | null;
  created_at: string;
}

export interface WalletChangeRequestListResponse {
  requests: WalletChangeRequestItem[];
}

export interface WalletChangeRequestActionResponse {
  success: boolean;
  request_id: number;
  message: string;
}

// Register user when wallet connects
export const registerUser = async (walletId: string): Promise<RegisterUserResponse> => {
  const response = await fetch(`${BACKEND_API_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ wallet_id: walletId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to register user: ${response.statusText}`);
  }
  return response.json();
};

// Get user info including role
export const fetchUserInfo = async (walletId: string): Promise<UserInfo> => {
  const response = await fetch(`${BACKEND_API_URL}/users/${walletId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }
  return response.json();
};

export const createWalletChangeRequest = async (
  payload: CreateWalletChangeRequestPayload
): Promise<CreateWalletChangeRequestResponse> => {
  const response = await fetch(`${BACKEND_API_URL}/zealy/wallet-change-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to create wallet change request: ${response.statusText}`);
  }

  return response.json();
};

export const fetchWalletChangeRequests = async (
  apiKey: string
): Promise<WalletChangeRequestItem[]> => {
  const response = await fetch(`${BACKEND_API_URL}/admin/zealy/wallet-change-requests`, {
    headers: {
      "X-Admin-API-Key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to fetch wallet change requests: ${response.statusText}`);
  }

  const data: WalletChangeRequestListResponse = await response.json();
  return data.requests;
};

export const approveWalletChangeRequest = async (
  requestId: number,
  apiKey: string
): Promise<WalletChangeRequestActionResponse> => {
  const response = await fetch(`${BACKEND_API_URL}/admin/zealy/wallet-change-requests/${requestId}/approve`, {
    method: "PUT",
    headers: {
      "X-Admin-API-Key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to approve wallet change request: ${response.statusText}`);
  }

  return response.json();
};

export const rejectWalletChangeRequest = async (
  requestId: number,
  apiKey: string
): Promise<WalletChangeRequestActionResponse> => {
  const response = await fetch(`${BACKEND_API_URL}/admin/zealy/wallet-change-requests/${requestId}/reject`, {
    method: "PUT",
    headers: {
      "X-Admin-API-Key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to reject wallet change request: ${response.statusText}`);
  }

  return response.json();
};

// Admin API call helper - set epoch total airdrop
export const setEpochTotalAirdrop = async (
  epochNum: number,
  totalAirdrop: number,
  apiKey: string
): Promise<{ success: boolean; epoch_num: number; total_airdrop: string }> => {
  const response = await fetch(`${BACKEND_API_URL}/admin/epochs/${epochNum}/total-airdrop?total_airdrop=${totalAirdrop}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-API-Key": apiKey,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to set total airdrop: ${response.statusText}`);
  }
  return response.json();
};

// Admin API call helper - set epoch threshold
export const setEpochThreshold = async (
  epochNum: number,
  threshold: number,
  apiKey: string
): Promise<{ success: boolean; epoch_num: number; threshold: string }> => {
  const response = await fetch(`${BACKEND_API_URL}/admin/epochs/${epochNum}/threshold?threshold=${threshold}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-API-Key": apiKey,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to set threshold: ${response.statusText}`);
  }
  return response.json();
};

// Fetch all QDOGE transactions (paginated)
export const fetchQSwapTransactions = async (page = 0, size = 100, wallet?: string): Promise<QSwapTransaction[]> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (wallet) {
    params.append("wallet", wallet);
  }
  
  const response = await fetch(`${BACKEND_API_URL}/qswap-transactions?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch QDOGE transactions: ${response.statusText}`);
  }
  const data: QSwapTransactionsResponse = await response.json();
  return data.transactions;
};

// Fetch QDOGE transactions for a specific wallet
export const fetchWalletQSwapTransactions = async (walletId: string, page = 0, size = 100): Promise<WalletQSwapTransactionsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  
  const response = await fetch(`${BACKEND_API_URL}/qswap-transactions/wallet/${walletId}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch QDOGE transactions for wallet ${walletId}: ${response.statusText}`);
  }
  return response.json();
};

// Fetch QDOGE transactions for a specific epoch
export const fetchEpochQSwapTransactions = async (epochNum: number): Promise<QSwapTransaction[]> => {
  const response = await fetch(`${BACKEND_API_URL}/epochs/${epochNum}/qswap-transactions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch QDOGE transactions for epoch ${epochNum}: ${response.statusText}`);
  }
  const data: EpochQSwapTransactionsResponse = await response.json();
  return data.transactions;
};

// Admin: Manually trigger QDOGE purchase sync
export const syncQSwapTransactions = async (apiKey: string): Promise<{ success: boolean; fetched: number; inserted: number; skipped: number }> => {
  const response = await fetch(`${BACKEND_API_URL}/admin/qswap-transactions/sync`, {
    method: "POST",
    headers: {
      "X-Admin-API-Key": apiKey,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to sync QDOGE transactions: ${response.statusText}`);
  }
  return response.json();
};
