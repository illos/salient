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
import type * as account from "../account.js";
import type * as accountEmail from "../accountEmail.js";
import type * as auth from "../auth.js";
import type * as campaigns from "../campaigns.js";
import type * as characterRewards from "../characterRewards.js";
import type * as characterRunes from "../characterRunes.js";
import type * as characterSecrets from "../characterSecrets.js";
import type * as characterTables from "../characterTables.js";
import type * as characterWizard from "../characterWizard.js";
import type * as characters from "../characters.js";
import type * as chat from "../chat.js";
import type * as closeout from "../closeout.js";
import type * as commands from "../commands.js";
import type * as content from "../content.js";
import type * as contentTables from "../contentTables.js";
import type * as dice from "../dice.js";
import type * as encounterTables from "../encounterTables.js";
import type * as encounters from "../encounters.js";
import type * as events from "../events.js";
import type * as foeTables from "../foeTables.js";
import type * as foes from "../foes.js";
import type * as history from "../history.js";
import type * as historyTables from "../historyTables.js";
import type * as http from "../http.js";
import type * as initiativeTables from "../initiativeTables.js";
import type * as interactions from "../interactions.js";
import type * as lib_abilityOperations from "../lib/abilityOperations.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_accountDeletion from "../lib/accountDeletion.js";
import type * as lib_accountEmail from "../lib/accountEmail.js";
import type * as lib_actors from "../lib/actors.js";
import type * as lib_audience from "../lib/audience.js";
import type * as lib_characterBuild from "../lib/characterBuild.js";
import type * as lib_characterChoiceOrigins from "../lib/characterChoiceOrigins.js";
import type * as lib_characterDirectorSetup from "../lib/characterDirectorSetup.js";
import type * as lib_characterOperations from "../lib/characterOperations.js";
import type * as lib_characterProgression from "../lib/characterProgression.js";
import type * as lib_clock from "../lib/clock.js";
import type * as lib_closeoutOperations from "../lib/closeoutOperations.js";
import type * as lib_combatOperations from "../lib/combatOperations.js";
import type * as lib_commands from "../lib/commands.js";
import type * as lib_compiledResults from "../lib/compiledResults.js";
import type * as lib_compiledSource from "../lib/compiledSource.js";
import type * as lib_dice from "../lib/dice.js";
import type * as lib_encounters from "../lib/encounters.js";
import type * as lib_engine from "../lib/engine.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_foeNames from "../lib/foeNames.js";
import type * as lib_foeOperations from "../lib/foeOperations.js";
import type * as lib_foeSource from "../lib/foeSource.js";
import type * as lib_history from "../lib/history.js";
import type * as lib_historyIndex from "../lib/historyIndex.js";
import type * as lib_historyModel from "../lib/historyModel.js";
import type * as lib_historyRead from "../lib/historyRead.js";
import type * as lib_initiative from "../lib/initiative.js";
import type * as lib_interactions from "../lib/interactions.js";
import type * as lib_journal from "../lib/journal.js";
import type * as lib_registry from "../lib/registry.js";
import type * as lib_resolve from "../lib/resolve.js";
import type * as lib_runeOperations from "../lib/runeOperations.js";
import type * as lib_sha256 from "../lib/sha256.js";
import type * as lib_squadOperations from "../lib/squadOperations.js";
import type * as lib_squads from "../lib/squads.js";
import type * as lib_startingRewards from "../lib/startingRewards.js";
import type * as lib_tableOperations from "../lib/tableOperations.js";
import type * as presence from "../presence.js";
import type * as sessions from "../sessions.js";
import type * as startingRewardValidators from "../startingRewardValidators.js";
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
  account: typeof account;
  accountEmail: typeof accountEmail;
  auth: typeof auth;
  campaigns: typeof campaigns;
  characterRewards: typeof characterRewards;
  characterRunes: typeof characterRunes;
  characterSecrets: typeof characterSecrets;
  characterTables: typeof characterTables;
  characterWizard: typeof characterWizard;
  characters: typeof characters;
  chat: typeof chat;
  closeout: typeof closeout;
  commands: typeof commands;
  content: typeof content;
  contentTables: typeof contentTables;
  dice: typeof dice;
  encounterTables: typeof encounterTables;
  encounters: typeof encounters;
  events: typeof events;
  foeTables: typeof foeTables;
  foes: typeof foes;
  history: typeof history;
  historyTables: typeof historyTables;
  http: typeof http;
  initiativeTables: typeof initiativeTables;
  interactions: typeof interactions;
  "lib/abilityOperations": typeof lib_abilityOperations;
  "lib/access": typeof lib_access;
  "lib/accountDeletion": typeof lib_accountDeletion;
  "lib/accountEmail": typeof lib_accountEmail;
  "lib/actors": typeof lib_actors;
  "lib/audience": typeof lib_audience;
  "lib/characterBuild": typeof lib_characterBuild;
  "lib/characterChoiceOrigins": typeof lib_characterChoiceOrigins;
  "lib/characterDirectorSetup": typeof lib_characterDirectorSetup;
  "lib/characterOperations": typeof lib_characterOperations;
  "lib/characterProgression": typeof lib_characterProgression;
  "lib/clock": typeof lib_clock;
  "lib/closeoutOperations": typeof lib_closeoutOperations;
  "lib/combatOperations": typeof lib_combatOperations;
  "lib/commands": typeof lib_commands;
  "lib/compiledResults": typeof lib_compiledResults;
  "lib/compiledSource": typeof lib_compiledSource;
  "lib/dice": typeof lib_dice;
  "lib/encounters": typeof lib_encounters;
  "lib/engine": typeof lib_engine;
  "lib/events": typeof lib_events;
  "lib/foeNames": typeof lib_foeNames;
  "lib/foeOperations": typeof lib_foeOperations;
  "lib/foeSource": typeof lib_foeSource;
  "lib/history": typeof lib_history;
  "lib/historyIndex": typeof lib_historyIndex;
  "lib/historyModel": typeof lib_historyModel;
  "lib/historyRead": typeof lib_historyRead;
  "lib/initiative": typeof lib_initiative;
  "lib/interactions": typeof lib_interactions;
  "lib/journal": typeof lib_journal;
  "lib/registry": typeof lib_registry;
  "lib/resolve": typeof lib_resolve;
  "lib/runeOperations": typeof lib_runeOperations;
  "lib/sha256": typeof lib_sha256;
  "lib/squadOperations": typeof lib_squadOperations;
  "lib/squads": typeof lib_squads;
  "lib/startingRewards": typeof lib_startingRewards;
  "lib/tableOperations": typeof lib_tableOperations;
  presence: typeof presence;
  sessions: typeof sessions;
  startingRewardValidators: typeof startingRewardValidators;
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
