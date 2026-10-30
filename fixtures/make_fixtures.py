#!/usr/bin/env python3
"""Write fares-exact-{fresh,stale,junk}.json with dates relative to today.

For local testing only: copy one of the outputs to fares.json in a scratch copy
of the site and open it. Dates are generated so "fresh" and "stale" stay true
whenever this is run.

    python3 fixtures/make_fixtures.py
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
URL = ("https://www.google.com/travel/flights?q=Flights%20to%20{d}%20from%20FSD%20on"
       "%202027-09-17%20through%202027-09-25")


def iso(moment):
    return moment.isoformat(timespec="minutes")


def doc(now, exact_nap, exact_fco):
    def dest(code, price, depart, exact):
        entry = {"status": "fresh", "origin": "ORD", "price": price, "depart": depart,
                 "found_at": iso(now), "search_url": URL.format(d=code)}
        if exact is not None:
            entry["exact"] = exact
        return entry
    return {"updated": iso(now), "destinations": {
        "NAP": dest("NAP", 1136.0, "2027-06-12", exact_nap),
        "FCO": dest("FCO", 643.0, "2027-01-25", exact_fco)}}


def exact(price, checked):
    return {"price": price, "outbound": "2027-09-17", "return": "2027-09-25",
            "checked_at": iso(checked)}


def main():
    now = datetime.now().replace(second=0, microsecond=0)
    out = {
        "fares-exact-fresh.json": doc(now, exact(1320.0, now), exact(1250.0, now)),
        "fares-exact-stale.json": doc(now, exact(1320.0, now - timedelta(days=5)),
                                      exact(1250.0, now - timedelta(days=5))),
        # Bad prices and shapes must fall back to the any-date fare, never show a number
        "fares-exact-junk.json": doc(now, exact(0, now), exact("x", now)),
    }
    for name, content in out.items():
        (HERE / name).write_text(json.dumps(content, indent=2) + "\n")
        print("wrote", name)


if __name__ == "__main__":
    main()
