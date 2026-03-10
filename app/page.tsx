import { createServerClient } from "@/app/lib/auth/supabase-server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/courses");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role || user?.app_metadata?.role;
  if (!role) {
    redirect("/onboarding/role");
  }

  if (String(role).toLowerCase() === "instructor") {
    redirect("/instructor/dashboard");
  }

  redirect("/courses");
}
