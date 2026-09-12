# A grammar for table commands

## Accepted syntax baseline

Use a small, schema-driven command language with an optional acting-character prefix, a slash-prefixed
command path, and named arguments. Keep authenticated user attribution outside executable text. Use
structured JSON requests for agents and other programmatic callers, and action-card responses for choices
that become available after an operation starts. The user accepted the human syntax baseline and common
command examples on **2026-09-12**. The formal grammar below documents that design. Detailed per-operation
schemas, additional catalog spellings and the machine API remain recommendations, not frozen interfaces.
No parser or command system is claimed implemented.

```text
@Thorn /ability use ability="Brutal Slam" targets=[@Goblin5]
@Elwin /ability use ability="Healing Grace" targets=[@self]
@Thorn /test roll characteristic=might skill=climb
/test request characteristic=might actors=[@Thorn]
```

The acting-character prefix preserves the table's established actor-selection model. The command path
identifies the operation; the named arguments explain the role of each value. Ability labels are data,
not new grammar. Healing Grace and Brutal Slam are examples of core abilities; whether a particular hero
has one and whether a selected target is eligible remain semantic checks, not parser assumptions.

This design does not adopt a shell, Minecraft's syntax, Discord's limits or a particular parser package.
It borrows established structures and defines a bounded language suited to the table's requirements.

### Short commands and guided action cards

