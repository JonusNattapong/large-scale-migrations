#!/usr/bin/env python3
"""wordfreq — count word frequencies and print the top N.

Usage:
    wordfreq [-n N] [FILE]

Reads FILE (or stdin when omitted). Words are runs of ASCII letters/digits,
lower-cased. Output is one "<count>\\t<word>" line per word, ranked by count
descending, ties broken by word ascending.
"""
import sys
import re
from collections import Counter


def word_freq(text, top_n):
    words = re.findall(r"[a-z0-9]+", text.lower())
    counts = Counter(words)
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return ranked[:top_n]


def main(argv):
    top_n = 10
    path = None
    args = argv[1:]
    i = 0
    while i < len(args):
        a = args[i]
        if a == "-n":
            i += 1
            if i >= len(args):
                sys.stderr.write("error: -n requires a number\n")
                return 2
            try:
                top_n = int(args[i])
            except ValueError:
                sys.stderr.write("error: invalid number: {}\n".format(args[i]))
                return 2
        elif a.startswith("-"):
            sys.stderr.write("error: unknown flag: {}\n".format(a))
            return 2
        else:
            path = a
        i += 1

    if path is not None:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
    else:
        text = sys.stdin.read()

    for word, count in word_freq(text, top_n):
        print("{}\t{}".format(count, word))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
