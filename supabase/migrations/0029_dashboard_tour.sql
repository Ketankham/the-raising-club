-- 0029_dashboard_tour.sql
-- Tracks whether a user has seen the first-run dashboard tour (welcome modal +
-- Connect/Learn/Events coachmarks). Null => not yet completed, so the tour runs
-- once; set to now() when the user finishes or skips it, then hidden forever.

alter table profiles add column if not exists dashboard_tour_completed_at timestamptz;
