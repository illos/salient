import type {
  AbilityCommand,
  AppliedEffect,
  Entity,
  Expression,
  GameState,
  ManualCommand,
  ParsedAbility,
  Resolution,
} from './contracts.ts';

// Rules references: rule/dice/tier-outcome, rule/combat/critical-hit,
// movement/forced-movement, rule/character/{size,stability},
// chapter/monster-basics (Using Minions), feature/fury/level-1/{ferocity,growing-ferocity}.
// This module consumes the parsed grammar, never dispatches on an ability's name.
const integer = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const nonnegative = (n: unknown): n is number => integer(n) && n >= 0;
const label = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const own = (object: object, key: string) => Object.hasOwn(object, key);
const unique = (xs: string[]) => new Set(xs).size === xs.length;
const copy = <T>(value: T): T => structuredClone(value);
const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').toLowerCase();
const characteristicKeys = ['M', 'A', 'R', 'I', 'P'] as const;
// These passive traits are either handled below or have no automatic consequence
// for this slice's ordinary strikes. Their elective actions remain table choices.
const fixtureTraits = new Set([
  'source-trait:crafty',
  'fury:ferocity',
  'fury:berserker-growing-ferocity',
  'fury:primordial-strength',
  'fury:mighty-leaps',
  'devil:silver-tongue',
  'devil:beast-legs',
  'devil:impressive-horns',
  'perk:teamwork',
]);
const outOfFight = (entity: Entity) =>
  entity.defeated ||
  (!entity.squadId &&
    (entity.kind === 'monster'
      ? entity.stamina <= 0
      : entity.stamina <= -Math.floor(entity.maxStamina / 2)));

function validateState(state: GameState): string | undefined {
  if (
    !state ||
    !state.entities ||
    !state.squads ||
    !Array.isArray(state.pending) ||
    !integer(state.round) ||
    state.round < 1 ||
    !nonnegative(state.malice)
  )
    return 'Invalid game state.';
  for (const [id, e] of Object.entries(state.entities)) {
    if (
      !e ||
      id !== e.id ||
      !label(id) ||
      !['hero', 'monster'].includes(e.kind) ||
      !['heroes', 'foes'].includes(e.side) ||
      !integer(e.stamina) ||
      !integer(e.maxStamina) ||
      e.maxStamina <= 0 ||
      e.stamina > e.maxStamina ||
      !nonnegative(e.temporaryStamina) ||
      !nonnegative(e.stability) ||
      !integer(e.size) ||
      e.size < 1 ||
      !integer(e.level) ||
      e.level < 1 ||
      !e.characteristics ||
      !characteristicKeys.every(k => integer(e.characteristics[k])) ||
      !Array.isArray(e.abilities) ||
      !Array.isArray(e.conditions) ||
      !Array.isArray(e.traits) ||
      !e.resources ||
      !Object.values(e.resources).every(nonnegative) ||
      !Array.isArray(e.meleeDamageBonus) ||
      e.meleeDamageBonus.length !== 3 ||
      !e.meleeDamageBonus.every(nonnegative)
    )
      return `Invalid entity state: ${id}.`;
    if (
      e.squadId &&
      (!own(state.squads, e.squadId) ||
        !Array.isArray(state.squads[e.squadId]?.memberIds) ||
        !state.squads[e.squadId].memberIds.includes(id))
    )
      return `Invalid squad membership: ${id}.`;
    if (
      e.sizeCategory !== undefined &&
      (e.size !== 1 || !['1T', '1S', '1M', '1L'].includes(e.sizeCategory))
    )
      return `Invalid size category: ${id}.`;
    if (
      e.fury &&
      (typeof e.fury.windedTriggered !== 'boolean' ||
        (e.fury.firstDamageRound !== undefined &&
          (!integer(e.fury.firstDamageRound) ||
            e.fury.firstDamageRound < 1 ||
            e.fury.firstDamageRound > state.round)))
    )
      return `Invalid Fury trigger state: ${id}.`;
  }
  for (const [id, s] of Object.entries(state.squads)) {
    if (
      !s ||
      s.id !== id ||
      !Array.isArray(s.memberIds) ||
      !s.memberIds.length ||
      !unique(s.memberIds) ||
      !integer(s.memberStamina) ||
      s.memberStamina <= 0 ||
      !nonnegative(s.stamina) ||
      !integer(s.maxStamina) ||
      s.maxStamina !== s.memberIds.length * s.memberStamina ||
      s.stamina > s.maxStamina ||
      s.memberIds.some(
        member =>
          !own(state.entities, member) ||
          state.entities[member].squadId !== id ||
          state.entities[member].temporaryStamina !== 0,
      )
    )
      return `Invalid squad state: ${id}.`;
    const dead = s.memberIds.filter(member => state.entities[member].defeated).length;
    if (dead !== Math.floor((s.maxStamina - s.stamina) / s.memberStamina))
      return `Squad casualties disagree with its Stamina pool: ${id}.`;
  }
  if (
    !unique(state.pending.map(p => p.id)) ||
    state.pending.some(p => !label(p.id) || !label(p.actionId))
  )
    return 'Invalid pending effect identifiers.';
}

