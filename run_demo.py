#!/usr/bin/env python3
"""
Demo runner — runs all three synthetic cases through the Claims Adjudication Agent.
Usage:  python run_demo.py          # run all cases interactively
        python run_demo.py --all    # run all without pausing
        python run_demo.py --case 1 # run a specific case (1, 2, or 3)
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from agent.claims_adjudication_agent import adjudicate
from data.synthetic_cases import ALL_CASES


def run_case(label: str, prescription: dict) -> None:
    print(f"\n{'#' * 72}")
    print(f"#  {label}")
    print(f"{'#' * 72}\n")
    try:
        result = adjudicate(prescription)
        print(result)
    except Exception as exc:
        print(f"\n[ERROR] {exc}")
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Claims Adjudication Demo")
    parser.add_argument("--all", action="store_true", help="Run all cases without pausing")
    parser.add_argument("--case", type=int, choices=[1, 2, 3], help="Run a single case (1-3)")
    args = parser.parse_args()

    if args.case:
        label, prescription = ALL_CASES[args.case - 1]
        run_case(label, prescription)
        return

    for i, (label, prescription) in enumerate(ALL_CASES):
        run_case(label, prescription)
        if not args.all and i < len(ALL_CASES) - 1:
            input("\n  [Press Enter to run next case, Ctrl-C to quit...]\n")


if __name__ == "__main__":
    main()
