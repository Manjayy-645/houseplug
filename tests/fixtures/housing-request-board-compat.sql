-- The local E2E database exercises the legacy request RPC and the current
-- admin board together. Mirror the board's read columns without changing the
-- legacy request constraints or any production migration or policy.
ALTER TABLE public.housing_requests
  ADD COLUMN request_code text,
  ADD COLUMN student_name text,
  ADD COLUMN student_whatsapp text,
  ADD COLUMN campus_zone text,
  ADD COLUMN property_type text,
  ADD COLUMN min_budget integer,
  ADD COLUMN max_budget integer,
  ADD COLUMN move_in_timeline text,
  ADD COLUMN extra_notes text;

CREATE FUNCTION public.qa_request_board_projection() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.request_code := NEW.reference;
  NEW.student_name := NEW.contact_name;
  NEW.student_whatsapp := NEW.contact_phone;
  NEW.campus_zone := NEW.area;
  NEW.property_type := NEW.room_type;
  NEW.min_budget := NEW.total_budget;
  NEW.max_budget := NEW.total_budget;
  NEW.move_in_timeline := NEW.move_in_date::text;
  RETURN NEW;
END;
$$;

CREATE TRIGGER qa_request_board_projection
BEFORE INSERT ON public.housing_requests
FOR EACH ROW EXECUTE FUNCTION public.qa_request_board_projection();