function result(state: GameState, status: Resolution['status'], message: string): Resolution {
  return {
    status,
    state,
    effects: [],
    messages: [message],
    unresolved: status === 'rejected' ? [] : [message],
  };
}

function manualRequired(state: GameState, command: AbilityCommand, reasons: string[]): Resolution {
  const next = copy(state);
  next.pending.push({
    id: `${command.id}:manual`,
    actionId: command.id,
    kind: 'manual',
    text: reasons.join(' '),
  });
  return {
    status: 'manual-required',
    state: next,
    effects: [],
    messages: [
      'No ability costs or combat effects have been applied. Resolve the whole action manually.',
    ],
    unresolved: reasons,
  };
}

function expressionValue(expression: Expression, actor: Entity): number {
  return (
    expression.constant +
    (expression.characteristic ? actor.characteristics[expression.characteristic] : 0)
  );
}

function sizeRank(entity: Entity): number | undefined {
  if (entity.size > 1) return entity.size + 3;
  const rank = { '1T': 1, '1S': 2, '1M': 3, '1L': 4 };
  return entity.sizeCategory ? rank[entity.sizeCategory] : undefined;
}

function syncHealth(entity: Entity) {
  if (entity.squadId) return;
  // Dying heroes remain able to act; ordinary monsters are out at zero.
  entity.defeated =
    entity.kind === 'monster'
      ? entity.stamina <= 0
      : entity.stamina <= -Math.floor(entity.maxStamina / 2);
  entity.conditions = entity.conditions.filter(c => c.sourceId !== 'system:dying');
  if (entity.kind === 'hero' && entity.stamina <= 0)
    entity.conditions.push({ name: 'bleeding', sourceId: 'system:dying', duration: 'while dying' });
}

