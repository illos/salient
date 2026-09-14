/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as campaigns from "../campaigns.js";
import type * as characterTables from "../characterTables.js";
import type * as characters from "../characters.js";
import type * as dice from "../dice.js";
import type * as encounterTables from "../encounterTables.js";
import type * as events from "../events.js";
import type * as foeTables from "../foeTables.js";
import type * as foes from "../foes.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_commands from "../lib/commands.js";
import type * as lib_dice from "../lib/dice.js";
import type * as lib_encounters from "../lib/encounters.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_journal from "../lib/journal.js";
import type * as lib_sha256 from "../lib/sha256.js";
import type * as sessions from "../sessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  campaigns: typeof campaigns;
  characterTables: typeof characterTables;
  characters: typeof characters;
  dice: typeof dice;
  encounterTables: typeof encounterTables;
  events: typeof events;
  foeTables: typeof foeTables;
  foes: typeof foes;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/commands": typeof lib_commands;
  "lib/dice": typeof lib_dice;
  "lib/encounters": typeof lib_encounters;
  "lib/events": typeof lib_events;
  "lib/journal": typeof lib_journal;
  "lib/sha256": typeof lib_sha256;
  sessions: typeof sessions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
