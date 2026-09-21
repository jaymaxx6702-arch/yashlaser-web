"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CUSTOMER_COOKIE,
  customerAccountsEnabled,
  publicAuthClient,
} from "@/lib/customer-auth";

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeAccountPath(
  value: FormDataEntryValue | null,
  kind: "account" | "login",
) {
  const raw = typeof value === "string" ? value.trim() : "";
  const allowed =
    kind === "account"
      ? /^\/(?:gu\/|hi\/|mr\/)?account$/
      : /^\/(?:gu\/|hi\/|mr\/)?account\/login$/;
  if (allowed.test(raw)) return raw;
  return kind === "account" ? "/account" : "/account/login";
}

async function setCustomerCookie(accessToken: string, expiresIn: number) {
  (await cookies()).set(CUSTOMER_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.min(expiresIn, 3600),
  });
}

export async function customerLogin(form: FormData) {
  const accountPath = safeAccountPath(form.get("accountPath"), "account");
  const loginPath = safeAccountPath(form.get("loginPath"), "login");

  if (!customerAccountsEnabled())
    redirect(loginPath + "?disabled=1");

  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  if (!validEmail(email) || password.length < 8 || password.length > 1024)
    redirect(loginPath + "?error=1");

  const { data, error } = await publicAuthClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user)
    redirect(loginPath + "?error=1");

  await setCustomerCookie(
    data.session.access_token,
    data.session.expires_in,
  );
  redirect(accountPath);
}

export async function customerSignup(form: FormData) {
  const accountPath = safeAccountPath(form.get("accountPath"), "account");
  const loginPath = safeAccountPath(form.get("loginPath"), "login");

  if (!customerAccountsEnabled())
    redirect(loginPath + "?disabled=1");

  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  if (!validEmail(email) || password.length < 8 || password.length > 1024)
    redirect(loginPath + "?signup_error=1");

  const { data, error } = await publicAuthClient().auth.signUp({
    email,
    password,
  });

  if (error || !data.user)
    redirect(loginPath + "?signup_error=1");

  if (!data.session)
    redirect(loginPath + "?check_email=1");

  await setCustomerCookie(
    data.session.access_token,
    data.session.expires_in,
  );
  redirect(accountPath);
}

export async function customerLogout(form: FormData) {
  const loginPath = safeAccountPath(form.get("loginPath"), "login");
  (await cookies()).set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  redirect(loginPath);
}
