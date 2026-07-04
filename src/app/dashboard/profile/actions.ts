"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const fullName = formData.get("full_name") as string;
  const headline = formData.get("headline") as string | null;
  const bio = formData.get("bio") as string | null;
  const hourlyRate = formData.get("hourly_rate") as string | null;

  await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      headline: headline || null,
      bio: bio || null,
      hourly_rate_cents: hourlyRate ? Math.round(parseFloat(hourlyRate) * 100) : null,
    })
    .eq("id", user.id);

  revalidatePath("/dashboard/profile");
}