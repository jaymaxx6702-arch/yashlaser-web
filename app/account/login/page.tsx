import Link from "next/link";
import {
  customerAccountsEnabled,
  customerUser,
} from "@/lib/customer-auth";
import {
  customerLogin,
  customerSignup,
} from "../actions";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Customer sign in",
  robots: { index: false, follow: false },
};

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await customerUser()) redirect("/account");
  const params = await searchParams;
  const enabled = customerAccountsEnabled();

  return (
    <main id="main-content" className="container section">
      <p className="eyebrow">Yash Laser account</p>
      <h1>Sign in or create an account.</h1>

      {!enabled ? (
        <div className="admin-card">
          <p>
            Customer accounts are prepared but not enabled yet. You can still
            track an order securely without an account.
          </p>
          <Link className="button" href="/track-order">
            Track an order ↗
          </Link>
        </div>
      ) : (
        <div className="account-auth-grid">
          <form className="admin-card" action={customerLogin}>
            <h2>Sign in</h2>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
              />
            </label>
            <button className="button">Sign in</button>
            {params.error && <p role="alert">Sign in failed.</p>}
          </form>

          <form className="admin-card" action={customerSignup}>
            <h2>Create account</h2>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="button">Create account</button>
            {params.signup_error && (
              <p role="alert">Account could not be created.</p>
            )}
            {params.check_email && (
              <p role="status">
                Check your email to complete account confirmation.
              </p>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
