import { useEffect } from "react";
import { useAtom } from "jotai";
import { useSocketIO } from "./useSocketIO";
import { tradesAtom } from "@/store/trades";
import { refetchAtom } from "@/store/action";
import { qswapTransactionsAtom } from "@/store/qswapTransactions";
import { fetchTrades } from "@/services/api.service";
import { fetchQTreatzOverview, fetchQSwapTransactions, type QTreatzOverview } from "@/services/backend.service";
import { qtreatzOverviewAtom } from "@/store/qtreatzOverview";
import { BACKEND_API_URL } from "@/constants";

/**
 * Listens for real-time Socket.IO events from the backend and
 * refreshes the relevant jotai atoms so the UI stays in sync
 * without polling.
 *
 * Events handled:
 *   - trades_updated    → refetch trades
 *   - transfers_updated → trigger global refetch (assets + balances)
 *   - epoch_synced      → trigger global refetch
 *   - qtreatz_overview_updated → replace QTREATZ dashboard payload
 *   - qswap_transactions_updated → refetch Qswap QDOGE transactions
 */
export function useRealtimeUpdates() {
  const socketUrl = BACKEND_API_URL.replace("/api", "") || window.location.origin;

  const { isConnected, on } = useSocketIO({
    url: socketUrl,
    autoConnect: true,
  });

  const [, setTrades] = useAtom(tradesAtom);
  const [, setRefetch] = useAtom(refetchAtom);
  const [, setQTreatzOverview] = useAtom(qtreatzOverviewAtom);
  const [, setQSwapTransactions] = useAtom(qswapTransactionsAtom);

  useEffect(() => {
    if (!isConnected) return;

    fetchQTreatzOverview()
      .then((overview) => setQTreatzOverview(overview))
      .catch((error) => console.error("[Realtime] Failed to fetch QTREATZ overview:", error));

    const unsubTrades = on("trades_updated", async () => {
      console.log("[Realtime] trades_updated — refetching trades");
      const trades = await fetchTrades();
      setTrades(trades);
    });

    const unsubTransfers = on("transfers_updated", () => {
      console.log("[Realtime] transfers_updated — triggering refetch");
      setRefetch((prev) => !prev);
    });

    const unsubEpoch = on("epoch_synced", () => {
      console.log("[Realtime] epoch_synced — triggering refetch");
      setRefetch((prev) => !prev);
    });

    const unsubQTreatzOverview = on("qtreatz_overview_updated", (data) => {
      if (!data || typeof data !== "object") {
        return;
      }
      setQTreatzOverview(data as QTreatzOverview);
    });

    const unsubQSwapTransactions = on("qswap_transactions_updated", async () => {
      console.log("[Realtime] qswap_transactions_updated — refetching Qswap transactions");
      try {
        const transactions = await fetchQSwapTransactions(0, 100);
        setQSwapTransactions(transactions);
      } catch (error) {
        console.error("[Realtime] Failed to fetch Qswap transactions:", error);
      }
    });

    return () => {
      unsubTrades();
      unsubTransfers();
      unsubEpoch();
      unsubQTreatzOverview();
      unsubQSwapTransactions();
    };
  }, [isConnected, on, setTrades, setRefetch, setQTreatzOverview, setQSwapTransactions]);

  return { isConnected };
}
