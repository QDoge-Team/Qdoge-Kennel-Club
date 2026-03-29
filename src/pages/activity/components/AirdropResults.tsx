import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAirdropResults, fetchAirdropPreview, type AirdropResult } from "@/services/backend.service";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { cn } from "@/utils";
import * as XLSX from "xlsx";

interface AirdropResultsProps {
  epoch: number;
  searchTerm?: string;
  connectedWallet?: string | null;
  isAdmin?: boolean;
}

const MEDAL_EMOJIS = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;

const WalletCell = ({ wallet, isZealyRegistered, connectedWallet }: { wallet: string; isZealyRegistered: boolean; connectedWallet: string | null }) => {
  const isYou = connectedWallet && wallet === connectedWallet;
  return (
    <div className="flex items-center gap-1">
      {isYou ? (
        <span className="text-yellow-500 font-semibold">YOU</span>
      ) : (
        <Link to={`/entity/${wallet}`} className="text-primary hover:text-primary/70">
          {wallet.slice(0, 5)}...{wallet.slice(-5)}
        </Link>
      )}
      {isZealyRegistered && <span className="text-green-500 text-xs">✅</span>}
    </div>
  );
};

const fmt = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
};

const tableClass = "table-auto [&_td]:whitespace-nowrap [&_td]:text-center [&_th]:text-center";
const headerClass = "text-xs sticky top-0 z-20 border-b border-border/60 bg-card/90 backdrop-blur-sm [&_th]:sticky [&_th]:top-0 [&_th]:bg-card/90 [&_th]:text-card-foreground [&_th]:shadow-sm";
const bodyClass = "divide-y divide-border/40 text-muted-foreground text-xs";
const cardClass = "flex-1 min-h-0 border border-border/60 bg-card/70 p-2 shadow-inner shadow-black/5 dark:shadow-black/40";

