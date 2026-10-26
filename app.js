// Fills the two fare cards from fares.json. The page reads fine without it:
// every card already says "Check live prices" and has a working search link.
(function () {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function shortDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) return "";
    return MONTHS[Number(m[2]) - 1] + " " + Number(m[3]);
  }

  var STALE_DAYS = 14;

  // The Pi re-publishes at least weekly, so an old `updated` means it has stopped
  function publishingStopped(doc) {
    var t = Date.parse(doc && doc.updated);
    return !isFinite(t) || Date.now() - t > STALE_DAYS * 86400000;
  }

  function fill(card, entry, stopped) {
    var price = card.querySelector("[data-role=price]");
    var detail = card.querySelector("[data-role=detail]");
    var link = card.querySelector("[data-role=link]");
    if (!entry || typeof entry !== "object") return;
    if (typeof entry.search_url === "string" &&
        entry.search_url.indexOf("https://www.google.com/travel/flights?") === 0) {
      link.href = entry.search_url;
    }
    var ok = typeof entry.price === "number" && isFinite(entry.price) && entry.price > 0;
    if (!ok || (entry.status !== "fresh" && entry.status !== "stale")) return;
    // An out-of-date fare is never shown as a number: send guests to live prices
    if (stopped || entry.status === "stale") {
      detail.textContent = "Prices not updated recently";
      return;
    }
    price.textContent = "$" + Math.round(entry.price).toLocaleString("en-US");
    var bits = [];
    if (entry.origin) bits.push("from " + entry.origin);
    if (shortDate(entry.depart)) bits.push("departing " + shortDate(entry.depart));
    if (shortDate(entry.found_at)) bits.push("seen " + shortDate(entry.found_at));
    detail.textContent = bits.join(" · ");
  }

  fetch("fares.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (doc) {
      var dests = doc && typeof doc.destinations === "object" ? doc.destinations : {};
      var stopped = publishingStopped(doc);
      document.querySelectorAll(".card[data-dest]").forEach(function (card) {
        fill(card, dests[card.getAttribute("data-dest")], stopped);
      });
    })
    .catch(function () { /* keep the "Check live prices" defaults */ });

  // Slow fade-up as sections scroll into view (off for reduced-motion visitors)
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    document.documentElement.classList.add("motion");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }
})();
