import { ProjectRequestForm } from "@/components/ProjectRequestForm";

export const metadata = { title: "Plan my event" };

export default function PlanEvent() {
  return (
    <main id="main-content" className="container section text-page">
      <p className="eyebrow">Awards · Medals · Gifts · Identity</p>
      <h1>Plan products for your event.</h1>
      <p>
        Tell us the date, people count, budget and requirement. We will turn it
        into a practical product plan and quotation.
      </p>
      <ProjectRequestForm kind="event" />
    </main>
  );
}
