-- 0030_course_completion_gate.sql
-- Enforce the completion rule server-side: a course is only completed (and a
-- certificate issued) once ALL modules are done AND the quiz is passed. The
-- UI already hides the quiz until every module is complete; this is the
-- backstop against direct navigation. Courses with skip_to_cert_enabled keep
-- their intentional escape hatch (trained users jump straight to the quiz).

create or replace function submit_course_quiz(target_course uuid, answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user           uuid := auth.uid();
  v_enrollment     uuid;
  v_quiz           uuid;
  v_threshold      smallint;
  v_total          integer;
  v_correct        integer;
  v_score          smallint;
  v_passed         boolean;
  v_attempt        uuid;
  v_cert_id        text;
  v_cert_row       certificates%rowtype;
  v_name           text;
  v_skip           boolean;
  v_total_modules  integer;
  v_done_modules   integer;
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

  -- Completion gate: all modules must be complete unless the course lets the
  -- learner skip straight to certification.
  select skip_to_cert_enabled into v_skip from courses where id = target_course;
  if not coalesce(v_skip, false) then
    select count(*) into v_total_modules from course_modules where course_id = target_course;
    select count(*) into v_done_modules
      from course_module_progress cmp
      join course_modules cm on cm.id = cmp.module_id
     where cmp.enrollment_id = v_enrollment and cm.course_id = target_course;
    if v_total_modules > 0 and v_done_modules < v_total_modules then
      raise exception 'Complete all modules before the integration moment';
    end if;
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
