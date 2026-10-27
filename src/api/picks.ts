// every call to the Picks python service goes through this file — same house
// rule as the main app, where rawg.ts owns RAWG and supabase.ts owns the
// client. today that's one endpoint.

import { supabase } from "./supabase";
import type { CoversResponse, ExamplesResponse, PicksResponse, StatsResponse } from "../lib/types";

const BASE = import.meta.env.VITE_PICKS_API_URL;

export async function fetchRecommendations(): Promise<PicksResponse> {
  // ask supabase for the session here rather than taking the token as an
  // argument. supabase refreshes tokens quietly in the background, so
  // anything held in react state can be stale by the time it's used — and a
  // stale token comes back as a 401 that looks like a login bug.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Not logged in.");
  }

  const response = await fetch(`${BASE}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    // fastapi puts its message in `detail`, and mine are written to be
    // readable ("RAWG rejected the API key — check RAWG_KEY in .env").
    // fall back to the status line when the body isn't json at all, which
    // is what a dead service or a proxy error looks like.
    let message = `${response.status} ${response.statusText}`;

    try {
      const body = await response.json();
      if (body?.detail) message = body.detail;
    } catch {
      // not json — keep the status line
    }

    throw new Error(message);
  }

  return response.json();
}

// public, no token: the welcome page's background art. failure is cosmetic,
// so callers just get an empty list.
export async function fetchCovers(): Promise<string[]> {
  try {
    const response = await fetch(`${BASE}/covers`);
    if (!response.ok) return [];
    const body: CoversResponse = await response.json();
    return body.covers;
  } catch {
    return [];
  }
}

// public, no token. null on failure so the welcome page can just leave the band out.
export async function fetchStats(): Promise<StatsResponse | null> {
  try {
    const response = await fetch(`${BASE}/stats`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// public, no token: slug -> cover for the how-it-works examples. empty on failure,
// and the rows just show without pictures.
export async function fetchExamples(): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${BASE}/examples`);
    if (!response.ok) return {};
    const body: ExamplesResponse = await response.json();
    return body.covers;
  } catch {
    return {};
  }
}