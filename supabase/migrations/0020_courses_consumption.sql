-- 0020_courses_consumption.sql
-- Courses — consumption side: enrollment, progress, revision answers, quiz
-- attempts, certificates. Plus the secure server-side quiz grading that issues
-- certificates and awards skills atomically (so clients can't forge a pass).
-- Reuses: profiles, caregiver_profiles, caregiver_skill_selections, skills,
-- courses + course_* (0019), is_admin(), course_can_manage()/course_is_public().
-- Run order: 0019 -> 0020.
--
-- Key rules:
--   * All roles can enroll/progress/certify. SKILLS are awarded to CAREGIVERS only.
--   * Final quiz: 60% pass (course_quizzes.pass_threshold), UNLIMITED attempts.
--   * Right/wrong is NEVER revealed until the learner clears the quiz; then the
--     soft review (course_quiz_review) shows correctness + explanations.
--   * Earned skills (proof='trc_course') + issued certificates surface on the
--     caregiver profile page.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type course_enrollment_status as enum ('active', 'completed');

-- ---------------------------------------------------------------------------
-- course_enrollments : one row per (user, course). All roles allowed.
-- ---------------------------------------------------------------------------
create table course_enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  course_id     uuid not null references courses (id) on delete cascade,
  status        course_enrollment_status not null default 'active',
  started_at    timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, course_id)
);
create index course_enrollments_user_idx on course_enrollments (user_id);
create index course_enrollments_course_idx on course_enrollments (course_id);

-- Does the current user own this enrollment? (SECURITY DEFINER avoids recursion.)
create or replace function owns_course_enrollment(target_enrollment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from course_enrollments e
    where e.id = target_enrollment and e.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- course_module_progress : which modules the learner has completed.
-- ---------------------------------------------------------------------------
create table course_module_progress (
  enrollment_id uuid not null references course_enrollments (id) on delete cascade,
  module_id     uuid not null references course_modules (id) on delete cascade,
  completed_at  timestamptz not null default now(),
  primary key (enrollment_id, module_id)
);

-- ---------------------------------------------------------------------------
-- course_revision_answers : "Pause & Notice" answers. UNIQUE(enrollment,question)
-- enforces "solved once, never reappears".
-- ---------------------------------------------------------------------------
create table course_revision_answers (
  enrollment_id    uuid not null references course_enrollments (id) on delete cascade,
  question_id      uuid not null references course_revision_questions (id) on delete cascade,
  chosen_option_id uuid not null references course_revision_options (id) on delete cascade,
  answered_at      timestamptz not null default now(),
  primary key (enrollment_id, question_id)
);

-- ---------------------------------------------------------------------------
-- course_quiz_attempts : every attempt (unlimited). passed gate = 60% default.
-- Inserted ONLY by submit_course_quiz() (SECURITY DEFINER) so passed can't be forged.
-- ---------------------------------------------------------------------------
create table course_quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references course_enrollments (id) on delete cascade,
  quiz_id       uuid not null references course_quizzes (id) on delete cascade,
  score         smallint not null check (score between 0 and 100),
  passed        boolean not null,
  answers       jsonb not null default '{}'::jsonb,   -- {question_id: option_id}
  created_at    timestamptz not null default now()
);
create index course_quiz_attempts_enr_idx on course_quiz_attempts (enrollment_id, created_at);

-- ---------------------------------------------------------------------------
-- certificates : issued on pass. Certificate ID 'TRC-YYYYMMDD-XXXX'. Signer/mode
-- snapshotted so later config edits don't change an issued cert. verify_token is
-- the QR target. Inserted ONLY by submit_course_quiz().
-- ---------------------------------------------------------------------------
create table certificates (
  id                uuid primary key default gen_random_uuid(),
  certificate_id    text not null unique,                -- human-facing id (TRC-YYYYMMDD-XXXX)
  user_id           uuid not null references profiles (id) on delete cascade,
  course_id         uuid not null references courses (id) on delete cascade,
  enrollment_id     uuid not null references course_enrollments (id) on delete cascade,
  verify_token      uuid not null default gen_random_uuid(),
  recipient_name    text not null,                       -- snapshot
  course_title      text not null,                       -- snapshot
  mode              text,                                -- snapshot ("Online · Self-paced")
  estimated_learning_minutes integer,                    -- snapshot
  signer1_name      text,
  signer1_title     text,
  signer2_name      text,
  signer2_title     text,
  footer_disclaimer text,
  issued_at         timestamptz not null default now(),
  revoked_at        timestamptz,
  unique (user_id, course_id)
);
create unique index certificates_verify_token_idx on certificates (verify_token);
create index certificates_user_idx on certificates (user_id);
create index certificates_course_idx on certificates (course_id);