/** Pure resolution of the bounded combat grammar. Unresolved prerequisites never spend costs. */
export function resolveAbility(
  state: GameState,
  ability: ParsedAbility,
  command: AbilityCommand,
): Resolution {
  const invalid = validateState(state);
  if (invalid) return result(state, 'rejected', invalid);
  if (
    !command ||
    command.kind !== 'use-ability' ||
    !label(command.id) ||
    !label(command.actorId) ||
    !label(command.abilityId) ||
    !Array.isArray(command.targetIds) ||
    !command.targetIds.every(label) ||
    !unique(command.targetIds) ||
    !Array.isArray(command.roll) ||
    command.roll.length !== 2 ||
    !command.roll.every(d => integer(d) && d >= 1 && d <= 10) ||
    !command.facts
  )
    return result(state, 'rejected', 'Invalid ability command or d10 faces.');
  if (
    command.ferocityRoll !== undefined &&
    (!integer(command.ferocityRoll) || command.ferocityRoll < 1 || command.ferocityRoll > 3)
  )
    return result(state, 'rejected', 'Ferocity roll must be a supplied d3 face.');
  const actor = own(state.entities, command.actorId) ? state.entities[command.actorId] : undefined;
  if (!actor || outOfFight(actor))
    return result(state, 'rejected', 'Actor is missing or defeated.');
  if (
    !ability?.source ||
    ability.source.id !== command.abilityId ||
    !actor.abilities.includes(command.abilityId)
  )
    return result(state, 'rejected', 'Actor does not own this ability.');
  if (
    !command.targetIds.length ||
    command.targetIds.some(id => !own(state.entities, id) || outOfFight(state.entities[id]))
  )
    return result(state, 'rejected', 'Choose existing, undefeated targets.');
  if (state.pending.length)
    return result(
      state,
      'needs-input',
      'Complete pending table instructions before resolving another ability.',
    );
  const facts = command.facts;
  for (const n of [facts.edges, facts.banes, facts.furyFerocityPeak])
    if (n !== undefined && !nonnegative(n))
      return result(
        state,
        'rejected',
        'Roll modifiers and Ferocity peak must be nonnegative integers.',
      );
  if (facts.distances && Object.values(facts.distances).some(n => !nonnegative(n)))
    return result(state, 'rejected', 'Distances must be nonnegative integer squares.');
  if (facts.targetsConfirmed !== true)
    return result(
      state,
      'needs-input',
      'The table must confirm target eligibility, line of effect, and action prerequisites.',
    );
  if (facts.edges === undefined || facts.banes === undefined)
    return result(state, 'needs-input', 'Supply edges and banes explicitly.');
  if (facts.edges || facts.banes)
    return manualRequired(state, command, [
      'Edges and banes are outside this unmodified-roll slice.',
    ]);
  if (ability.diagnostics.length) return manualRequired(state, command, ability.diagnostics);
  if (plain(ability.source.usage) !== 'main action')
    return manualRequired(state, command, [
      'Only explicitly table-approved main actions are automated; other action types and trigger timing require manual resolution.',
    ]);
  if (
    !ability.roll ||
    !integer(ability.roll.constant) ||
    (ability.roll.characteristic && !characteristicKeys.includes(ability.roll.characteristic))
  )
    return manualRequired(state, command, ['Unsupported or missing power-roll expression.']);
  const targetText = plain(ability.source.target);
  const area = ability.source.keywords.some(k => plain(k) === 'area');
  if (!area && command.targetIds.length !== 1)
    return result(state, 'rejected', 'This slice supports one target for non-area abilities.');
  if (
    targetText.includes('enemy') &&
    command.targetIds.some(id => state.entities[id].side === actor.side)
  )
    return result(state, 'rejected', 'This ability targets enemies.');
  if (
    targetText.includes('ally') &&
    command.targetIds.some(id => state.entities[id].side !== actor.side)
  )
    return result(state, 'rejected', 'This ability targets allies.');
  if (
    !/^one creature(?: or object)?(?: per minion)?$/.test(targetText) &&
    !(area && /^each (?:enemy|creature) in the area$/.test(targetText))
  )
    return manualRequired(state, command, ['Unsupported target pattern.']);
  const reach = plain(ability.source.distance).match(/^melee (\d+)$/);
  if (
    reach &&
    command.targetIds.some(
      id => facts.distances?.[id] !== undefined && facts.distances[id] > Number(reach[1]),
    )
  )
    return result(state, 'rejected', 'A target is beyond the ability’s melee distance.');
  if (actor.conditions.length || command.targetIds.some(id => state.entities[id].conditions.length))
    return manualRequired(state, command, [
      'Active conditions require manual resolution in this slice, including their roll, damage, or action consequences.',
    ]);
  if (
    [actor, ...command.targetIds.map(id => state.entities[id])].some(e =>
      e.traits.some(t => !fixtureTraits.has(t)),
    )
  )
    return manualRequired(state, command, [
      'An unimplemented passive trait may affect this action; resolve it manually.',
    ]);
  if (actor.traits.includes('fury:berserker-growing-ferocity')) {
    if (facts.furyFerocityPeak === undefined)
      return result(
        state,
        'needs-input',
        'Supply the highest Ferocity held on this turn; Growing Ferocity benefits persist through spending.',
      );
    if (facts.furyFerocityPeak < (actor.resources.ferocity ?? 0))
      return result(state, 'rejected', 'Turn Ferocity peak cannot be lower than current Ferocity.');
  }
  const natural = command.roll[0] + command.roll[1];
  if (natural >= 19)
    return manualRequired(state, command, [
      'A natural 19 or 20 can grant an additional main action; critical-hit handling requires manual resolution.',
    ]);
  const total = natural + expressionValue(ability.roll, actor);
  const tier = total <= 11 ? 0 : total <= 16 ? 1 : 2;
  const definitions = ability.tiers[tier];
  if (!Array.isArray(definitions) || !definitions.length)
    return manualRequired(state, command, ['No executable effects for the selected tier.']);
  if (
    definitions.filter(e => e.kind === 'damage').length > 1 ||
    definitions.filter(e => e.kind === 'push').length > 1
  )
    return manualRequired(state, command, [
      'Multiple damage components or repeated pushes require manual resolution in this slice.',
    ]);
  const hasPush = definitions.some(e => e.kind === 'push');
  if (
    hasPush &&
    actor.traits.includes('fury:berserker-growing-ferocity') &&
    facts.furyFerocityPeak! >= 4
  )
    return manualRequired(state, command, [
      'Berserker Growing Ferocity can grant a first-push surge on this turn. Resolve the action and that trigger manually.',
    ]);
  const keywords = ability.source.keywords.map(plain);
  const meleeWeapon = keywords.includes('melee') && keywords.includes('weapon');
  const kitBonus =
    meleeWeapon && !ability.source.kitBonusesIncluded ? actor.meleeDamageBonus[tier] : 0;
  let squadBonus = 0;
  if (actor.squadId) {
    const attackers = facts.squadAttackers;
    if (!attackers)
      return result(
        state,
        'needs-input',
        'Supply participating squad minions; this is one shared squad roll.',
      );
    if (
      !Array.isArray(attackers) ||
      !unique(attackers) ||
      attackers.length < 1 ||
      attackers.length > 3 ||
      !attackers.includes(actor.id) ||
      attackers.some(
        id =>
          !own(state.entities, id) ||
          state.entities[id].squadId !== actor.squadId ||
          state.entities[id].defeated ||
          state.entities[id].definitionId !== actor.definitionId ||
          !state.entities[id].abilities.includes(command.abilityId) ||
          !nonnegative(state.entities[id].freeStrikeDamage),
      )
    )
      return result(
        state,
        'rejected',
        'Supply one to three living matching squad attackers, including the actor.',
      );
    if (attackers.some(id => state.entities[id].conditions.length))
      return manualRequired(state, command, [
        'A participating minion has an unresolved condition.',
      ]);
    if (command.targetIds.length !== 1 || !targetText.endsWith('per minion'))
      return manualRequired(state, command, [
        'Only a squad signature attack against one target is supported.',
      ]);
    squadBonus = attackers
      .filter(id => id !== actor.id)
      .reduce((sum, id) => sum + state.entities[id].freeStrikeDamage!, 0);
  } else if (facts.squadAttackers !== undefined)
    return result(state, 'rejected', 'Only squad actors can supply squad attackers.');
  if (ability.cost && (!nonnegative(ability.cost.amount) || !label(ability.cost.resource)))
    return result(state, 'rejected', 'Invalid parsed resource cost.');
  if (ability.cost) {
    const resource = ability.cost.resource.toLowerCase();
    const balance = resource === 'malice' ? state.malice : actor.resources[resource];
    if (!nonnegative(balance) || balance < ability.cost.amount)
      return result(state, 'rejected', 'Insufficient ability resource.');
  }
  // Simulate on an isolated copy. Any later rejection discards the entire candidate,
  // so a missing d3/casualty choice cannot leave damage or resource costs behind.
  const next = copy(state);
  const effects: AppliedEffect[] = [];
  const unresolved: string[] = [];
  if (ability.cost) {
    const resource = ability.cost.resource.toLowerCase();
    const before =
      resource === 'malice' ? next.malice : next.entities[actor.id].resources[resource];
    if (resource === 'malice') next.malice -= ability.cost.amount;
    else next.entities[actor.id].resources[resource] -= ability.cost.amount;
    effects.push({
      kind: 'resource',
      targetId: actor.id,
      before,
      after: before - ability.cost.amount,
      text: `Spent ${ability.cost.amount} ${resource}.`,
    });
  }
  // Rolled damage reaches every target before any tier effect (Ability Roll).
  const steps = [true, false].flatMap(damageFirst =>
    command.targetIds.flatMap(targetId =>
      definitions.flatMap((definition, effectIndex) =>
        (definition.kind === 'damage') === damageFirst
          ? [{ targetId, definition, effectIndex }]
          : [],
      ),
    ),
  );
  for (const { targetId, definition, effectIndex } of steps) {
    const target = next.entities[targetId];
    if (definition.kind === 'damage') {
      if (
        !integer(definition.amount.constant) ||
        (definition.amount.characteristic &&
          !characteristicKeys.includes(definition.amount.characteristic))
      )
        return result(state, 'rejected', 'Invalid damage expression.');
      const amount = expressionValue(definition.amount, actor) + kitBonus + squadBonus;
      if (!nonnegative(amount))
        return result(state, 'rejected', 'Damage must be a nonnegative integer.');
      if (target.squadId) {
        if (
          area ||
          command.targetIds.length > 1 ||
          definitions.filter(e => e.kind === 'damage').length > 1
        )
          return manualRequired(state, command, [
            'Area/multiple-instance damage against minion pools requires manual resolution.',
          ]);
        const squad = next.squads[target.squadId];
        const before = squad.stamina;
        const after = Math.max(0, before - amount);
        const count =
          Math.ceil(before / squad.memberStamina) - Math.ceil(after / squad.memberStamina);
        const order = facts.casualtyOrder;
        if (count > 1 && !order)
          return result(
            state,
            'needs-input',
            'Supply casualtyOrder: damaged minion first, then nearest living squad members.',
          );
        const casualties = count === 0 ? [] : (order ?? [targetId]);
        if (
          casualties.length !== count ||
          !unique(casualties) ||
          (count && casualties[0] !== targetId) ||
          casualties.some(id => !squad.memberIds.includes(id) || next.entities[id].defeated)
        )
          return result(
            state,
            'rejected',
            'Casualty order must contain exactly the defeated minions, damaged target first, then nearest living members.',
          );
        squad.stamina = after;
        for (const id of casualties) {
          next.entities[id].defeated = true;
          effects.push({
            kind: 'defeated',
            targetId: id,
            text: `${next.entities[id].name} is defeated from squad damage.`,
          });
        }
        effects.push({
          kind: 'squad-damage',
          targetId: target.squadId,
          before,
          after,
          text: `${amount} damage to the shared squad pool; ${count} casualties.`,
        });
      } else {
        const absorbed = Math.min(target.temporaryStamina, amount);
        if (absorbed) {
          const before = target.temporaryStamina;
          target.temporaryStamina -= absorbed;
          effects.push({
            kind: 'temporary-stamina',
            targetId,
            before,
            after: target.temporaryStamina,
            text: `Temporary Stamina absorbs ${absorbed} damage.`,
          });
        }
        const before = target.stamina;
        target.stamina =
          target.kind === 'monster'
            ? Math.max(0, before - amount + absorbed)
            : before - amount + absorbed;
        effects.push({
          kind: 'damage',
          targetId,
          before,
          after: target.stamina,
          text: `${amount} ${definition.damageType ?? ''} damage (${amount - absorbed} to Stamina).`.replace(
            '  ',
            ' ',
          ),
        });
        if (amount > 0 && target.traits.includes('fury:ferocity')) {
          if (!target.fury)
            return result(state, 'rejected', 'Fury trigger bookkeeping is missing.');
          const resourceBefore = target.resources.ferocity ?? 0;
          if (target.fury.firstDamageRound !== state.round) {
            target.resources.ferocity = resourceBefore + 1;
            target.fury.firstDamageRound = state.round;
          }
          if (
            !target.fury.windedTriggered &&
            before > Math.floor(target.maxStamina / 2) &&
            target.stamina <= Math.floor(target.maxStamina / 2)
          ) {
            if (command.ferocityRoll === undefined)
              return result(
                state,
                'needs-input',
                'First becoming winded/dying requires a supplied ferocityRoll (d3); nothing has been applied.',
              );
            target.resources.ferocity = (target.resources.ferocity ?? 0) + command.ferocityRoll;
            target.fury.windedTriggered = true;
          }
          if (resourceBefore !== target.resources.ferocity)
            effects.push({
              kind: 'resource',
              targetId,
              before: resourceBefore,
              after: target.resources.ferocity,
              text: 'Ferocity gained from taking damage / first becoming winded.',
            });
        }
        syncHealth(target);
      }
    } else if (definition.kind === 'condition') {
      if (
        !characteristicKeys.includes(definition.characteristic) ||
        !integer(definition.threshold) ||
        !label(definition.condition) ||
        !label(definition.duration)
      )
        return result(state, 'rejected', 'Invalid potency/condition definition.');
      if (
        target.characteristics[definition.characteristic] < definition.threshold &&
        !target.defeated
      ) {
        target.conditions.push({
          name: definition.condition,
          sourceId: command.id,
          duration: definition.duration,
        });
        effects.push({
          kind: 'condition',
          targetId,
          text: `${definition.condition} (${definition.duration}); ${definition.characteristic} ${target.characteristics[definition.characteristic]} < ${definition.threshold}.`,
        });
      }
    } else if (definition.kind === 'push') {
      if (!nonnegative(definition.distance))
        return result(state, 'rejected', 'Invalid push distance.');
      const actorRank = sizeRank(actor),
        targetRank = sizeRank(target);
      if (meleeWeapon && (actorRank === undefined || targetRank === undefined))
        return result(
          state,
          'needs-input',
          'Melee Weapon forced movement needs both size categories (including 1T/1S/1M/1L).',
        );
      const maxDistance = definition.distance + (meleeWeapon && actorRank! > targetRank! ? 1 : 0);
      const movement = facts.movement?.[targetId];
      if (
        movement &&
        (!nonnegative(movement.distance) ||
          !nonnegative(movement.stabilityReduction) ||
          movement.stabilityReduction > target.stability ||
          movement.distance > Math.max(0, maxDistance - movement.stabilityReduction) ||
          typeof movement.collision !== 'boolean')
      )
        return result(
          state,
          'rejected',
          'Invalid movement distance or chosen stability reduction.',
        );
      if (movement?.collision)
        return manualRequired(state, command, [
          'Collision damage, Primordial Strength, and downstream movement triggers require manual resolution of the whole action.',
        ]);
      if (movement && (movement.distance === 0 || movement.effectsConfirmed === true)) {
        effects.push({
          kind: 'push',
          targetId,
          text: `${actor.name} pushes ${target.name} ${movement.distance} squares; table confirms the path and no additional movement effects.`,
        });
      } else {
        const text = `${actor.name} can push ${target.name} up to ${maxDistance} squares. Target may reduce movement by up to ${target.stability} stability. Table must choose distance/path and resolve collisions, falling, terrain, and movement triggers; these have not been applied.`;
        next.pending.push({
          id: `${command.id}:movement:${targetId}:${effectIndex}`,
          actionId: command.id,
          targetId,
          kind: 'movement',
          text,
          maxDistance,
        });
        unresolved.push(text);
      }
    } else return manualRequired(state, command, ['Unsupported parsed effect.']);
  }
  const invalidResult = validateState(next);
  if (invalidResult) return result(state, 'rejected', invalidResult);
  return {
    status: unresolved.length ? 'needs-input' : 'resolved',
    state: next,
    effects,
    messages: [
      `Power roll ${natural} + ${expressionValue(ability.roll, actor)} = ${total}: tier ${tier + 1}.`,
      'Turn timing, optional reactions, and action availability are adjudicated by the table.',
    ],
    unresolved,
  };
}

