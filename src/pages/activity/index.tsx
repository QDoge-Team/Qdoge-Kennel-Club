import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { tickInfoAtom } from "@/store/tickInfo";
import { AnimatePresence } from "framer-motion";
import EpochSelectionSection from "./components/EpochSelectionSection";
import ActivitySelectionSection from "./components/ActivitySelectionSection";
import DisplaySection from "./components/DisplaySection";
import { ActivityType } from "./types";
import { fetchEpochs, fetchUserInfo, type Epoch } from "@/services/backend.service";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { Button } from "@/components/ui/button";
import { Wallet, PanelLeftOpen } from "lucide-react";
import { cn } from "@/utils";
import type { EpochSelectionItem } from "./components/EpochSelectionSection";

type SelectedPeriod =
  | { kind: "epoch"; epoch: number }
  | { kind: "range"; startEpoch: number; endEpoch: number };

const getPeriodId = (p: SelectedPeriod) =>
  p.kind === "epoch" ? `e:${p.epoch}` : `r:${p.startEpoch}~${p.endEpoch}`;

const FIRST_EPOCH = 197;
const FIRST_MONTHLY_START_EPOCH = 198;

const buildEpochSelectionItems = (epochs: number[]): EpochSelectionItem[] => {
  const available = new Set(epochs);
  const maxEpoch = epochs.length > 0 ? Math.max(...epochs) : FIRST_MONTHLY_START_EPOCH + 3;

  const items: EpochSelectionItem[] = [];

  // Single epoch 197 first (start epoch is 197; monthly airdrop starts at 198).
  if (available.has(FIRST_EPOCH)) {
    items.push({ kind: "epoch", epoch: FIRST_EPOCH });
  }

  // 198, 199, 200, 201, 198~201, 202, 203, 204, 205, 202~205, ... Always show monthly range tabs
  // so "Monthly Airdrop" is visible even if backend hasn't returned all 4 epochs yet.
  for (let start = FIRST_MONTHLY_START_EPOCH; start <= maxEpoch; start += 4) {
    const block = [start, start + 1, start + 2, start + 3].filter((e) => available.has(e));
    for (const e of block) items.push({ kind: "epoch", epoch: e });
    // Always show range tab for this 4-epoch window (198~201, 202~205, ...) so user can open Monthly Airdrop.
    items.push({ kind: "range", startEpoch: start, endEpoch: start + 3 });
  }

  if (items.length === 0) {
    return [...epochs].sort((a, b) => b - a).map((e) => ({ kind: "epoch", epoch: e }));
  }
  return items;
};

const Activity: React.FC = () => {
  const { connected, toggleConnectModal, wallet } = useQubicConnect();
  const [tickInfo] = useAtom(tickInfoAtom);
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [sidebarsHidden, setSidebarsHidden] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [backendEpochs, setBackendEpochs] = useState<Epoch[]>([]);
  const [isLoadingEpochs, setIsLoadingEpochs] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadEpochs = async () => {
      try {
        setIsLoadingEpochs(true);
        const epochs = await fetchEpochs();
        setBackendEpochs(epochs);
      } catch (error) {
        console.error("Failed to fetch epochs:", error);
      } finally {
        setIsLoadingEpochs(false);
      }
    };
    loadEpochs();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const publicKey = wallet?.publicKey;
      if (!publicKey) {
        setIsAdmin(false);
        return;
      }
      try {
        const userInfo = await fetchUserInfo(publicKey);
        setIsAdmin(userInfo.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [wallet?.publicKey]);

  const currentEpoch = useMemo(() => {
    if (backendEpochs.length > 0) {
      const ongoing = backendEpochs.find(e => e.is_ongoing);
      return ongoing?.epoch_num || backendEpochs[0]?.epoch_num || 197;
    }
    return tickInfo?.epoch || 197;
  }, [backendEpochs, tickInfo]);
  
  const epochs = useMemo(() => {
    if (backendEpochs.length > 0) {
      return backendEpochs.map(e => e.epoch_num).sort((a, b) => b - a);
    }
    const epochList: number[] = [];
    for (let i = currentEpoch; i >= 197; i--) epochList.push(i);
    return epochList;
  }, [backendEpochs, currentEpoch]);

  const epochSelectionItems = useMemo(() => buildEpochSelectionItems(epochs), [epochs]);

  const selectedId = useMemo(() => (selectedPeriod ? getPeriodId(selectedPeriod) : null), [selectedPeriod]);

  const handlePeriodSelect = (item: EpochSelectionItem) => {
    const next: SelectedPeriod =
      item.kind === "epoch"
        ? { kind: "epoch", epoch: item.epoch }
        : { kind: "range", startEpoch: item.startEpoch, endEpoch: item.endEpoch };

    const nextId = getPeriodId(next);
    if (selectedId === nextId) {
      setExpandedIds(new Set());
      setSelectedPeriod(null);
      setSelectedActivity(null);
    } else {
      setExpandedIds(new Set([nextId]));
      setSelectedPeriod(next);
      setSelectedActivity(null);
    }
  };

  const handleActivitySelect = (activity: ActivityType) => {
    setSelectedActivity(activity);
    setTimeout(() => setSidebarsHidden(true), 500);
  };

  if (isLoadingEpochs) {
    return (
      <main className="relative isolate flex min-h-[calc(100vh-140px)] w-full bg-background overflow-hidden">
        <div className="flex items-center justify-center w-full h-full">
          <p className="text-muted-foreground">Loading epochs...</p>
        </div>
      </main>
    );
  }

  // Require wallet connection to view activity page
  if (!connected) {
    return (
      <main className="relative isolate flex min-h-[calc(100vh-140px)] w-full bg-background overflow-hidden">
        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
          <Wallet className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Connect Your Wallet</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Please connect your wallet to view activity data and track your trades and transfers.
          </p>
          <Button onClick={toggleConnectModal} className="mt-2">
            Connect Wallet
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate flex h-[calc(100vh-140px)] w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* Toggle button to show sidebars when hidden */}
      {sidebarsHidden && (
        <button
          onClick={() => setSidebarsHidden(false)}
          className="absolute left-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Show sidebars"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      <div
        className={cn(
          "flex flex-col md:flex-row shrink-0 overflow-hidden",
          "transition-[max-height,max-width,opacity] duration-500 ease-in-out",
          sidebarsHidden
            ? "max-h-0 md:max-h-full max-w-full md:max-w-0 opacity-0 pointer-events-none"
            : "max-h-[400px] md:max-h-full max-w-full md:max-w-[600px] opacity-100"
        )}
      >
        <EpochSelectionSection
          items={epochSelectionItems}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onSelect={handlePeriodSelect}
        />
        <AnimatePresence mode="wait">
          {selectedPeriod && (
            <ActivitySelectionSection
              key={selectedId || "activity"}
              period={selectedPeriod}
              selectedActivity={selectedActivity}
              onActivitySelect={handleActivitySelect}
              isAdmin={isAdmin}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {selectedActivity && selectedPeriod && (
          <DisplaySection
            key={`${selectedId}-${selectedActivity}`}
            period={selectedPeriod}
            activity={selectedActivity}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default Activity;
