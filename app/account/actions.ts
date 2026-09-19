"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CUSTOMER_COOKIE,
  customerAccountsEnabled,
  publicAuthClient,
} from "@/lib/customer-auth";

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function setCustomerCookie(accessToken: string, expiresIn: number) {
  const origin = (await headers()).get("origin") || "";
  (await cookies()).set(CUSTOMER_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: Math.min(expiresIn, 3600),
  });
}

export async function customerLogin(form: FormData) {
  if (!customerAccountsEnabled())
    redirect("/account/login?disabled=1");

  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  if (!validEmail(email) || password.length < 8 || password.length > 1024)
    redirect("/account/login?error=1");

  const { data, error } = await publicAuthClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user)
    redirect("/account/login?error=1");

  await setCustomerCookie(
    data.session.access_token,
    data.session.expires_in,
  );
  redirect("/account");
}

export async function customerSignup(form: FormData) {
  if (!customerAccountsEnabled())
    redirect("/account/login?disabled=1");

  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  if (!validEmail(email) || password.length < 8 || password.length > 1024)
    redirect("/account/login?signup_error=1");

  const { data, error } = await publicAuthClient().auth.signUp({
    email,
    password,
  });

  if (error || !data.user)
    redirect("/account/login?signup_error=1");

  if (!data.session)
    redirect("/account/login?check_email=1");

  await setCustomerCookie(
    data.session.access_token,
    data.session.expires_in,
  );
  redirect("/account");
}

export async function customerLogout() {
  (await cookies()).set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/account/login");
}
