import { redirect } from "next/navigation";
import { adminUser } from "@/lib/admin";
import { login } from "../actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await adminUser()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <section className="admin-card admin-login">
      <h1>Admin sign in</h1>
      <p>Authorised Yash Laser staff only. Sessions last up to one hour.</p>
      {error && (
        <p role="alert">Sign in failed or this account is not authorised.</p>
      )}
      <form action={login}>
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={1024}
          />
        </label>
        <button>Sign in</button>
      </form>
    </section>
  );
}