-- ===========================================================================
-- RLS
-- ===========================================================================
alter table course_enrollments       enable row level security;
alter table course_module_progress   enable row level security;
alter table course_revision_answers  enable row level security;
alter table course_quiz_attempts     enable row level security;
alter table certificates             enable row level security;

-- Enrollments: a user enrolls themselves in a published course; owner + course
-- manager + admin can read; owner updates own (progress timestamps).
create policy course_enrollments_insert on course_enrollments
  for insert with check (user_id = auth.uid() and course_is_public(course_id));
create policy course_enrollments_read on course_enrollments
  for select using (user_id = auth.uid() or is_admin() or course_can_manage(course_id));
create policy course_enrollments_update_own on course_enrollments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Module progress: owner read/write via the enrollment.
create policy course_module_progress_rw on course_module_progress
  for all using (owns_course_enrollment(enrollment_id))
  with check (owns_course_enrollment(enrollment_id));

-- Revision answers: owner read/write via the enrollment.
create policy course_revision_answers_rw on course_revision_answers
  for all using (owns_course_enrollment(enrollment_id))
  with check (owns_course_enrollment(enrollment_id));

-- Quiz attempts: owner + manager read. NO direct insert (only the grading fn writes).
create policy course_quiz_attempts_read on course_quiz_attempts
  for select using (owns_course_enrollment(enrollment_id) or is_admin());

-- Certificates: owner + admin read. Public verification goes through
-- verify_certificate() (SECURITY DEFINER), not a broad RLS read. No direct insert.
create policy certificates_read_own on certificates
  for select using (user_id = auth.uid() or is_admin());

-- ===========================================================================
-- Quiz taking : serve questions WITHOUT answers; grade + issue server-side.
-- ===========================================================================

-- Questions + options for a taker, with is_correct/explanation STRIPPED. Caller
-- must be enrolled (or a manager). Returns ordered JSON the player renders.
create or replace function course_quiz_for_taker(target_course uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_enrolled boolean;
  v_result   jsonb;
begin
  v_enrolled := exists (
    select 1 from course_enrollments e
    where e.course_id = target_course and e.user_id = auth.uid()
  ) or course_can_manage(target_course);
  if not v_enrolled then
    raise exception 'Not enrolled in this course';
  end if;

  select jsonb_build_object(
    'quiz_id', q.id,
    'pass_threshold', q.pass_threshold,
    'intro_copy', q.intro_copy,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', qq.id,
        'prompt', qq.prompt,
        'options', coalesce((
          select jsonb_agg(jsonb_build_object('id', qo.id, 'body', qo.body) order by qo.position)
          from course_quiz_options qo where qo.question_id = qq.id
        ), '[]'::jsonb)
      ) order by qq.position)
      from course_quiz_questions qq where qq.quiz_id = q.id
    ), '[]'::jsonb)
  )
  into v_result
  from course_quizzes q
  where q.course_id = target_course;

  return v_result;  -- null if the course has no quiz
end;
$$;

