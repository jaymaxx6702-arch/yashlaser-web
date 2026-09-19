import { ProjectRequestForm } from "@/components/ProjectRequestForm";

export const metadata = { title: "Custom acrylic" };

export default function CustomAcrylic() {
  return (
    <main id="main-content" className="container section text-page">
      <p className="eyebrow">Upload your idea</p>
      <h1>Custom acrylic, reviewed before we promise it.</h1>
      <p>
        Share the idea, approximate size, quantity and reference file.
        Feasibility, final dimensions, price and timing are confirmed after review.
      </p>
      <ProjectRequestForm kind="custom_acrylic" />
    </main>
  );
}
