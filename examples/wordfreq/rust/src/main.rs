//! wordfreq — count word frequencies and print the top N.
//!
//! Usage:
//!     wordfreq [-n N] [FILE]
//!
//! Reads FILE (or stdin when omitted). Words are runs of ASCII letters/digits,
//! lower-cased. Output is one "<count>\t<word>" line per word, ranked by count
//! descending, ties broken by word ascending. Behavior mirrors the Python
//! reference in ../python/wordfreq.py.

use std::collections::HashMap;
use std::io::{self, Read};
use std::process::exit;

fn word_freq(text: &str, top_n: usize) -> Vec<(String, u64)> {
    let mut counts: HashMap<String, u64> = HashMap::new();
    let mut current = String::new();
    // Mirror Python's re.findall(r"[a-z0-9]+", text.lower()): keep runs of
    // ASCII alphanumerics, lower-cased; everything else is a separator.
    for ch in text.chars() {
        if ch.is_ascii_alphanumeric() {
            current.push(ch.to_ascii_lowercase());
        } else if !current.is_empty() {
            *counts.entry(std::mem::take(&mut current)).or_insert(0) += 1;
        }
    }
    if !current.is_empty() {
        *counts.entry(current).or_insert(0) += 1;
    }

    let mut ranked: Vec<(String, u64)> = counts.into_iter().collect();
    // count descending, then word ascending (matches key=(-count, word)).
    ranked.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    ranked.truncate(top_n);
    ranked
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let mut top_n: usize = 10;
    let mut path: Option<String> = None;

    let mut i = 1;
    while i < args.len() {
        let a = &args[i];
        if a == "-n" {
            i += 1;
            if i >= args.len() {
                eprintln!("error: -n requires a number");
                exit(2);
            }
            match args[i].parse::<usize>() {
                Ok(n) => top_n = n,
                Err(_) => {
                    eprintln!("error: invalid number: {}", args[i]);
                    exit(2);
                }
            }
        } else if a.starts_with('-') {
            eprintln!("error: unknown flag: {}", a);
            exit(2);
        } else {
            path = Some(a.clone());
        }
        i += 1;
    }

    let text = match &path {
        Some(p) => match std::fs::read_to_string(p) {
            Ok(t) => t,
            Err(e) => {
                eprintln!("error: cannot read {}: {}", p, e);
                exit(1);
            }
        },
        None => {
            let mut buf = String::new();
            if io::stdin().read_to_string(&mut buf).is_err() {
                eprintln!("error: failed to read stdin");
                exit(1);
            }
            buf
        }
    };

    for (word, count) in word_freq(&text, top_n) {
        println!("{}\t{}", count, word);
    }
}
