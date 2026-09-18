import type { Metadata } from "next";
import { business, whatsappUrl } from "@/data/business";
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Yash Laser in Prantij, Gujarat, for custom gifts and awards.",
  alternates: { canonical: "/contact" },
};
export default function Contact() {
  return (
    <main id="main-content" className="container text-page">
      <p className="eyebrow">Established 1997</p>
      <h1>Let’s make it personal.</h1>
      <p>{business.address}</p>
      <p>
        <a href="tel:+919427080400">{business.phone}</a> ·{" "}
        <a href="tel:+919427494264">{business.alternate}</a>
        <br />
        <a href={"mailto:" + business.email}>{business.email}</a>
      </p>
      <a
        className="button"
        href={whatsappUrl(
          "Hello Yash Laser, I would like to discuss a customised product.",
        )}
        target="_blank"
        rel="noopener noreferrer"
      >
        Enquire on WhatsApp ↗
      </a>
      <h2>From your idea to your doorstep</h2>
      <ol className="process-steps">
        <li>Browse a product and share your requirements.</li>
        <li>Discuss the price, personalisation and delivery on WhatsApp.</li>
        <li>Approve your digital mockup before production.</li>
        <li>We confirm production and delivery arrangements with you.</li>
      </ol>
      <p>
        Submitting an enquiry does not place a paid order. Prices, timing and
        delivery are confirmed directly with our team.
      </p>
    </main>
  );
}
