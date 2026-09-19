import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { ReviewModeration } from "@/components/ReviewModeration";

export default async function AdminReviewsPage() {
  await requireAdmin();
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_reviews")
    .select("id,product_id,customer_name,rating,review_text,status,verified_purchase,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <h1>Reviews</h1>
      {error ? (
        <p role="alert">Commerce migration is not applied yet, or reviews could not be loaded.</p>
      ) : (
        <div className="admin-list">
          {(data || []).map((review) => (
            <article className="admin-card" key={review.id}>
              <strong>{review.customer_name} · {review.rating}/5</strong>
              <span>Product: {review.product_id}</span>
              <p>{review.review_text}</p>
              <ReviewModeration
                reviewId={review.id}
                initialStatus={review.status}
              />
            </article>
          ))}
          {!data?.length && <p>No reviews yet.</p>}
        </div>
      )}
    </>
  );
}
