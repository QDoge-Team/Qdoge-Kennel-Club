import { atom } from "jotai";
import type { QSwapTransaction } from "@/services/backend.service";

export const qswapTransactionsAtom = atom<QSwapTransaction[]>([]);
