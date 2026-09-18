# Yash Laser migration — પૂર્ણતા નોંધ

- Imported products: 370; available products skipped: 0.
- 2 જૂના product URLs અગાઉથી 404 હતા; તેમની નોંધ source/unavailable.jsonમાં છે.
- Variants: 959; original prices જાળવ્યા; 30 products માટે price confirmation જરૂરી.
- Images: 440 migrated; 0 failures; 4 exact-byte duplicate image groups જાળવ્યા.
- Product duplicate candidates: 7 groups; કોઈ automatic deletion કર્યું નથી.
- Unique product slugs: 370; redirect mappings: 382.
- Manual review: 74 records (price, description, size unit અથવા duplicate અંગે).

| Category | Products |
|---|---:|
| awards | 319 |
| other | 24 |
| standees | 13 |
| name-plates | 7 |
| keychains | 3 |
| id-cards | 4 |

## Reusable command

```powershell
npm run migrate -- "C:\Users\pc\YashLaser-Old-Site"
```

Local mirrorમાં 7 HTML pages અને 0 complete product pages મળ્યાં. અગાઉ public siteમાંથી મેળવેલા 370 detailed records retain કર્યા. Script source IDs પ્રમાણે merge કરે છે; originals/backups, failures, image manifest, category reasons અને manual-review list અલગ રાખે છે.

## Website

Catalogue search/filter/pagination, six category routes, 370 product pages, galleries, variants, shared customization previews, customer details અને WhatsApp handoff કામ કરે છે. Business contact, sitemap, robots અને customization noindex ઉમેર્યાં.

Build, TypeScript, lint, 388 routes, 369 linked routes અને 382 redirects pass. Mobile photo preview, size pricing, navigation/search, draft reference અને reset browserમાં ચકાસ્યાં.

Supabase SQL/private upload integration તૈયાર છે, પણ project/credentials ન હોવાથી live database test બાકી છે. હાલ form WhatsApp draft તૈયાર કરે છે; તે server પર save અથવા આપમેળે send થતો નથી. Setup: docs/SETUP.md.
