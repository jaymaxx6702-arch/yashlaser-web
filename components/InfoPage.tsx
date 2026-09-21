import { infoPageCopy, type InfoPageKey } from "@/lib/info-pages";
import type { UiLanguage } from "@/lib/i18n";

export function InfoPage({
  page,
  lang = "en",
}: {
  page: InfoPageKey;
  lang?: UiLanguage;
}) {
  const content = infoPageCopy[lang][page];
  return (
    <main id="main-content" className="container section text-page" lang={lang}>
      <p className="eyebrow">{content.eyebrow}</p>
      <h1>{content.title}</h1>
      <p>{content.intro}</p>
      {content.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
    </main>
  );
}
