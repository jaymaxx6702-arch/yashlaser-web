"use client";
import { useEffect, useState, type FormEvent } from "react";
import { products } from "@/data/catalog";
import type { UiLanguage } from "@/lib/i18n";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  verified_purchase: boolean;
};

const copy = {
  en: {
    eyebrow: "Customer reviews", title: "What customers say.", product: "Product", select: "Select a product",
    name: "Your name", rating: "Rating", review: "Review", submit: "Submit review",
    submitted: "Review submitted for moderation.", error: "Unable to submit review.", verified: "Verified purchase",
  },
  gu: {
    eyebrow: "ગ્રાહક રિવ્યૂ", title: "ગ્રાહકો શું કહે છે.", product: "પ્રોડક્ટ", select: "પ્રોડક્ટ પસંદ કરો",
    name: "તમારું નામ", rating: "રેટિંગ", review: "રિવ્યૂ", submit: "રિવ્યૂ સબમિટ કરો",
    submitted: "રિવ્યૂ મંજૂરી માટે સબમિટ થયો.", error: "રિવ્યૂ સબમિટ થઈ શક્યો નથી.", verified: "ચકાસેલ ખરીદી",
  },
  hi: {
    eyebrow: "ग्राहक रिव्यू", title: "ग्राहक क्या कहते हैं.", product: "प्रोडक्ट", select: "प्रोडक्ट चुनें",
    name: "आपका नाम", rating: "रेटिंग", review: "रिव्यू", submit: "रिव्यू सबमिट करें",
    submitted: "रिव्यू मॉडरेशन के लिए सबमिट हुआ.", error: "रिव्यू सबमिट नहीं हो सका.", verified: "सत्यापित खरीद",
  },
  mr: {
    eyebrow: "ग्राहक रिव्ह्यू", title: "ग्राहक काय म्हणतात.", product: "प्रॉडक्ट", select: "प्रॉडक्ट निवडा",
    name: "तुमचे नाव", rating: "रेटिंग", review: "रिव्ह्यू", submit: "रिव्ह्यू सबमिट करा",
    submitted: "रिव्ह्यू मंजुरीसाठी सबमिट झाला.", error: "रिव्ह्यू सबमिट करता आला नाही.", verified: "पडताळलेली खरेदी",
  },
} as const;

export function ReviewsClient({ lang = "en" }: { lang?: UiLanguage }) {
  const t = copy[lang];
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
    setStatus(response.ok ? t.submitted : result.error || t.error);
  }

  return (
    <>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1>{t.title}</h1>

      <form className="project-form" onSubmit={submit}>
        <label>
          {t.product}
          <select name="productId" defaultValue="" required>
            <option value="" disabled>{t.select}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.name}
          <input name="name" required />
        </label>
        <label>
          {t.rating}
          <select name="rating" defaultValue="5">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} / 5</option>
            ))}
          </select>
        </label>
        <label>
          {t.review}
          <textarea name="review" rows={4} required />
        </label>
        <button className="button">{t.submit}</button>
        {status && <p role="status">{status}</p>}
      </form>

      <div>
        {reviews.map((review) => (
          <article key={review.id} className="admin-card">
            <strong>{"★".repeat(review.rating)}</strong>
            <p>{review.review_text}</p>
            <small>
              {review.customer_name}
              {review.verified_purchase ? " · " + t.verified : ""}
            </small>
          </article>
        ))}
      </div>
    </>
  );
}
