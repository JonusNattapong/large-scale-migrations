#!/usr/bin/env bash
# Parity check: the Rust port must produce byte-identical output to the Python
# reference for the same inputs. This is step 6 of the migration process in
# miniature — the source is the oracle, the port must match it.
set -euo pipefail
cd "$(dirname "$0")"

PY="python"; command -v python >/dev/null 2>&1 || PY="python3"

echo "Building the Rust port..."
( cd rust && cargo build --release --quiet )
RUST_BIN="rust/target/release/wordfreq"
[ -f "$RUST_BIN" ] || RUST_BIN="rust/target/release/wordfreq.exe"

fail=0
# Strip CR so a Windows text-mode \r\n from one runtime doesn't masquerade as a
# behavior difference (the OS newline translation is not part of the program).
norm() { tr -d '\r'; }

run_case() {
  local label="$1"; shift
  local py_out rs_out
  py_out="$("$PY" python/wordfreq.py "$@" < fixtures/sample.txt | norm)"
  rs_out="$("$RUST_BIN" "$@" < fixtures/sample.txt | norm)"
  if [ "$py_out" == "$rs_out" ]; then
    echo "PASS  $label"
  else
    echo "FAIL  $label"
    diff <(echo "$py_out") <(echo "$rs_out") || true
    fail=1
  fi
}

# stdin cases with different top-N values.
run_case "default (top 10)"
run_case "top 3"          -n 3
run_case "top 100 (all)"  -n 100
run_case "top 0 (none)"   -n 0

# file-argument case.
py_out="$("$PY" python/wordfreq.py -n 5 fixtures/sample.txt | norm)"
rs_out="$("$RUST_BIN" -n 5 fixtures/sample.txt | norm)"
if [ "$py_out" == "$rs_out" ]; then echo "PASS  file arg (top 5)"; else echo "FAIL  file arg (top 5)"; fail=1; fi

echo
[ "$fail" -eq 0 ] && echo "All parity cases passed — the port matches the reference." || { echo "Parity FAILED."; exit 1; }
