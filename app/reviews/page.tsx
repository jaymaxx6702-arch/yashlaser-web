"use client";
import { useEffect, useState, type FormEvent } from "react";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  verified_purchase: boolean;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetch("/api/reviews")
      .then((response) => response.json())
      .then((result) => setReviews(result.reviews || []));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: fd.get("productId"),
        name: fd.get("name"),
        rating: Number(fd.get("rating")),
        review: fd.get("review"),
      }),
    });
    const result = await response.json();
    setStatus(
      response.ok
        ? "Review submitted for moderation."
        : result.error || "Unable to submit review.",
    );
  }

  return (
    <main id="main-content" className="container section text-page">
      <p className="eyebrow">Customer reviews</p>
      <h1>What customers say.</h1>

      <form className="project-form" onSubmit={submit}>
        <label>
          Product ID
          <input name="productId" required />
        </label>
        <label>
          Your name
          <input name="name" required />
        </label>
        <label>
          Rating
          <select name="rating" defaultValue="5">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
        <label>
          Review
          <textarea name="review" rows={4} required />
        </label>
        <button className="button">Submit review</button>
        {status && <p role="status">{status}</p>}
      </form>

      <div>
        {reviews.map((review) => (
          <article key={review.id} className="admin-card">
            <strong>{"★".repeat(review.rating)}</strong>
            <p>{review.review_text}</p>
            <small>
              {review.customer_name}
              {review.verified_purchase ? " · Verified purchase" : ""}
            </small>
          </article>
        ))}
      </div>
    </main>
  );
}
