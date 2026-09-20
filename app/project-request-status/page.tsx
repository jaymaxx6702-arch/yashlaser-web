import type { Metadata } from "next";
import { ProjectRequestStatusClient } from "@/components/ProjectRequestStatusClient";

export const metadata: Metadata = {
  title: "Track project request",
  robots: { index: false, follow: false },
};

export default async function ProjectRequestStatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const requestNo = typeof query.request === "string" ? query.request : "";
  const token = typeof query.token === "string" ? query.token : "";

  return (
    <main id="main-content" className="container section">
      <ProjectRequestStatusClient
        initialRequestNo={requestNo}
        initialToken={token}
      />
    </main>
  );
}