Complex syntax is an optional complete representation, not a typing requirement. A short registered
command such as `/ability use` can open an action card whose GUI collects actor, ability, targets and
options. Supplying some arguments prefills those fields; fully specified invocations can use the same
operation directly. The confirmed guided-entry direction is part of the
[table command specification](../table-command-spec.md#results-and-pending-interactions).

Recommended preparation behavior: merely opening the card performs no roll, resource spending or effect
application. Submit the initial choices explicitly to start the action. Later cards continue the same
action where new choices become available. An agent can request the same schema and supply answers
without rendering the GUI. Optional choices must remain discoverable, so guided mode cannot be limited
to error recovery for missing required fields. The precise explicit guided-launch option is still open;
it requires a registry operation or documented input mode, not another punctuation language.

## Requirements exposed by the rules inventory

The [rules inventory](table-command-rules-inventory.md) and
[targeting cases](table-command-targeting-cases.md) identify the requirements that should drive syntax.
These reports cite the pinned core rules; the table below states design implications rather than new rules.

| Requirement | Language consequence |
| --- | --- |
| Tests, saves, initiative and ability rolls have different procedures | Explicit operation names; do not infer behavior from dice notation alone. |
| One player can control multiple heroes; the Director can act for heroes | Acting entity and authenticated issuer are separate. |
| One ability can affect multiple creatures and objects | Lists of typed references, with target eligibility checked by the operation. |
| Primary victim, ally beneficiary, damage recipient and resource payer can differ | Named fields or structured target roles rather than a single overloaded suffix. |
| A shared roll can produce per-target tiers/effects | Per-target records tied to a shared roll; no new roll implied by each target entry. |
| Movement can generate targets or be interrupted | Paths/geometry or adjudicated spatial facts, plus continuation references. |
| A roll can grant choices that did not exist at declaration | A command starts or advances a workflow; it need not encode the whole workflow in one line. |
| Several resource options can coexist | Named option records, not an unexplained sum such as `+3`. |
| Effects have independent instances, durations and saves | Effect references rather than a bare condition name for removal/save/correction. |
| Requested tests and multiple triggered actions have different response policies | Interaction IDs and explicit completion semantics in schemas; omission cannot silently select a policy. |
| An action may create other actions | Parent/child references; no need to embed executable commands inside string arguments. |
| Corrections must replace already-applied effects | Event/effect references and explicit correction operations, distinct from reroll and undo. |

## Established designs and their useful parts

There is no single standardized “slash-command grammar” that fits this application. The slash is a UI
convention; reliable behavior comes from an explicit grammar, typed arguments, documented defaults and
shared execution. The relevant precedents support different parts of that design.

| Primary source | Established behavior | Recommended use here |
| --- | --- | --- |
| Mojang Brigadier [1] | A dispatcher registers literal/typed argument nodes, carries a command source separately, and can parse and inspect input before execution. | Separate parsing from execution; make completion/help aware of the registered action and caller context. |
| Discord application commands [2] | Commands expose typed options, subcommands, descriptions and autocomplete; visible command names can differ from option values. | Treat the palette as a structured input surface over registered definitions. Do not inherit Discord's platform-specific nesting or option-count limits. |
| Python argparse [3] | Subcommands support distinct argument sets and handlers; argument definitions generate help and validation. It also supports disabling abbreviated options. | Use command families and explicit names. Avoid abbreviation whose meaning changes when another command is added. This does not select Python as the engine runtime. |
| VS Code command API [4] | A registered handler can be called programmatically or through UI/keybindings; palette exposure has separate metadata. | Enforce common operation registration and discoverability for every table control. |
| JSON, RFC 8259 [5] | Defines portable strings, numbers, booleans, null, ordered arrays and objects; duplicate object member names have interoperability hazards. | Use JSON for machine payloads and familiar structured literals for uncommon complex input; reject duplicate fields. |
| JSON Schema object documentation [6] | Required fields and additional-property handling are explicit schema choices. | Validate each operation's inputs; do not silently ignore unknown arguments or confuse optional input with unrestricted fields. |
| ABNF, RFC 5234 [7] | Provides a formal way to specify lexical and syntactic rules independently of their implementation. | Publish a grammar and conformance cases rather than relying on examples alone. EBNF notation below is a local specification, not a claim that RFC 5234 defines EBNF. |

## Alternatives considered

These assessments are design judgments, not claims made by the cited projects.

| Approach | Example | Strength | Limitation for this table |
| --- | --- | --- | --- |
| Compact punctuation chain | `@Thorn /test:might+climb` | Short and visually expressive. | Roles become hard to distinguish once options, multiple targets and nested choices are added. `+` is already overloaded between arithmetic, skill bonuses and edges. |
| Positional command tree | `/ability use Thorn "Brutal Slam" Goblin5` | Familiar and economical for a few required inputs. | Omitting optional middle arguments or adding several role-specific targets becomes brittle; readers need to remember positional meaning. |
| Traditional CLI flags | `/ability use --actor Thorn --ability "Brutal Slam" --target Goblin5` | Familiar tooling, explicit option names, well-understood help patterns. | Verbose in an inline composer; repeated options and structured per-target values still require a policy. It is a viable alternative, not technically wrong. |
| Named arguments and typed values | `@Thorn /ability use ability="Brutal Slam" targets=[@Goblin5]` | Visible roles, order-independent fields, explicit lists, easy palette completion. | Requires a small lexer/parser and a documented value grammar. Recommended for the human surface. |
| JSON only | `{"operation":"ability.use","actorId":"hero-thorn",...}` | Explicit, portable and directly schema-validatable. | Unpleasant to type during play. Recommended for headless integration, not as the only human interface. |
| Natural-language interpretation | “Have Thorn attack the fifth goblin.” | Accessible for conversational agents. | Ambiguous intent and entity resolution cannot be the canonical execution contract. An assistant can translate into a structured command for review/execution. |

Named arguments cost a little more typing but make future optional inputs explicit. Autocomplete and
buttons should absorb that cost in normal play. A compact alias can be added later if it expands
unambiguously to the same canonical command; aliases should not become a second behavior implementation.

## Surface rules

1. Start an operation with `/family verb`, such as `/ability use`, `/test request`, `/save roll` or
   `/effect end`. Command paths may grow through registered segments, but keep common paths short.
2. The optional leading `@Thorn` selects the actor. Do not also accept a competing `actor=` field in the
   same human syntax. Structured API callers use an explicit actor field.
3. Put all arguments after the path as `name=value`. Argument order is insignificant; names are lowercase
   ASCII with optional hyphens. Do not depend on positional arguments or automatic abbreviations.
4. Use double quotes for names containing spaces or punctuation. Apostrophes inside double quotes are
   ordinary text. Strings use JSON escaping, including `\"`, `\\` and Unicode escapes.
5. Use `@Name` or `@"Display Name"` for a named reference, and `@{kind:id}` for an explicit stable reference.
   The field schema constrains the kind. `@self` is reserved for the selected actor in target-capable fields;
   `@"self"` can still name an entity literally called self. The actor prefix cannot itself be `@self`.
6. Use lists for collections, including one-element target lists. Preserve list order in the parsed data;
   whether that order is mechanically meaningful belongs to the operation's schema.
7. Use record values for allocations and rare complex choices. Record keys are double-quoted strings;
   values use the same small value language as ordinary arguments.
8. Use explicit booleans and numeric values. Omission, `false`, `null` and `[]` are different. In particular,
   omitting a requested actor list opens the request under the confirmed table design; `actors=[]` means
   an explicit empty selection and should not silently become “everyone.”
9. A command submits one operation. No pipelines, semicolon-separated commands, variable expansion,
   function calls, loops, shell substitution or general arithmetic language. A domain-specific dice
   expression, if supported, is a string interpreted only by the dice operation's schema.
10. User attribution such as `Jon@Thorn:` is log presentation, not an executable prefix or authentication
    claim. Director operations are identified by their operation and authorization; `@director` is not a
    magic way to gain that role. This changes the illustrative Director prefix while preserving its intent.

The language below includes bare enum words and explicit references inside collections. It is therefore
**not JSON**, even though its strings, numbers and record/list punctuation are familiar. Before machine
submission it is lowered into ordinary JSON with typed reference objects and resolved IDs. There is no
requirement for another program to parse this human notation.

## Formal grammar

The following EBNF uses `,` for sequence, `|` for alternatives, `[...]` for optional input and `{...}` for
repetition. Quoted terminals denote literal characters. A lexer recognizes the listed token classes and
retains source spans for diagnostics. Horizontal whitespace outside strings may be spaces or tabs; a
submitted command has no unescaped line breaks. The editor can visually wrap a long command.

```ebnf
command       = hws, [ actor, ws ], "/", path, { ws, argument }, hws ;
actor         = reference ;
path          = key, { ws, key } ;
argument      = key, hws, "=", hws, value ;
value         = reference | string | number | boolean | "null"
              | symbol | list | record ;
reference     = "@", ( refname | string | "{", stable-ref, "}" ) ;
list          = "[", hws, [ value, { hws, ",", hws, value } ], hws, "]" ;
record        = "{", hws, [ member, { hws, ",", hws, member } ], hws, "}" ;
member        = string, hws, ":", hws, value ;
boolean       = "true" | "false" ;
key           = lower, { lower | digit | "-" } ;
refname       = letter, { letter | digit | "_" | "-" } ;
symbol        = letter, { letter | digit | "_" | "-" } ;
stable-ref    = key, ":", opaque-id ;
opaque-id     = ( letter | digit ), { letter | digit | "_" | "-" | ":" | "." | "/" } ;
letter        = lower | upper ;
lower         = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i"
              | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r"
              | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" ;
upper         = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I"
              | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R"
              | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" ;
digit         = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
hws           = { " " | "\t" } ;
ws            = ( " " | "\t" ), hws ;
string        = JSON-STRING ;
number        = JSON-NUMBER ;
```

`JSON-STRING` and `JSON-NUMBER` import the lexical definitions from RFC 8259 sections 6–7 [5], rather than
inventing another quoting system. The tab notation above denotes an actual tab, not a backslash followed
by `t`. Reject invalid Unicode scalar sequences, nonfinite/unrepresentable numbers and structurally invalid
types. Source-rule limits are separate: a spend above a rules allowance or distance above a source range
produces the established warning/manual path, not a syntax rejection. Signed resource values such as
negative clarity must be representable. Strings can contain escaped line breaks; they cannot contain
literal control characters.

Disambiguation and semantic rules complete the grammar:

- Tokens use maximal matching within their lexical class. Reserved unquoted `true`, `false` and `null`
  are not symbols; quoted forms remain strings. A reference `@true` is still an entity name.
- While reading a command path, a key followed by optional horizontal whitespace and `=` starts the
  argument list. All following material must be arguments; path words cannot follow the first argument.
  This lookahead removes the shared `key` prefix between `path` and `argument`.
- `key` is lowercase; display-name references preserve spelling. Completion can help discover differently
  cased names, but execution must resolve exactly one permitted entity and freeze its ID. Ambiguity is
  returned as a choice; it is not silently resolved by first match.
- Enum symbols and display-name binding use exact case by default. An operation may document a
  normalization rule; completion may search more loosely but must submit the selected stable identity.
  A quoted name is not silently lowercased. Canonical names/aliases cannot change meaning because a new
  similarly named action or creature was added.
- Reject duplicate top-level argument names and duplicate record keys recursively. Do not use last-value-wins.
  Reject trailing commas. A number must end at a token boundary, so `2d10` is not parsed as number `2` plus text.
- A stable reference requires a kind and nonempty ID separated at the first colon. Any later colon or
  slash belongs to the opaque ID. Thus `@{effect:e7}` and `@{ability:mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam}`
  are structurally valid, while `@{effect}` is not. The registry validates kinds and field compatibility;
  parsing proves neither existence nor visibility. This portable handle format is not a commitment to
  expose Convex IDs as engine IDs.
- The registry defines valid command paths and fields. Unknown names produce diagnostics. Missing required
  gameplay input can create a pending action card; malformed text does not execute a partial command.
- `@self` in a target field resolves after the acting character has been selected. In an actor prefix it
  would be circular and is rejected. Missing actor context needs a selection; no hidden default is invented.

## Binding and examples

Examples below combine the accepted common command spellings with proposed additional operation names,
arguments and schematic live references. They demonstrate representational coverage, not implemented
commands or a claim that the sample actors meet all game rules. The opening examples establish the
accepted baseline; the broader catalog remains design input.

| Purpose | Example input | Binding or continuation |
| --- | --- | --- |
| Ability against a foe | `@Thorn /ability use ability="Brutal Slam" targets=[@Goblin5]` | One actor, ability definition and live creature target. |
| Self healing | `@Elwin /ability use ability="Healing Grace" targets=[@self]` | Self resolves to Elwin, subject to the ability's self targeting. |
| Ally healing | `@Elwin /ability use ability="Healing Grace" targets=[@Thorn]` | Same operation, different target; ability semantics determine eligibility. |
| Mixed creature/object targets | `@Lyra /ability use ability="Artful Flourish" targets=[@Goblin5,@"Iron Door"]` | Creature and object references, each validated separately. |
| Ability resource option | `@Thorn /ability use ability="Lines of Force" trigger=@{event:e12} choices={"extra-distance":true}` | Option identity expresses what is purchased; source determines its cost. Full targets/destination can follow on a card. |
| Local roll modifiers | `@Lyra /ability use ability="Artful Flourish" targets=[@Goblin5,@Goblin6] modifiers=[{"target":@Goblin5,"edges":1}]` | Modifier provenance and scope remain attached to one target of a shared roll. |
| Ordinary test | `@Thorn /test roll characteristic=might skill=climb edges=1` | One skill bonus and edge category; no arbitrary extra skill stacking. |
| Requested test | `/test request characteristic=might actors=[@Thorn] difficulty=medium` | No creature actor for the Director request; authenticated requester and requested actor differ. |
| Open requested test | `/test request characteristic=intuition` | Opens participant scope; completion policy is still an unresolved product decision. |
| Save an effect | `@Thorn /save roll effect=@{effect:bleeding7}` | References the actual save-ends effect instance; does not request a characteristic test. |
| Answer a target choice | `/card respond card=@{interaction:c17} answer={"targets":[@Goblin6]}` | Response schema and authority come from the identified pending interaction. |
| Respond for one hero in an open card | `@Thorn /card respond card=@{interaction:c18} answer={"roll":true}` | Explicit responding actor; the card validates scope and whether that actor has already answered. |
| Decline a reaction | `@Thorn /card pass card=@{interaction:c19}` | Passes this opportunity for this actor; no universal close-for-everyone assumption. |
| Select an area | `@Elwin /ability use ability="Muse of Fire" area=@{area:a4}` | Bound area placement/membership supplied by a map adapter or a table fact interaction. |
| Supply a path | `/card respond card=@{interaction:c20} answer={"path":[[0,0,0],[1,0,0],[2,0,0]]}` | A schema can define coordinates and units; these sample numbers do not prescribe a map requirement. |
| Allocate a resource | `/card respond card=@{interaction:c21} answer={"allocations":[{"target":@Goblin5,"purpose":damage,"count":2}]}` | Structured allocations; supported choices and costs come from the pending step. |
| Operate an object | `@Thorn /object use object=@{object:ballista1} action=fire targets=[@Goblin5]` | Operator, action source and target remain separate. |
| Start combat setup | `/encounter start type=combat` | Director-authorized state action opens the staged setup/initiative action card; does not instantly begin a chosen side's turn. |
| Correct damage | `/action correct event=@{event:e24} effect=@{effect:damage8} value=10 reason="Director adjudication"` | Reference a particular recorded effect; do not replay the entire ability as a second attack. |
| Undo / redo | `/history undo event=@{event:e25}` / `/history redo event=@{event:e26}` | Recorded operation references; permission/dependency rules remain separate. |

The `extra-distance` option label and card answer field names above are illustrative schema labels, not
identifiers extracted from the corpus. Content bindings must assign stable choice IDs and document them.
The grammar supports richer values without requiring players to type complex records: an action card
can collect the same choices, and an agent can supply typed JSON directly.

### Typed lowering example

This text:

```text
@Thorn /ability use ability="Brutal Slam" targets=[@Goblin5]
```

first yields a syntax tree with a name reference for the actor, path `ability/use`, a string ability label
and a target-reference list. After schema lookup and authorized entity/content binding, the invocation
can be represented as ordinary JSON:

```json
{
  "schemaVersion": 1,
  "requestId": "request-123",
  "context": {"tableId": "table-1", "sessionId": "session-1"},
  "operation": "ability.use",
  "actorId": "hero-thorn",
  "arguments": {
    "abilityId": "mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam",
    "targets": [{"kind": "creature", "id": "foe-goblin5"}]
  }
}
```

The authenticated user is supplied by the execution context. IDs here are illustrative portable IDs.
Execution validates current authority and state; a successful earlier autocomplete lookup does not freeze
permissions. Schema/content revisions and resolved inputs are retained with the accepted record. The
actual public API schema is still a proposal.

For shell-based automation, submit structured JSON through a file/stdin or a language API. A wrapper can
also accept a single command-text argument, but must document the host shell's independent quoting layer.
Never execute the table command as shell code. This language has no file inclusion, variable expansion or
command substitution semantics. Programs needing several operations should call the API several times
with explicit dependencies rather than relying on an undocumented batch syntax.

## Errors, completion and compatibility

Keep parse errors, binding errors, missing gameplay input and rule warnings distinguishable:

| Input or condition | Expected treatment |
| --- | --- |
| `targets=[@Goblin5,]` | Syntax error at trailing comma; no operation submitted. |
| `targets=[@Goblin5] targets=[@Goblin6]` | Duplicate argument diagnostic, not overwrite or implicit append. |
| `{"edges":1,"edges":2}` | Duplicate record-key diagnostic. |
| `@"Goblin Captain"` matches two visible instances | Ask for a specific instance through completion/selection; do not guess. |
| `/ability use ability="Brutal Slam"` has no actor/target context | Syntactically valid; collect required input through the action interface. |
| `/test roll characteristic=migth` | Field value error with a suggested spelling; do not execute as Might automatically. |
| `@self /ability use ...` | Actor binding error; self cannot select the actor it depends on. |
| `/save roll characteristic=might` | Unknown/inapplicable field under the save schema, distinct from a game-rule departure. |
| A target fails the source's range rule | Known rule warning and existing manual-adjudication route, not a parser error. |
| Unknown range | Missing fact; do not fabricate a faithful automatic result. |
| Hidden or unauthorized entity ID | Enforce access without revealing private entity details. |
| `Jon@Thorn: /ability use ...` pasted as command | Display attribution is not executable grammar; a Copy command action should export the canonical executable form. |

Completions should use the same command/content schemas as execution, but remain side-effect-free. Incomplete
text can produce suggestions and field descriptions without submitting it. Store stable operation IDs and
typed arguments with history; do not rely on reparsing old display strings after a rename or grammar change.
Canonical serialization should preserve list order and use one explicit spelling per field. Any future
aliases expand before execution and are recorded with their canonical operation identity.

The research exercised valid and invalid examples with a bounded recognizer, compared normalized
structures and independently reviewed token boundaries. This checks syntax only; rules semantics and
actual state application require separate implementation tests.

### Conformance evidence

The [conformance set](table-command-syntax-cases.json) contains 66 syntax/shape cases, including all binding
examples above, malformed input, numeric overflow, Unicode escapes, duplicate decoded keys and references
versus similarly shaped record literals. Seven cases also assert an explicit parsed structure. All 66
pass the [bounded research recognizer](table-command-syntax-check.py), retained for reproducibility.
Run `python3 docs/research/table-command-syntax-check.py` from the repository root. This is bounded grammar validation, not a
production parser, a formal ambiguity proof or an engine test. The fixture labeled `self-needs-binding`
is deliberately syntactically valid and requires rejection at actor binding; syntax acceptance does not
imply that an operation is valid or authorized. Typed machine lowering and live-state application remain
implementation work.

## Sources

Sources were consulted on 2026-09-11. Product documentation is used for architectural precedent, not a
runtime/version choice. Rules evidence is separately pinned in the linked local research reports.

1. Mojang. [Brigadier README: registration, parsing, inspection and usage](https://github.com/Mojang/brigadier#usage).
2. Discord. [Application Commands: option types, subcommands and autocomplete](https://docs.discord.com/developers/interactions/application-commands).
3. Python Software Foundation. [argparse: subcommands, argument definitions and abbreviation control](https://docs.python.org/3/library/argparse.html).
4. Microsoft. [Visual Studio Code Extension API: Commands](https://code.visualstudio.com/api/extension-guides/command).
5. T. Bray, editor; IETF. [RFC 8259: The JavaScript Object Notation Data Interchange Format](https://www.rfc-editor.org/rfc/rfc8259), December 2017, sections 4–7.
6. JSON Schema. [Understanding JSON Schema: Objects](https://json-schema.org/understanding-json-schema/reference/object).
7. D. Crocker and P. Overell; IETF. [RFC 5234: Augmented BNF for Syntax Specifications](https://www.rfc-editor.org/rfc/rfc5234), January 2008.
