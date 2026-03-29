import { createClient } from "./client";

const supabase = createClient();

export async function signUp({ firstName, lastName, email, password, role, country }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        role,
        country: country || null,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn({ email, password, remember }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // If remember me is unchecked, move the session to sessionStorage
  // so it clears when the browser is closed
  if (!remember && data.session) {
    const key = `sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
    const session = localStorage.getItem(key);
    if (session) {
      sessionStorage.setItem(key, session);
      localStorage.removeItem(key);
    }
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) throw error;
  return { ...data, email: session.user.email };
}