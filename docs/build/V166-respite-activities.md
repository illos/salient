# V166: Respite activities

Rules review: required. Depends on: V165.

## Goal

Respite activities as the user settled them ([respite mode](../table-spec.md#respite-mode)): the kit
change without full-edit review (Q-CHAR-5), one activity per hero per respite, unused activities named
at completion, and Cancel reverting respite choices.

## Scope

- Source: `rule/resource/respite.md` ("You can also undertake one respite activity, such as making a
  project roll … or changing your kit"); `chapter/kits.md`, Changing Your Kit.
- `respite.change-kit` (owner, or the Director acting for them; running session; open respite; resting
  hero): changes only kit decisions (`kit.choice`, and a Tactician's second kit and arsenal values),
  requires a complete result, records a `respite-kit` revision and activates it without review, applying
  Q-CHAR-2. It is the hero's one activity.
- `respite.activity` (same actors): records any other activity by name (a project roll, a class feature
  changed as a respite activity); its effects stay manual.
- A second activity in the same respite is refused. `sessions:get` lists each resting hero's activity or
  null; Complete names heroes who used none (their options lapse).
- Cancel reverts a respite kit change by recording the earlier build again (a `restore` revision) when
  the kit change is still the effective build; live values then return as in V165.

## Acceptance checks

1. `tests/app/respite.test.ts`: kit change outside a respite refused; Mountain → Panther recorded as a
   `respite-kit` revision; a second activity refused; activity readback; Cancel restores Mountain as a
   `restore` revision; Complete keeps the change and names the hero with no activity.
2. Headless `respite`: kit change, activity readback and Cancel revert through the public API.
3. Test-support gate; Test-Deploy runs `respite` and `all`.

## Work log

- Built on `slice/V166`, `.worktrees/respite-activities`, stacked on V165. Author checks: lint,
  TypeScript, respite app tests (9).
- The table's respite display (start/end controls, participants and unused-activity notices) is a
  separate UI slice for user review; until then everything is reachable through the palette, slash
  commands and the API.