const AirdropResults: React.FC<AirdropResultsProps> = ({ epoch, searchTerm = "", connectedWallet = null, isAdmin = false }) => {
  const [results, setResults] = useState<AirdropResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [totalAirdrop, setTotalAirdrop] = useState<string>("0");
  const [threshold, setThreshold] = useState<string>("0");

  useEffect(() => {
    const getAirdropResults = async () => {
      // Early return if not admin
      if (!isAdmin || !connectedWallet) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        try {
          const storedResults = await fetchAirdropResults(epoch, connectedWallet);
          if (storedResults.length > 0) {
            setResults(storedResults);
            setIsPreview(false);
            return;
          }
        } catch (err) {
          console.log("No stored results, fetching preview...", err);
        }

        const previewData = await fetchAirdropPreview(epoch, connectedWallet);
        setResults(previewData.results);
        setIsPreview(previewData.preview);
        setTotalAirdrop(previewData.total_airdrop);
        setThreshold(previewData.threshold || "0");
      } catch (err) {
        console.error("Failed to fetch airdrop results:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch airdrop results");
      } finally {
        setIsLoading(false);
      }
    };

    getAirdropResults();
  }, [epoch, isAdmin, connectedWallet]);

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return results;
    const term = searchTerm.toLowerCase();
    return results.filter((r) => r.wallet_id.toLowerCase().includes(term));
  }, [results, searchTerm]);

  const handleDownloadExcel = useCallback(() => {
    if (results.length === 0) return;
    const excelData = results.map((r) => ({
      rank: r.rank,
      wallet_id: r.wallet_id,
      token_amt: r.token_amount,
      buy_amt: r.buy_amount,
      trade_result: r.trade_result,
      send_transfer: r.send_transfer_amount,
      total_balance: r.total_balance,
      airdrop_amt: r.airdrop_amount,
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 8 }, { wch: 62 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Airdrop Results");
    XLSX.writeFile(workbook, `airdrop_epoch_${epoch}.xlsx`);
  }, [results, epoch]);

  // Admin-only access check
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="rounded-lg border-2 border-dashed border-border p-6 md:p-10 bg-muted/10 w-full max-w-2xl text-center">
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">Airdrop results are only available to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xl font-bold">Airdrop Results</p>
          {isPreview && (
            <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
              Live Preview
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {threshold !== "0" && (
            <div className="text-sm text-muted-foreground">
              Threshold: <span className="font-semibold text-orange-500">{fmt(Number(threshold))}</span>
            </div>
          )}
          {totalAirdrop !== "0" && (
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{fmt(Number(totalAirdrop))}</span>
            </div>
          )}
          {isAdmin && results.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
          )}
        </div>
      </div>

      {/* Weekly Airdrop Requirements */}
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">Weekly Airdrop Requirements</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Per-epoch: <strong>trade_result</strong> (buy − sell) &gt; threshold</li>
          <li>Current epoch: <strong>total_balance</strong> (buy − sell − send_transfer) &gt; threshold</li>
          <li>Previous epoch: <strong>total_balance</strong> &gt;= 0</li>
          <li>Zealy registered wallets only</li>
          <li>Top <strong>100</strong> by ranking; equal share of epoch total airdrop (remainder to rank #1)</li>
        </ul>
      </div>

      {/* Live Preview Disclaimer */}
      {isPreview && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-500">
          ⚠️ This is a live preview and does not reflect the final list. Changes may be made before the final distribution. &nbsp;✅ = Zealy Registered
        </div>
      )}

      {/* Table */}
      <div className={cardClass}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading airdrop results...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No airdrop results available</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No results match "{searchTerm}"</p>
          </div>
        ) : (
          <ScrollArea type="hover" scrollHideDelay={200} className="h-[500px]">
            <div className="pr-1">
              {searchTerm && (
                <div className="mb-2 text-xs text-muted-foreground">
                  Showing {filteredResults.length} of {results.length} results
                </div>
              )}
              <Table wrapperClassName="h-full min-h-0 !overflow-visible" className={`${tableClass} min-w-[900px]`}>
                <TableHeader className={headerClass}>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Wallet ID</TableHead>
                    <TableHead>Buy Token</TableHead>
                    <TableHead>Buy Amt</TableHead>
                    <TableHead>Trade Result</TableHead>
                    <TableHead>Send Transfer</TableHead>
                    <TableHead>Total Balance</TableHead>
                    <TableHead>Airdrop Amt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={bodyClass}>
                  {filteredResults.map((result) => {
                    const totalBal = Number(result.total_balance || "0");
                    const tradeRes = Number(result.trade_result || "0");
                    return (
                      <TableRow key={result.rank}>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {MEDAL_EMOJIS[result.rank as keyof typeof MEDAL_EMOJIS] && (
                              <span>{MEDAL_EMOJIS[result.rank as keyof typeof MEDAL_EMOJIS]}</span>
                            )}
                            <span className="font-semibold">{result.rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <WalletCell wallet={result.wallet_id} isZealyRegistered={result.is_zealy_registered} connectedWallet={connectedWallet} />
                        </TableCell>
                        <TableCell className="!text-right text-blue-500 font-medium">
                          {fmt(Number(result.token_amount))}
                        </TableCell>
                        <TableCell className="!text-right text-green-500 font-medium">
                          {fmt(Number(result.buy_amount))}
                        </TableCell>
                        <TableCell className={cn("!text-right font-medium", tradeRes > 0 ? "text-green-500" : tradeRes < 0 ? "text-red-500" : "text-muted-foreground")}>
                          {fmt(tradeRes)}
                        </TableCell>
                        <TableCell className="!text-right text-orange-500 font-medium">
                          {fmt(Number(result.send_transfer_amount || "0"))}
                        </TableCell>
                        <TableCell className={cn("!text-right font-semibold", totalBal > 0 ? "text-primary" : totalBal < 0 ? "text-red-500" : "text-muted-foreground")}>
                          {fmt(totalBal)}
                        </TableCell>
                        <TableCell className="!text-right text-primary font-semibold">
                          {fmt(Number(result.airdrop_amount))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default AirdropResults;