/** Explicit corrections/manual completion; values are supplied, never reinterpreted as ability use. */
export function applyManual(state: GameState, command: ManualCommand): Resolution {
  const invalid = validateState(state);
  if (invalid) return result(state, 'rejected', invalid);
  if (
    !command ||
    command.kind !== 'manual' ||
    !label(command.id) ||
    !label(command.reason) ||
    !Array.isArray(command.changes) ||
    (command.completePendingIds !== undefined &&
      (!Array.isArray(command.completePendingIds) ||
        !command.completePendingIds.every(label) ||
        !unique(command.completePendingIds)))
  )
    return result(
      state,
      'rejected',
      'Manual changes require an ID, reason, changes, and valid pending IDs.',
    );
  const completed = command.completePendingIds ?? [];
  if (completed.some(id => !state.pending.some(p => p.id === id)))
    return result(
      state,
      'rejected',
      'Cannot complete a nonexistent/already completed pending instruction.',
    );
  if (!command.changes.length && !completed.length)
    return result(state, 'rejected', 'Manual command has no changes or pending completion.');
  for (const change of command.changes) {
    if (
      change?.kind === 'stamina' &&
      own(state.entities, change.entityId) &&
      state.entities[change.entityId].traits.includes('fury:ferocity') &&
      !command.changes.some(c => c?.kind === 'fury-triggers' && c.entityId === change.entityId)
    )
      return result(
        state,
        'rejected',
        'Manual Fury Stamina changes must include explicit fury-triggers bookkeeping in the same command, plus any associated resource changes.',
      );
  }
  const next = copy(state);
  const effects: AppliedEffect[] = [];
  for (const change of command.changes) {
    if (!change || typeof change !== 'object')
      return result(state, 'rejected', 'Invalid manual change.');
    if (
      ['stamina', 'resource', 'condition-add', 'condition-remove', 'fury-triggers'].includes(
        change.kind,
      ) &&
      (!('entityId' in change) || !label(change.entityId) || !own(next.entities, change.entityId))
    )
      return result(state, 'rejected', 'A valid entityId is required for this manual change.');
    const entity =
      'entityId' in change && own(next.entities, change.entityId)
        ? next.entities[change.entityId]
        : undefined;
    if ('entityId' in change && !entity)
      return result(state, 'rejected', 'Unknown entity for manual change.');
    switch (change.kind) {
      case 'stamina': {
        if (
          !integer(change.value) ||
          change.value > entity!.maxStamina ||
          (entity!.kind === 'monster' && change.value < 0) ||
          entity!.squadId
        )
          return result(state, 'rejected', 'Invalid Stamina value; use squad-stamina for minions.');
        const before = entity!.stamina;
        entity!.stamina = change.value;
        syncHealth(entity!);
        effects.push({
          kind: 'manual-stamina',
          targetId: entity!.id,
          before,
          after: change.value,
          text: command.reason,
        });
        break;
      }
      case 'resource': {
        if (
          !nonnegative(change.value) ||
          !label(change.resource) ||
          ['__proto__', 'constructor', 'prototype'].includes(change.resource)
        )
          return result(state, 'rejected', 'Invalid manual resource.');
        const before = entity!.resources[change.resource] ?? 0;
        entity!.resources[change.resource] = change.value;
        effects.push({
          kind: 'manual-resource',
          targetId: entity!.id,
          before,
          after: change.value,
          text: `${change.resource}: ${command.reason}`,
        });
        break;
      }
      case 'condition-add': {
        if (!label(change.condition) || !label(change.duration))
          return result(state, 'rejected', 'Condition name and duration are required.');
        entity!.conditions.push({
          name: change.condition,
          sourceId: command.id,
          duration: change.duration,
        });
        effects.push({
          kind: 'manual-condition',
          targetId: entity!.id,
          text: `Added ${change.condition}: ${command.reason}`,
        });
        break;
      }
      case 'condition-remove': {
        if (!label(change.condition))
          return result(state, 'rejected', 'Condition name is required.');
        if (
          entity!.conditions.some(c => c.name === change.condition && c.sourceId === 'system:dying')
        )
          return result(
            state,
            'rejected',
            'Dying bleeding cannot be removed while the hero is dying.',
          );
        entity!.conditions = entity!.conditions.filter(c => c.name !== change.condition);
        effects.push({
          kind: 'manual-condition',
          targetId: entity!.id,
          text: `Removed ${change.condition}: ${command.reason}`,
        });
        break;
      }
      case 'fury-triggers': {
        if (
          !entity!.traits.includes('fury:ferocity') ||
          typeof change.windedTriggered !== 'boolean' ||
          (change.firstDamageRound !== undefined &&
            (!integer(change.firstDamageRound) || change.firstDamageRound < 1))
        )
          return result(
            state,
            'rejected',
            'Fury trigger bookkeeping requires a Fury, a boolean winded flag, and an optional positive damage round.',
          );
        entity!.fury = {
          windedTriggered: change.windedTriggered,
          ...(change.firstDamageRound !== undefined
            ? { firstDamageRound: change.firstDamageRound }
            : {}),
        };
        effects.push({
          kind: 'manual-fury-triggers',
          targetId: entity!.id,
          text: `${command.reason}: first damage round ${change.firstDamageRound ?? 'none'}, winded trigger ${change.windedTriggered}.`,
        });
        break;
      }
      case 'squad-stamina': {
        const squad = own(next.squads, change.squadId) ? next.squads[change.squadId] : undefined;
        if (
          !squad ||
          !nonnegative(change.value) ||
          change.value > squad.maxStamina ||
          !Array.isArray(change.defeatedIds) ||
          !unique(change.defeatedIds) ||
          change.defeatedIds.some(id => !squad.memberIds.includes(id)) ||
          change.defeatedIds.length !==
            Math.floor((squad.maxStamina - change.value) / squad.memberStamina)
        )
          return result(
            state,
            'rejected',
            'Supply a valid squad pool and its complete, consistent casualty list.',
          );
        const before = squad.stamina;
        squad.stamina = change.value;
        for (const id of squad.memberIds)
          next.entities[id].defeated = change.defeatedIds.includes(id);
        effects.push({
          kind: 'manual-squad-stamina',
          targetId: squad.id,
          before,
          after: change.value,
          text: command.reason,
        });
        break;
      }
      case 'round': {
        if (!integer(change.value) || change.value < 1)
          return result(state, 'rejected', 'Round must be a positive integer.');
        const before = next.round;
        next.round = change.value;
        effects.push({
          kind: 'manual-round',
          before,
          after: change.value,
          text: `${command.reason}; start/end-turn resource gains and effects must be supplied separately.`,
        });
        break;
      }
      case 'malice': {
        if (!nonnegative(change.value))
          return result(state, 'rejected', 'Malice must be a nonnegative integer.');
        const before = next.malice;
        next.malice = change.value;
        effects.push({ kind: 'manual-malice', before, after: change.value, text: command.reason });
        break;
      }
      default:
        return result(state, 'rejected', 'Unsupported manual change kind.');
    }
  }
  next.pending = next.pending.filter(p => !completed.includes(p.id));
  for (const id of completed)
    effects.push({ kind: 'manual-completion', text: `${id}: ${command.reason}` });
  const invalidResult = validateState(next);
  if (invalidResult) return result(state, 'rejected', invalidResult);
  return {
    status: 'resolved',
    state: next,
    effects,
    messages: [
      'Manual values recorded. Any associated rules triggers/resources must be included explicitly by the table.',
    ],
    unresolved: next.pending.map(p => p.text),
  };
}
