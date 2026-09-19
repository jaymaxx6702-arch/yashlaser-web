import { SupportForm } from "@/components/SupportForm";

export const metadata = { title: "Support" };

export default function Support() {
  return (
    <main id="main-content" className="container section text-page">
      <p className="eyebrow">Customer support</p>
      <h1>How can we help?</h1>
      <SupportForm />
    </main>
  );
}
