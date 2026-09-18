import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Customer artwork & privacy",
  alternates: { canonical: "/privacy" },
};
export default function Privacy() {
  return (
    <main id="main-content" className="container text-page">
      <h1>Your details & artwork</h1>
      <p>
        Your customization draft, including the selected photograph and design
        text, is saved on this browser for up to 24 hours so you can return to
        it. It is not uploaded to our server until you submit an enabled online
        enquiry. Use Reset customization to remove the saved photo and text.
        Contact details are not included in the browser draft. Avoid shared
        devices for personal artwork.
      </p>
      <p>
        We use the contact details, product choices and artwork you share to
        respond to your enquiry, prepare a mockup and arrange an approved order.
      </p>
      <p>
        When website submission is enabled, artwork is stored privately for the
        Yash Laser team. Customer uploads are not part of our public product
        gallery. Share only images and logos you have permission to use.
      </p>
      <p>
        WhatsApp opens only when you choose the handoff button. In the WhatsApp
        enquiry flow, attach your artwork directly in that conversation;
        choosing a file for the browser preview does not send it to us.
      </p>
      <p>
        Please avoid uploading identity documents or unnecessary personal
        information. For I-cards, use sample text in the preview and discuss
        secure collection of staff or student details with our team.
      </p>
      <p>
        To request correction or removal of an enquiry or artwork, contact{" "}
        <a href="mailto:yashlaser@gmail.com">yashlaser@gmail.com</a> or +91
        94270 80400. We will confirm what information is still needed for an
        active order.
      </p>
    </main>
  );
}
