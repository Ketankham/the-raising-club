// Functional test of the /events filters: requests the live dev server with
// various filter query strings (the same params the client filter form writes)
// and asserts which event cards render. Exercises parseFilters -> listEvents ->
// matchesFilters end-to-end. Run: node scripts/test-filters.mjs
const BASE = "http://localhost:3000/events";
const M = "Montessori";
const T = "Toddler Open Play";
const N = "Newborn Sleep";
const ALL = [M, T, N];

// title -> substring presence in the rendered HTML
async function titlesIn(query) {
  const res = await fetch(query ? `${BASE}?${query}` : BASE, { headers: { "cache-control": "no-cache" } });
  const html = await res.text();
  return { status: res.status, present: ALL.filter((t) => html.includes(t)) };
}

const cases = [
  { name: "no filter", q: "", expect: [M, T, N] },
  { name: "How you'll join = Online", q: "join=online", expect: [N] },
  { name: "How you'll join = In-Person", q: "join=in_person", expect: [M, T] },
  { name: "Who attends = Adults only", q: "who=adults_only", expect: [N] },
  { name: "Who attends = Children w/ adult", q: "who=children_with_adult", expect: [M, T] },
  { name: "Who attends multi (dropoff+adults)", q: "who=children_dropoff%2Cadults_only", expect: [N] },
  { name: "Event style = Workshop", q: "style=workshop", expect: [N] },
  { name: "Event style = Open play", q: "style=open_play", expect: [T] },
  { name: "Event style multi (open+series)", q: "style=open_play%2Congoing_series", expect: [M, T] },
  { name: "Price <= $10 (free only)", q: "priceMax=10", expect: [T] },
  { name: "Price <= $30", q: "priceMax=30", expect: [T, N] },
  { name: "Price <= $50", q: "priceMax=50", expect: [M, T, N] },
  { name: "Child age <= 4 months", q: "ageMax=4", expect: [N] },
  { name: "Child age <= 10 months", q: "ageMax=10", expect: [M, N] },
  { name: "Search q=Montessori", q: "q=Montessori", expect: [M] },
  { name: "Search q=sleep", q: "q=sleep", expect: [N] },
  { name: "When >= 2026-01-01 (upcoming)", q: "date=2026-01-01", expect: [M, T, N] },
  { name: "When >= 2026-12-01 (none)", q: "date=2026-12-01", expect: [] },
  { name: "Combo: in_person + children_with_adult", q: "join=in_person&who=children_with_adult", expect: [M, T] },
  { name: "Combo: online + workshop + <=$30", q: "join=online&style=workshop&priceMax=30", expect: [N] },
];

const sortedEq = (a, b) => a.slice().sort().join("|") === b.slice().sort().join("|");

let pass = 0;
let fail = 0;
for (const c of cases) {
  const { status, present } = await titlesIn(c.q);
  const ok = status === 200 && sortedEq(present, c.expect);
  if (ok) {
    pass++;
    console.log(`  PASS  ${c.name}  ->  [${present.join(", ") || "none"}]`);
  } else {
    fail++;
    console.log(`✗ FAIL  ${c.name}`);
    console.log(`        query:    ?${c.q}`);
    console.log(`        expected: [${c.expect.join(", ") || "none"}]`);
    console.log(`        got:      [${present.join(", ") || "none"}] (HTTP ${status})`);
  }
}
console.log(`\n${pass}/${pass + fail} filter cases passed.`);
process.exit(fail ? 1 : 0);
