# V87 shared-main live coordinator proof — `4d6d299`

Result: **passed** on 2026-09-20. The existing shared CT114 main deployment passed the unchanged
V02 nine-scenario headless runner and a bounded authenticated V87 content/foe readback. No source
upload, deploy, build, seed, reset or browser process was used by this job.

## Identity and target

- Job: `test-V87-main-4d6d299-live-1` (Chords message 887)
- Requester: FOES2 `f8589dc3-76c4-4527-8d87-b4c9d13fd9d8`
- Application source: clean `4d6d299ff1080f70c8779579807eae13092b678e`, verified by
  `presidium-dev status`
- Compose project: `salient-dev-b90776c53141`
- Public origin: `https://salient-dev-fc4f48cb09a0.tail41404c.ts.net`
- Runner: CT114 build service on the existing Compose network
- Artifacts: `/srv/presidium/projects/salient/test-artifacts/V87-main-4d6d299-20260920T154031Z`

Before execution CT114 had 9.8 GiB available memory, zero current memory PSI, 24 GiB disk free,
and only the healthy shared-main web/backend pair running. Their measured usage was 794 MiB and
1.34 GiB respectively.

## V02 retained regression

```text
presidium-dev run build -- sh -c \
  'env SALIENT_HEADLESS_REPORT=/artifacts/v87-main/v02-headless.json \
   node scripts/v02-headless.ts'
```

Exit 0: all 9/9 steps passed in 10,875 ms. This covered wizard admission, squad creation and
minion refusal through the public API, shared squad turns, attacks and damage, the casualty ladder,
undo, Free Strike Together, captain attach/detach and squad removal.

Fetched report SHA-256:
`12ea05d37071d5d026678617332abdcd240d08c74692b85dc2b194ea27bef795`.

## V87 deployed-content readback

The coordinator sent one small assertion runner to the existing artifact volume and ran it through
the build service. It created a disposable authenticated Director and campaign, then proved:

- `content:status` reports exactly 1,151 entries and
  `sha256:609aed9b6d4bbb4d08676bfcc080333f48fbb9c64d9c952971f82001bef100ca`;
- `content:list` returns 438 stat blocks;
- the Ghoul `content:get` text is byte-identical to its committed `sourcePath` file;
- `foes:definitions` returns 438 entries and names the required definition
  `Xorannox the Tyract: Compulsion Eye`;
- structured `commands:invoke` of `foe.add` persists that prefixed roster name while its saved
  source snapshot retains the printed name `Compulsion Eye`;
- structured `foe.add` for Ghoul yields an `abilities:sheet` Razor Claws entry with 529 bytes of
  non-empty source text.

The successful readback completed in 1,837 ms. Its fetched report SHA-256 is
`1c1ac654d31748237a2bfb00f36833105e08a0eaf87311be63522dc36c50f99b`.

The first readback runner attempt is retained with exit 1. It stopped immediately after the correct
content status was returned because the coordinator harness compared the complete status object
against only the two required fields; extra revision/seed metadata made that over-specific assertion
fail. No campaign was created in that attempt. The second attempt changed only the harness to compare
`entryCount` and `contentHash` separately; its required application assertions all passed.

The disposable account signed out; disposable campaign and foes remain retained as requested.
Both one-off build containers exited and were removed. The shared playable web/backend pair remains
healthy and running with existing data untouched.
