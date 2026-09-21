import { ReviewsClient } from "@/components/ReviewsClient";

export const metadata = {
  title: "Customer reviews",
  description: "Customer reviews for personalised products from Yash Laser.",
};

export default function ReviewsPage() {
  return (
    <main id="main-content" className="container section text-page">
      <ReviewsClient />
    </main>
  );
}
