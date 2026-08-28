import {cache} from "react";
import {getWatchlistSymbolsByUserId} from "@/lib/actions/watchlist.actions";

// Per-request dedupe shared by the (root) layout and the dashboard loaders.
// Kept in its own tiny module so the layout doesn't pull the whole loader graph.
export const getCachedWatchlistSymbols = cache((userId: string) => getWatchlistSymbolsByUserId(userId));
