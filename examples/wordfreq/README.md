# Example: `wordfreq` (Python → Rust)

A tiny but complete migration you can run end to end. `wordfreq` reads text,
counts word frequencies, and prints the top N — ranked by count descending,
ties broken alphabetically.

```
wordfreq [-n N] [FILE]     # FILE or stdin
```

It's small on purpose, but it exercises the things a real migration must get
right: argument parsing, stdin *and* file input, a hash map, a stable multi-key
sort, exit codes, and exact output formatting.

## Run it

```bash
# reference (source of truth)
python python/wordfreq.py -n 5 fixtures/sample.txt

# the port
cd rust && cargo run --release -- -n 5 ../fixtures/sample.txt

# prove they match, byte for byte
bash parity.sh
```

## How the six-step process maps to this example

| Step | In the kit | Here |
| --- | --- | --- |
| **1. Feasibility** | Is a structure-preserving port realistic? | Yes — pure stdlib, deterministic I/O, no framework. |
| **2. Judge setup** | Define the oracle that grades the port | `parity.sh`: the Python output *is* the spec. |
| **3. Map & rules** | Dependency map + a rulebook | See "Migration rules" below — the decisions that keep behavior identical. |
| **4. Stress-test** | Try to break the rules before scaling | Edge cases in `parity.sh`: `-n 0`, `-n` past the vocabulary, file vs stdin. |
| **5. Translate → compile → test** | Port, build, run | `rust/src/main.rs`; `cargo build`; `parity.sh` runs both. |
| **6. Parity** | Behavior matches the source | All five cases pass — identical output. |

## Migration rules (the rulebook, in miniature)

These are the non-obvious decisions that make the port *behaviorally* identical
rather than just "roughly the same":

1. **Tokenizing.** Python's `re.findall(r"[a-z0-9]+", text.lower())` keeps only
   ASCII alphanumerics. The Rust port walks chars with `is_ascii_alphanumeric()`
   and `to_ascii_lowercase()` — deliberately ASCII, not Unicode, to match.
2. **Tie-breaking.** Python sorts by `key=(-count, word)`. Rust replicates it with
   `b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0))` — count down, word up. Without the
   explicit tie-break, hash-map order would make output non-deterministic.
3. **Output format.** One `"<count>\t<word>"` line per entry, tab-separated —
   `print("{}\t{}")` ↔ `println!("{}\t{}")`.
4. **Exit codes.** `2` for a usage error (bad flag / missing `-n` value), `1` for
   an I/O error, `0` on success — same in both.
5. **Newlines are not behavior.** Windows text-mode stdout turns `\n` into `\r\n`;
   `parity.sh` strips `\r` before comparing so an OS artifact isn't mistaken for a
   real difference. (This is a genuine gotcha real migrations hit.)

## What "done" looks like

`parity.sh` exits 0 with every case `PASS`. That green is the whole point: the
port isn't finished because it compiles — it's finished because it *behaves like
the original*.

## Results

A captured parity run (dated, with toolchain versions and full output) lives in
[`results/`](results/) — e.g.
[`results/2026-07-23-parity.md`](results/2026-07-23-parity.md). This is the
project's honest equivalent of a benchmark: not "it's faster", but "it provably
does the same thing".
