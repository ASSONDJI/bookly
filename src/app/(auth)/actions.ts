"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect("/sign-up?error=" + encodeURIComponent(error.message));
  }

  if (!data.user || !data.session) {
    redirect("/sign-up?error=" + encodeURIComponent("This email is already registered"));
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role,
  });

  if (profileError) {
    redirect("/sign-up?error=" + encodeURIComponent(profileError.message));
  }

  redirect("/dashboard");
}


export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/sign-in?error=" + encodeURIComponent(error.message));
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}