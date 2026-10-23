// Fills the two fare cards from fares.json. The page reads fine without it:
// every card already says "Check live prices" and has a working search link.
(function () {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function shortDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) return "";
    return MONTHS[Number(m[2]) - 1] + " " + Number(m[3]);
  }

  function fill(card, entry) {
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
    price.textContent = "$" + Math.round(entry.price).toLocaleString("en-US");
    var bits = [];
    if (entry.origin) bits.push("from " + entry.origin);
    if (shortDate(entry.depart)) bits.push("departing " + shortDate(entry.depart));
    if (shortDate(entry.found_at)) bits.push("seen " + shortDate(entry.found_at));
    detail.textContent = bits.join(" · ") +
      (entry.status === "stale" ? " · prices not updated recently" : "");
  }

  fetch("fares.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (doc) {
      var dests = doc && typeof doc.destinations === "object" ? doc.destinations : {};
      document.querySelectorAll(".card[data-dest]").forEach(function (card) {
        fill(card, dests[card.getAttribute("data-dest")]);
      });
    })
    .catch(function () { /* keep the "Check live prices" defaults */ });
})();