-- Grade a submission, record the attempt, and on pass: complete the enrollment,
-- award skills (caregivers only), and issue a certificate. Idempotent on the
-- certificate (unique user+course). answers = {question_id: option_id}.
create or replace function submit_course_quiz(target_course uuid, answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user       uuid := auth.uid();
  v_enrollment uuid;
  v_quiz       uuid;
  v_threshold  smallint;
  v_total      integer;
  v_correct    integer;
  v_score      smallint;
  v_passed     boolean;
  v_attempt    uuid;
  v_cert_id    text;
  v_cert_row   certificates%rowtype;
  v_name       text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_enrollment from course_enrollments
    where course_id = target_course and user_id = v_user;
  if v_enrollment is null then
    raise exception 'Not enrolled in this course';
  end if;

  select id, pass_threshold into v_quiz, v_threshold
    from course_quizzes where course_id = target_course;
  if v_quiz is null then
    raise exception 'This course has no quiz';
  end if;

  select count(*) into v_total from course_quiz_questions where quiz_id = v_quiz;
  if v_total = 0 then
    raise exception 'This quiz has no questions';
  end if;

  -- Count questions whose chosen option is the correct one.
  select count(*) into v_correct
  from course_quiz_questions qq
  join course_quiz_options qo
    on qo.question_id = qq.id
   and qo.is_correct
   and qo.id = (answers ->> qq.id::text)::uuid
  where qq.quiz_id = v_quiz;

  v_score  := round(v_correct::numeric * 100 / v_total);
  v_passed := v_score >= v_threshold;

  insert into course_quiz_attempts (enrollment_id, quiz_id, score, passed, answers)
  values (v_enrollment, v_quiz, v_score, v_passed, coalesce(answers, '{}'::jsonb))
  returning id into v_attempt;

  if v_passed then
    -- Complete the enrollment (first pass only).
    update course_enrollments
      set status = 'completed',
          completed_at = coalesce(completed_at, now()),
          last_activity_at = now()
      where id = v_enrollment;

    -- Award course skills to CAREGIVERS only (needs a caregiver_profiles row).
    if exists (select 1 from caregiver_profiles cp where cp.user_id = v_user) then
      insert into caregiver_skill_selections (user_id, skill_id, proof)
      select v_user, cs.skill_id, 'trc_course'
      from course_skills cs
      where cs.course_id = target_course
      on conflict (user_id, skill_id) do update
        set proof = coalesce(caregiver_skill_selections.proof, 'trc_course');
    end if;

    -- Issue a certificate (idempotent on user+course).
    select * into v_cert_row from certificates
      where user_id = v_user and course_id = target_course;
    if v_cert_row.id is null then
      select coalesce(p.preferred_name,
                      nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
                      p.email, 'Learner')
        into v_name
        from profiles p where p.id = v_user;

      v_cert_id := 'TRC-' || to_char(now(), 'YYYYMMDD') || '-' ||
                   upper(left(replace(gen_random_uuid()::text, '-', ''), 4));

      insert into certificates (
        certificate_id, user_id, course_id, enrollment_id, recipient_name,
        course_title, mode, estimated_learning_minutes,
        signer1_name, signer1_title, signer2_name, signer2_title, footer_disclaimer
      )
      select v_cert_id, v_user, target_course, v_enrollment, v_name,
             c.title, c.mode, c.estimated_learning_minutes,
             cfg.signer1_name, cfg.signer1_title, cfg.signer2_name, cfg.signer2_title,
             cfg.footer_disclaimer
      from courses c
      left join course_certificate_config cfg on cfg.course_id = c.id
      where c.id = target_course
      returning * into v_cert_row;
    end if;
  end if;

  return jsonb_build_object(
    'score', v_score,
    'passed', v_passed,
    'threshold', v_threshold,
    'attempt_id', v_attempt,
    'certificate_id', v_cert_row.certificate_id,
    'verify_token', v_cert_row.verify_token
  );
end;
$$;

-- Soft review AFTER passing : reveal correctness + explanations. Only for a
-- learner who has a passing attempt (or a manager). Never before clearing.
create or replace function course_quiz_review(target_course uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_quiz   uuid;
  v_ok     boolean;
  v_result jsonb;
begin
  select id into v_quiz from course_quizzes where course_id = target_course;
  if v_quiz is null then return null; end if;

  v_ok := course_can_manage(target_course) or exists (
    select 1 from course_quiz_attempts a
    join course_enrollments e on e.id = a.enrollment_id
    where e.user_id = auth.uid() and a.quiz_id = v_quiz and a.passed
  );
  if not v_ok then
    raise exception 'Quiz review is available after you complete the quiz';
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', qq.id,
    'prompt', qq.prompt,
    'options', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', qo.id, 'body', qo.body,
        'is_correct', qo.is_correct, 'explanation', qo.explanation
      ) order by qo.position)
      from course_quiz_options qo where qo.question_id = qq.id
    ), '[]'::jsonb)
  ) order by qq.position)
  into v_result
  from course_quiz_questions qq where qq.quiz_id = v_quiz;

  return v_result;
end;
$$;

-- ===========================================================================
-- Public certificate verification (the QR target). Returns safe fields only.
-- ===========================================================================
create or replace function verify_certificate(token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'valid', (c.revoked_at is null),
    'certificate_id', c.certificate_id,
    'recipient_name', c.recipient_name,
    'course_title', c.course_title,
    'issued_at', c.issued_at,
    'revoked_at', c.revoked_at
  )
  from certificates c
  where c.verify_token = token;
$$;

-- ===========================================================================
-- Profile surfacing : a learner's issued certificates for their profile page.
-- (Skills already surface via caregiver_skill_selections proof='trc_course'.)
-- Owner reads via certificates_read_own RLS; this view also exposes course slug.
-- ===========================================================================
-- security_invoker = true so the caller's RLS on `certificates` is enforced
-- (otherwise the view would run as owner and expose every row).
create or replace view course_certificates_with_course
  with (security_invoker = true) as
  select c.*, co.slug as course_slug, co.cover_image_url as course_cover_image_url
  from certificates c
  join courses co on co.id = c.course_id;
