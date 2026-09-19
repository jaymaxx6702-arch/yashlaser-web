import { ProjectRequestForm } from "@/components/ProjectRequestForm";

export const metadata = {
  title: "Bulk orders",
  description: "Request bulk personalised products from Yash Laser.",
};

export default function BulkOrders() {
  return (
    <main id="main-content" className="container section text-page">
      <p className="eyebrow">Schools · Corporate · Events</p>
      <h1>Bulk orders, without the spreadsheet chaos.</h1>
      <p>
        Share quantity, deadline and an optional Excel/CSV file. We review the
        data and confirm the quotation and proof before production.
      </p>
      <ProjectRequestForm kind="bulk" />
    </main>
  );
}
