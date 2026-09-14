/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as abilities from "../abilities.js";
import type * as abilityTables from "../abilityTables.js";
import type * as auth from "../auth.js";
import type * as campaigns from "../campaigns.js";
import type * as characterTables from "../characterTables.js";
import type * as characters from "../characters.js";
import type * as commands from "../commands.js";
import type * as content from "../content.js";
import type * as contentTables from "../contentTables.js";
import type * as dice from "../dice.js";
import type * as encounterTables from "../encounterTables.js";
import type * as encounters from "../encounters.js";
import type * as events from "../events.js";
import type * as foeTables from "../foeTables.js";
import type * as history from "../history.js";
import type * as historyTables from "../historyTables.js";
import type * as foes from "../foes.js";
import type * as http from "../http.js";
import type * as initiativeTables from "../initiativeTables.js";
import type * as interactions from "../interactions.js";
import type * as lib_abilityOperations from "../lib/abilityOperations.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_audience from "../lib/audience.js";
import type * as lib_clock from "../lib/clock.js";
import type * as lib_combatOperations from "../lib/combatOperations.js";
import type * as lib_commands from "../lib/commands.js";
import type * as lib_dice from "../lib/dice.js";
import type * as lib_encounters from "../lib/encounters.js";
import type * as lib_engine from "../lib/engine.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_foeOperations from "../lib/foeOperations.js";
import type * as lib_foeSource from "../lib/foeSource.js";
import type * as lib_history from "../lib/history.js";
import type * as lib_initiative from "../lib/initiative.js";
import type * as lib_interactions from "../lib/interactions.js";
import type * as lib_journal from "../lib/journal.js";
import type * as lib_registry from "../lib/registry.js";
import type * as lib_resolve from "../lib/resolve.js";
import type * as lib_sha256 from "../lib/sha256.js";
import type * as lib_tableOperations from "../lib/tableOperations.js";
import type * as sessions from "../sessions.js";
import type * as table from "../table.js";
import type * as targets from "../targets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  abilities: typeof abilities;
  abilityTables: typeof abilityTables;
  auth: typeof auth;
  campaigns: typeof campaigns;
  characterTables: typeof characterTables;
  characters: typeof characters;
  commands: typeof commands;
  content: typeof content;
  contentTables: typeof contentTables;
  dice: typeof dice;
  encounterTables: typeof encounterTables;
  encounters: typeof encounters;
  events: typeof events;
  foeTables: typeof foeTables;
  history: typeof history;
  historyTables: typeof historyTables;
  foes: typeof foes;
  http: typeof http;
  initiativeTables: typeof initiativeTables;
  interactions: typeof interactions;
  "lib/abilityOperations": typeof lib_abilityOperations;
  "lib/access": typeof lib_access;
  "lib/audience": typeof lib_audience;
  "lib/clock": typeof lib_clock;
  "lib/combatOperations": typeof lib_combatOperations;
  "lib/commands": typeof lib_commands;
  "lib/dice": typeof lib_dice;
  "lib/encounters": typeof lib_encounters;
  "lib/engine": typeof lib_engine;
  "lib/events": typeof lib_events;
  "lib/foeOperations": typeof lib_foeOperations;
  "lib/foeSource": typeof lib_foeSource;
  "lib/history": typeof lib_history;
  "lib/initiative": typeof lib_initiative;
  "lib/interactions": typeof lib_interactions;
  "lib/journal": typeof lib_journal;
  "lib/registry": typeof lib_registry;
  "lib/resolve": typeof lib_resolve;
  "lib/sha256": typeof lib_sha256;
  "lib/tableOperations": typeof lib_tableOperations;
  sessions: typeof sessions;
  table: typeof table;
  targets: typeof targets;
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
