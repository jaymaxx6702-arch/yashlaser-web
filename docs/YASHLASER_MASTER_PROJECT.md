# YASH LASER WEBSITE - MASTER PROJECT FILE

> **એક જ Source of Truth:** Website planning, development backlog, checklist, current status અને new-chat handoff માટે આ જ ફાઇલ વાપરવી.

| Field | Value |
|---|---|
| Project | Yash Laser - All India Personalised Acrylic Commerce Platform |
| Main Store | `shop.yashlaser.in` |
| Existing Brand Site | `www.yashlaser.in` |
| Internal Operations | YashFlow |
| Future Bulk ID Portal | `id.yashlaser.in` અથવા final approved subdomain |
| Technology | Next.js + Supabase + Vercel |
| Master File Version | 1.6 |
| Last Updated | 26 September 2026 |
| Current Active Task | **YL-041 - Universal customisation data contract/rule foundation freeze કરવું** |
| Overall State | Wave 1 foundation implementation PR #6માં verified; main/production merge pending |

---

## 1. આ ફાઇલ કેવી રીતે વાપરવી

આ editable Markdown file projectની canonical working file છે. તેને website repositoryમાં નીચેના path પર રાખવી:

`docs/YASHLASER_MASTER_PROJECT.md`

### Status Rules

- `[x]` = કામ verify કરીને પૂર્ણ થયું.
- `[ ] [IN PROGRESS]` = કામ હાલમાં ચાલુ છે.
- `[ ] [BLOCKED]` = બહારની approval, credential અથવા business decision વગર આગળ નહીં વધી શકે.
- `[ ]` = કામ શરૂ કરવાનું બાકી છે.

### Update Rules

1. કોઈ task verify થયા વગર `[x]` ન કરવો.
2. Task પૂર્ણ થયા પછી checkbox, dashboard count, Current Active Task અને Change Log ચારેય update કરવા.
3. જૂના task delete ન કરવા; scope બદલાય તો task નીચે note લખવી.
4. નવા task માટે આગળનો ID `YL-101`, `YL-102` પ્રમાણે આપવો.
5. દરેક coding sessionના અંતે આ ફાઇલ project repositoryમાં commit કરવી.
6. નવી ChatGPT chatમાં આ ફાઇલ attach/mention કરીને Section 14નો handoff prompt મોકલવો.

---

## 2. Project Vision

Yash Laserની website ફક્ત online catalogue નહીં રહે. તે customerને product શોધવાથી લઈને personalisation, preview, quantity pricing, delivery, order, proof approval, production tracking, dispatch, review અને reorder સુધીની complete journey આપશે.

### ત્રણ મુખ્ય systems

| System | મુખ્ય જવાબદારી | Source of Truth |
|---|---|---|
| Shop | Customer-facing catalogue, customisation, cart, checkout, payment, tracking | Customer અને commercial order data |
| Yash ID | School/college/company bulk ID data, photos, validation, proof, repeat-year workflow | Bulk ID project data |
| YashFlow | Production, tasks, inventory, QC, packing, billing અને dispatch | Internal operations |

### Core Flow

`Customer -> Product/Project -> Personalisation -> Price -> Cart/Quote -> Checkout -> Order -> Proof -> YashFlow -> Production -> QC -> Dispatch -> Review/Reorder`

---

## 3. Locked Business Decisions

- Launch focus: personalised **Acrylic** products.
- Standard premium material: **6 mm Acrylic**.
- Printed acrylic products: **HD Print** standard.
- MDF, Metal અને LED launch scopeમાં નહીં, જ્યાં સુધી અલગથી approve ન થાય.
- Physical Product, Use Case, Design Template, Language અને Customisation અલગ entities રહેશે.
- એક physical productને અલગ use casesમાં tags/templatesથી બતાવવો; duplicate listings બનાવવી નહીં.
- Website UI languages: English, Gujarati, Hindi અને Marathi.
- Print Language customerની UI languageથી independent રહેશે.
- Customer-facing Shop અને internal YashFlow વચ્ચે controlled API integration રહેશે.
- Bulk ID workflow main Shopના ભારે form તરીકે નહીં; dedicated Yash ID portalમાં રહેશે.
- Price, size, weight, lead time અથવા delivery જેવી unverified business values guess કરવી નહીં.
- Payment production webhook verify થયા પછી જ `PAYMENTS_ENABLED=true` કરવું.
- Historical order/payment/proof records overwrite અથવા hard-delete ન કરવા.
- WhatsApp communication channel છે; order/proof/paymentનું source of truth નહીં.

---

## 4. Product Architecture

### Main Product Families

1. Awards & Trophies
2. Medals & Badges
3. Photo & Standee
4. Name Plates & Signs
5. Business QR & Counter Products
6. Desk & Office Products
7. ID Card Solutions
8. Keychains & Small Personalised Products
9. Event & Function Products
10. Corporate & Institutional Products
11. Custom Acrylic / Upload Your Idea

### High-value guided journeys

- Plan My Event
- Bulk Orders
- Custom Acrylic Request
- Corporate/Institutional Quote
- Yash ID bulk project
- Reorder / Repeat Project

### Core data entities

`Product`, `Product Family`, `Use Case`, `Template`, `Language`, `Option`, `Variant`, `Pricing Rule`, `Customer`, `Organisation`, `Project`, `Cart`, `Order`, `Order Item`, `Payment`, `Proof`, `File`, `Shipment`, `Review`, `Support Ticket`, `YashFlow Mapping`.

### Existing Digital Showroom Migration

- Existing Yash Laser Digital Showroom catalogueને new Shop catalogueમાં migrate કરવાનું છે.
- Preferred source: CSV/Excel export; unavailable હોય તો safe read-only extraction/import.
- Migration fields: product name, price, category, images, description, variants, SKU/code અને specifications.
- Migration દરમિયાન duplicate Gujarati/language listingsને separate product ન બનાવી, Product + Use Case + Template modelમાં map કરવી.
- Admin credentials અથવા OTP chat/fileમાં લખવા નહીં; authentication user પોતે private રીતે enter કરે.

---

## 5. Customer-facing Page Map

- Homepage
- Shop / All Products
- Product Family pages
- Shop by Need
- Product Detail + Configurator
- Search + Filters
- Cart
- Checkout
- Order Confirmation
- Track Order
- Customer Account
- Saved Designs / Reorder
- Bulk Orders
- Plan My Event
- Custom Acrylic
- Reviews / Customer Work Gallery
- Support / Contact
- About Yash Laser
- FAQ
- Privacy Policy
- Terms & Conditions
- Shipping & Delivery Policy
- Return / Refund / Replacement / Cancellation Policy

---

## 6. Admin and Operations Modules

- Product and category management
- Product options, variants, templates and images
- Pricing and quantity slabs
- Orders and order items
- Proof versions and approval
- Payments and invoice reconciliation
- Project / bulk / event requests
- Reviews moderation
- Customer support tickets
- Customers and organisations
- YashFlow sync and product mapping
- Shipping, package and tracking
- Analytics and reports
- Role-based access and audit log

---

## 7. Current Verified Snapshot

Latest known application health:

`commerce=true | yashflow=true | payments=false | analytics=false`

20 September 2026 connection verification:

- GitHub repository `jaymaxx6702-arch/yashlaser-web`, branch `main`, read/write connection verified.
- Latest `main` commit માટે Vercel status `success` verified.
- `shop.yashlaser.in` Vercel પર live છે અને HTTPS/security headers સાથે respond કરે છે.
- Homepage, Products, Gujarati, Hindi, Marathi, Cart, Checkout, Track Order, Admin, Sitemap અને Robots routes `200 OK` આપે છે.
- `/api/health` live છે અને expected feature-flag state આપે છે.
- Supabase-backed `/api/reviews` read request `200 OK` આપે છે; Supabase server connection configured છે.
- Pincode API valid input માટે manual-confirmation response અને invalid input માટે `400` validation આપે છે.
- Current work scope website-only છે; YashFlow appના code/featuresમાં અત્યારે ફેરફાર કરવાના નથી.
- 22 September 2026 final production CIમાં lint, production build, offline verification, production-server boot અને route/API smoke verification બધું pass થયું.
- Final smoke report: **487 explicit routes, 1,148 linked routes, 382 redirects, failures 0**.
- Stage 19 audit દરમિયાન environment template, bounded public JSON APIs, secure customer/admin cookies, private-route noindex/no-store/no-referrer headers અને language-switch query preservation harden કરાયું.

Known completed foundation:

- Shop commerce/order foundation codeમાં ઉપલબ્ધ છે.
- Guest order creation, secure tracking અને proof workflow foundation ઉપલબ્ધ છે.
- Admin commerce modules ઉપલબ્ધ છે.
- Shop-to-YashFlow end-to-end integration test સફળ થયો છે.
- હાલ manual **Sync / Retry YashFlow** safe rollout method છે.
- લગભગ 350 Shop products active YashFlow mapping સાથે configured છે.
- Unsupported products intentionally unmapped રાખવામાં આવ્યા છે.
- Homepageમાં Bulk Orders, Plan My Event અને Custom Acrylic entry paths છે.
- Footerમાં Reviews, Track Order અને Customer Account links છે.
- Checkoutમાં pincode delivery check છે.
- English, Gujarati, Hindi અને Marathi localisation code push થયું છે.
- Stage 19 multilingual/product-detail/security hardening `main`માં merge થઈ ગયું છે; merge commit `95bf0d708f416a845f660cfd7c07fa30fdce3e45` માટે GitHub main CI અને Vercel production deployment બંને `success` verified છે.

> **Verification note:** 22 September 2026 reconciliationમાં latest `main` source, successful production CI/deploy અને route/API smoke verification ફરી ચકાસવામાં આવ્યા.

---

## 8. Master Task Dashboard

| Status | Count |
|---|---:|
| Completed | 31 |
| In Progress | 10 |
| Blocked | 4 |
| Pending | 78 |
| **Total** | **123** |

### Reconciled open-work count — 22 September 2026

- Master checklistમાં કુલ **92 open tasks** છે: 10 In Progress + 78 Pending + 4 Blocked.
- તેમાં **YL-052 (Yash ID)** અને **YL-068 to YL-071, YL-073 to YL-074 (YashFlow-specific)** જેવા 7 non-direct-Shop open tasks અલગ ગણીએ તો `shop.yashlaser.in` માટે **85 direct website tasks open** છે.
- આ 85માંથી 4 provider/business-input blocked tasks (YL-061 to YL-064) કાઢીએ તો **81 actionable website tasks** અત્યારે આગળ લઈ શકાય.
- YL-101 to YL-123 અગાઉની website planning/chatમાં ચર્ચાયેલા પણ 100-task masterમાં explicit ન રહેલા useful features ઉમેરે છે.
- આ count conservative છે: code foundation થયેલા પરંતુ production flag/business approval/full browser QA વગરના tasks Done mark કર્યા નથી.

### Locked execution roadmap — rework ઓછું રાખવા dependency order

**Rule:** task IDs priority બતાવતા નથી; નીચેનો execution order dependency પ્રમાણે follow કરવો. Foundation stable થયા પહેલાં mass catalogue, provider-specific AI, complex admin UI અથવા marketing automation build ન કરવી.

#### Wave 1 — Shared contracts & reusable foundation (સૌથી પહેલા)

1. **YL-023** — Photo Standee સહિત 3 seed productsનું સાચું data freeze કરવું; આ pilot data રહેશે.
2. **YL-041 + YL-042** — universal customisation document/schema અને field-rule contract freeze કરવું.
3. **YL-046 + YL-047** — original/preview/proof/production-file version states, private upload, validation અને access rules stable કરવું.
4. **YL-108** — AI provider/model abstraction, privacy, retention, cost/timeout/retry contract પહેલા define કરવું; કોઈ single vendor સાથે UI/API hard-code ન કરવું.
5. **YL-110 (foundation part)** — Admin Field/Rule Builder માટે schema/API contract એ જ YL-042 rules પરથી રાખવો.
6. આ wave પૂરી થાય ત્યાં સુધી DB/API changes additive રાખવા અને regression tests લખવા.

#### Wave 2 — AI Photo Engine + Photo Standee pilot

7. **YL-101 → YL-106** — quality check → background remove → manual refine → upscale/correction → smart crop/position → canvas/mockup integration.
8. **YL-109** — print-quality validation, original retention, approved version lock અને proof handoff.
9. Photo Standee end-to-end perfect થયા પછી જ AI engineને બીજા productsમાં reuse કરવો.
10. **YL-107** design/layout suggestions core engine stable થયા પછી જ; AI suggestion customerની final approval replace નહીં કરે.

#### Wave 3 — Product/Admin system એકવાર બનાવો, પછી catalogue expand કરો

11. **YL-024 + YL-110** — Admin Product Creation Wizard + reusable field/rule builder complete કરવું.
12. **YL-013 → YL-020 + YL-025** — size/variant/price/lead-time/weight/images/templates/duplicates/import-export data pipeline.
13. **YL-012** — ઉપરનું schema stable થયા પછી full sellable catalogue reconcile/migrate કરવું; mass product edits પહેલાં નહીં.
14. **YL-021 + YL-022** — unsupported products safe-routing rules.
15. **YL-111 + YL-112** — Name Plate configurator અને Business QR generator એ જ generic rule engine પરથી બનાવવાના.

#### Wave 4 — Bulk/Event/Project personalisation reuse

16. **YL-043 → YL-045** — Same-for-All / Different-for-Each, CSV/Excel batch input, photo filename matching.
17. **YL-048 → YL-051 + YL-113 + YL-114** — Bulk, Event, Custom Acrylic, secure request tracking, event groups અને design sharing.
18. આ waveમાં નવી upload/storage system ન બનાવવી; Wave 1ની same file/version pipeline reuse કરવી.

#### Wave 5 — Customer/Admin operating layer

19. **YL-057 → YL-059 + YL-081 + YL-082** — production auth, account claim/history, reviews, support.
20. **YL-115 → YL-118 + YL-120** — notification engine, organisation accounts, CRM/follow-up, retention અને multi-channel order dashboard.
21. Notifications/event logs માટે shared event bus/outbox pattern રાખવો જેથી WhatsApp/Email/SMS માટે separate business logic duplicate ન થાય.

#### Wave 6 — Hardening, analytics, SEO, UX polish

22. **YL-083 → YL-092** — rate limit, analytics/events, SEO/hreflang, performance, accessibility, security, private-upload isolation, device/browser regression.
23. **YL-034 + YL-037 + YL-039 + YL-040** — translation, mobile UX, search/filter, 404/loading/empty states final polish.
24. Analytics instrumentation stable flows પર જ final કરવી જેથી event names/schema વારંવાર ન બદલવા પડે.

#### Wave 7 — Integrations & physical fulfilment

25. **YL-068 → YL-074** — YashFlow mapping/sync edge cases/admin maintenance/audit alerts, website core stable થયા પછી.
26. **YL-061 → YL-064** — Payment/Courier provider credentials/business decision મળ્યા પછી જ provider-specific implementation.
27. **YL-119** — multi-box shipping, damage evidence અને replacement flow courier/order foundation stable થયા પછી.

#### Wave 8 — Launch verification

28. **YL-075 → YL-080** — final legal/business content approvals.
29. **YL-095 → YL-100** — full E2E, seed real order, first-order manual review, monitoring, runbook અને public launch.
30. **YL-010** release/version/rollback procedure Wave 8માં final freeze કરવી; base mechanism earlier maintain કરવો.

#### Wave 9 — Smart selling / growth after stable core

31. **YL-121 → YL-123** — campaign/coupon attribution, natural-language recommendations, AI Event Planner.
32. **YL-052** Yash ID separate portal plan; Shop launch architecture reuse થાય ત્યાં સુધી separate implementation શરૂ ન કરવી.

### Build-once principles

- **One product schema:** size, option, custom fields, AI requirements, pricing hooks અને production mapping માટે એક shared contract.
- **One customizer engine:** product પ્રમાણે config બદલાય; separate product-specific editors નહીં.
- **One image pipeline:** original → quality analysis → optional AI processing → editable preview → approved proof/production asset.
- **One file/security pipeline:** signed/private upload, validation, retention અને versioning બધે reuse.
- **One event/notification model:** order, quote, proof, support, follow-up માટે common events; channel adapters અલગ.
- **One admin rule builder:** developer વગર નવા products/custom fields/templates configure થઈ શકે.
- **Three seed products first:** pilot pass થયા વગર 370-product bulk changes નહીં.
- **Provider abstraction first:** AI/payment/courier vendor બદલે તો core UI/schema rewrite ન થાય.
- **Feature flags + additive migrations:** incomplete features safe OFF રાખવા; destructive rollback ટાળવો.
- **Tests with foundations:** shared contract બદલાય તો affected flows તરત fail થાય એવું automated coverage રાખવું.
- **Batch deploys:** related changes stagingમાં group કરીને CI/smoke પછી જ main merge; Vercel deploy cycles બચાવવી.

### Reference base

આ Master File નીચેના અગાઉના workને consolidate કરે છે:

- “Website Review” conversationના available decisions અને implementation progress.
- Website Master Planning Steps 1-31.
- Website Master Planning Part 2 Steps 32-73.
- Latest Pending/Completion Roadmap અને deployment handoff.
- Existing Digital Showroom catalogue migration decisions.

---

## 9. Master Implementation Checklist - 123 Tasks

### A. Governance, Architecture and Deployment - YL-001 to YL-010

- [x] **YL-001** Project vision, scope અને Phase-1 principle lock કરવું.
- [x] **YL-002** Shop, Yash ID અને YashFlowની responsibility boundary lock કરવી.
- [x] **YL-003** Next.js + Supabase + Vercel technology stack select કરવું.
- [x] **YL-004** GitHub `main` branchમાં current code backup રાખવો.
- [ ] [IN PROGRESS] **YL-005** Development, staging અને production configuration verify કરવી.
- [x] **YL-006** Live health response દ્વારા commerce/YashFlow/payment/analytics state બતાવવી.
- [x] **YL-007** Commerce feature foundation enable કરવી.
- [x] **YL-008** YashFlow integration feature foundation enable કરવી.
- [x] **YL-009** Environment variablesનું documented register બનાવવું; secrets fileમાં લખવા નહીં.
- [ ] **YL-010** Release checklist, version tag અને rollback procedure final કરવી.

### B. Catalogue, Product Master and Business Data - YL-011 to YL-025

- [x] **YL-011** Product Family + Use Case + Template architecture lock કરવી.
- [ ] [IN PROGRESS] **YL-012** Existing Digital Showroom સહિત તમામ sellable productsનું master catalogue reconcile/migrate કરવું.
- [ ] **YL-013** દરેક productનું actual size/variant data verify કરવું.
- [ ] **YL-014** Base price, option price અને quantity slabs verify કરવું.
- [ ] **YL-015** Product-wise production lead time verify કરવું.
- [ ] **YL-016** Packed weight, dimensions અને shipping class verify કરવી.
- [ ] **YL-017** Product images માટે crop, background, ratio અને thumbnail standard લાગુ કરવું.
- [ ] **YL-018** Product-specific design templates review અને publish કરવી.
- [ ] **YL-019** Duplicate product/use-case/language listings merge અથવા archive કરવી.
- [ ] **YL-020** Strong legacy Gujarati artworkને template collectionમાં migrate કરવું.
- [ ] **YL-021** 20 જેટલા unsupported products માટે production workflow define કરવો.
- [ ] **YL-022** Unsupported productsને workflow ready થાય ત્યાં સુધી auto-route ન થાય તે verify કરવું.
- [ ] **YL-023** Three seed productsનું complete end-to-end data validate કરવું.
- [ ] **YL-024** Admin Product Creation Wizardથી developer વગર product publish test કરવું.
- [ ] **YL-025** CSV/Excel-first catalogue import/export અને data validation report તૈયાર કરવી; fallback safe read-only migration રાખવી.

### C. Storefront, UX and Multilingual Experience - YL-026 to YL-040

- [x] **YL-026** Homepage discovery structure અને core category entry paths ઉમેરવા.
- [x] **YL-027** Homepage પર Bulk Orders entry path ઉમેરવો.
- [x] **YL-028** Homepage પર Plan My Event entry path ઉમેરવો.
- [x] **YL-029** Homepage પર Custom Acrylic entry path ઉમેરવો.
- [x] **YL-030** Footerમાં Reviews, Track Order અને Customer Account links ઉમેરવા.
- [x] **YL-031** English/Gujarati/Hindi/Marathi routes productionમાં verify કરવી.
- [x] **YL-032** Product Detail Pageનું multilingual polish live verify કરવું.
- [x] **YL-033** Language switch current product/category route જાળવે છે તે test કરવું.
- [ ] **YL-034** Mixed/awkward translations, labels અને system messages cleanup કરવું.
- [x] **YL-035** Cart foundation complete કરવી.
- [x] **YL-036** Checkout foundation complete કરવી.
- [ ] [IN PROGRESS] **YL-037** Mobile navigation, product configurator અને checkout polish કરવું.
- [x] **YL-038** Checkoutમાં pincode delivery check ઉમેરવું.
- [ ] **YL-039** Search, filters, zero-result fallback અને recommendation behaviour final કરવું.
- [ ] **YL-040** 404, error, loading અને empty states complete કરવી.

### D. Customisation, Bulk, Event and File Workflows - YL-041 to YL-052

- [ ] [IN PROGRESS] **YL-041** Universal product customisation engine complete કરવું.
- [ ] **YL-042** Text, name, date, logo, photo અને QR inputs product rulesથી ચલાવવા.
- [ ] **YL-043** Same for All અને Different for Each modes complete કરવું.
- [ ] **YL-044** Excel/CSV bulk upload template અને validation complete કરવી.
- [ ] **YL-045** Photo filename-to-record auto-match અને error dashboard બનાવવું.
- [ ] **YL-046** Preview, proof અને approved production fileને અલગ versioned statesમાં રાખવા.
- [ ] **YL-047** Upload file type, size, retry, privacy અને private access test કરવું.
  - AI photo-processing expansion YL-101 to YL-109માં separately tracked છે જેથી background removal/upscale/correction જેવી requirements broad taskમાં ખોવાય નહીં.
- [ ] [IN PROGRESS] **YL-048** Bulk Orders request form production flagથી enable અને test કરવો.
- [ ] [IN PROGRESS] **YL-049** Plan My Event submit-to-admin workflow enable અને test કરવો.
- [ ] [IN PROGRESS] **YL-050** Custom Acrylic request submit-to-admin workflow enable અને test કરવો.
- [ ] **YL-051** Request number, customer confirmation અને admin follow-up flow test કરવો.
- [ ] **YL-052** Yash ID portal Phase-1 requirements અને repository plan separately freeze કરવો.

### E. Orders, Customer Accounts, Payment and Shipping - YL-053 to YL-064

- [x] **YL-053** Guest checkout અને order creation foundation complete કરવી.
- [x] **YL-054** Secure token-based Track Order foundation complete કરવી.
- [x] **YL-055** Customer-facing order status foundation complete કરવી.
- [x] **YL-056** Proof version, approve/reject અને approval status foundation complete કરવી.
- [ ] **YL-057** Supabase Auth Site URL, redirect URLs અને production auth mode verify કરવો.
- [ ] **YL-058** Guest order secure account-claim flow positive/negative cases સાથે test કરવો.
- [ ] **YL-059** Account order history, proof, tracking, saved design અને reorder test કરવું.
- [x] **YL-060** Admin commerce/order modules foundation complete કરવી.
- [ ] [BLOCKED] **YL-061** Payment provider અને merchant account business decision final કરવો.
- [ ] [BLOCKED] **YL-062** Payment keys, webhook, idempotency, failure/retry/refund flow implement અને test કરવો.
- [ ] [BLOCKED] **YL-063** Courier/shipping provider અને commercial rate rules final કરવા.
- [ ] [BLOCKED] **YL-064** Courier serviceability, rate, AWB, label, tracking અને exception flow implement કરવો.

### F. YashFlow Integration and Production Operations - YL-065 to YL-074

- [x] **YL-065** Shop Adminમાંથી manual Sync / Retry YashFlow flow ઉપલબ્ધ કરવો.
- [x] **YL-066** Shop-to-YashFlow end-to-end integration test pass કરવો.
- [x] **YL-067** 350 active Shop productsનું YashFlow mapping configure કરવું.
- [ ] **YL-068** Unsupported product mapping/process final કરવો.
- [ ] **YL-069** Stable launch પછી optional background automatic sync design કરવું.
- [ ] **YL-070** Missing mapping, downtime, duplicate retry અને partial failure handling test કરવું.
- [ ] **YL-071** Product mapping maintenance માટે admin UI બનાવવી.
- [x] **YL-072** Website orderને structured YashFlow orderમાં મોકલવાની foundation complete કરવી.
- [ ] **YL-073** Shop status, proof, production અને dispatch status sync edge cases verify કરવી.
- [ ] **YL-074** Sync audit log, failed queue, retry report અને admin alerts complete કરવું.

### G. Reviews, Support, Trust and Legal - YL-075 to YL-082

- [ ] **YL-075** Terms & Conditions page business review સાથે publish કરવી.
- [ ] **YL-076** Shipping & Delivery Policy publish કરવી.
- [ ] **YL-077** Return / Refund / Replacement / Cancellation policy publish કરવી.
- [ ] **YL-078** Proof approval પછી design-change/remake responsibility policyમાં સ્પષ્ટ કરવી.
- [ ] **YL-079** Customisation, photo quality, proof, lead time, shipping, bulk, payment અને returns FAQ publish કરવી.
- [ ] **YL-080** Business name, address, contact અને GST/invoice details verify કરવી.
- [ ] [IN PROGRESS] **YL-081** Reviews submission, moderation, verified badge અને public display enable/test કરવું.
- [ ] [IN PROGRESS] **YL-082** Support ticket create, admin response અને order-linked complaint flow enable/test કરવો.

### H. Security, Analytics, SEO, Performance and QA - YL-083 to YL-092

- [ ] **YL-083** Public endpoints પર rate limits enable કરીને abuse અને normal-flow test કરવું.
- [ ] **YL-084** Production analytics enable કરવું.
- [ ] **YL-085** Search, product view, add-to-cart, checkout અને order completion events verify કરવા.
- [ ] **YL-086** Titles, descriptions, canonical, Open Graph, sitemap અને robots verify કરવા.
- [ ] **YL-087** Multilingual canonical/hreflang અને duplicate-content strategy test કરવી.
- [ ] **YL-088** Core Web Vitals, images, lazy-loading અને JS bundle optimise કરવું.
- [ ] **YL-089** Keyboard, form labels, focus, contrast, errors અને alt-text accessibility audit કરવી.
- [ ] **YL-090** Admin auth, RLS, role permissions, server-only secrets અને audit logs security test કરવું.
- [ ] **YL-091** Private uploads, signed URLs, file validation અને customer/org isolation test કરવું.
- [ ] **YL-092** Android Chrome, Desktop Chrome, Edge અને common screen widths regression test કરવું.

### I. Deployment, Launch and Monitoring - YL-093 to YL-100

- [x] **YL-093** Latest GitHub `main` commit productionમાં deploy/redeploy કરીને deployment success verify કરવું.
- [x] **YL-094** Deploy પછી homepage, products, product detail, cart, checkout અને ચાર languages smoke test કરવી.
- [ ] **YL-095** Complete end-to-end QA: product -> order -> proof -> YashFlow -> production -> dispatch ચલાવવું.
- [ ] **YL-096** Controlled seed real orderથી payment વગર/manual-confirmation launch flow verify કરવો.
- [ ] **YL-097** First 10 real orders owner/admin દ્વારા manually review કરવા.
- [ ] **YL-098** First 30 days માટે errors, conversion, search, order, sync અને support monitoring ચલાવવું.
- [ ] **YL-099** Final launch runbook, rollback, support ownership અને issue-priority matrix freeze કરવી.
- [ ] **YL-100** Soft launch પછી blockers fix કરીને public launch approve કરવો.

### J. AI Photo and Intelligent Customisation - YL-101 to YL-109

- [ ] [IN PROGRESS] **YL-101** Uploaded photo માટે resolution, DPI suitability, blur, exposure, contrast અને basic face/person quality analysis foundation બનાવવી; low-quality input માટે clear warning આપવી.
- [ ] **YL-102** AI background removal અને subject cutout pipeline implement કરવી; transparent PNG/WebP output અને failure fallback રાખવો.
- [ ] **YL-103** Automatic cutout ખોટું હોય ત્યારે manual refine tools: erase, restore, edge/brush adjustment, undo/reset અને original-vs-edited comparison ઉમેરવું.
- [ ] **YL-104** AI image enhancement/upscale pipeline: resolution upscale, sharpness, noise reduction, lighting, white-balance/color correction અને face-safe enhancement implement કરવી; over-processing ટાળવું.
- [ ] **YL-105** Subject/face-aware smart crop, auto-centering અને product safe-area positioning બનાવવું; customerને manual crop/zoom/position override હંમેશા આપવો.
- [ ] **YL-106** AI-processed imageને existing customizer canvasમાં non-destructive રીતે integrate કરીને cutout/silhouette અને realistic product mockup preview બનાવવો.
- [ ] **YL-107** Product/category પ્રમાણે optional AI design assistance: suitable template, layout, text placement અને style suggestions આપવી; customerની explicit selection વગર design auto-final ન કરવું.
- [ ] **YL-108** AI provider/model abstraction, browser/server execution choice, privacy/consent, file-retention rules, cost/usage limits, timeout/retry અને provider-failure fallback define/test કરવું.
- [ ] **YL-109** AI preview અને production file વચ્ચે strict separation રાખીને final print-quality validation, original source retention, approved version lock અને proof handoff verify કરવું.

### K. Advanced Commerce, Admin and Customer Experience - YL-110 to YL-121

- [ ] **YL-110** Admin Customisation Field/Rule Builder બનાવવો જેથી developer વગર product માટે photo, text, name, date, logo, QR, size, colour, required/optional fields અને validation rules configure થઈ શકે.
- [ ] **YL-111** Name Plate advanced configurator: width × height/shape/material-based pricing rules, profession/business templates, multilingual preview અને minimum-size validation support કરવું.
- [ ] **YL-112** Business QR Generator suite બનાવવી: UPI, Google Review, WhatsApp, website/menu/Wi-Fi QR types, QR preview/download અને QR-based acrylic product templates સાથે integration.
- [ ] **YL-113** Advanced event personalisation: Winner/Runner-up/Participant/VIP/Guest/Committee વગેરે recipient groups, Same Design–Different Text, group quantities અને repeat-event reuse support કરવું.
- [ ] **YL-114** Saved custom design/projectને secure share link અને printable/shareable summary PDF દ્વારા customer/colleague સાથે share કરવાની facility બનાવવી; token expiry/revoke controls રાખવા.
- [ ] **YL-115** Customer Notification Engine બનાવવું: order/proof/quote/payment-required/missing-data/dispatch/support events માટે multilingual Email + WhatsApp + optional SMS templates, retry, dedupe અને delivery audit.
- [ ] **YL-116** Organisation/Corporate account features: saved brand kit/logo, approved templates, PO upload, organisation-specific terms/pricing hooks અને repeat approved design workflow બનાવવો.
- [ ] **YL-117** CRM/Lead follow-up pipeline: source, owner, priority, next follow-up date, activity history, duplicate lead merge, lost/dormant reason અને quote-to-order conversion tracking.
- [ ] **YL-118** Automated follow-up/retention flows: abandoned cart, saved-design reminder, quote reminder, annual-event repeat reminder અને approved-repeat project nudges with frequency caps/opt-out.
- [ ] **YL-119** Advanced shipping/damage/replacement workflow: multi-box shipment, box-level tracking, damage complaint with photo/video/quantity/box-condition evidence અને linked replacement order.
- [ ] **YL-120** Multi-channel Order Dashboard બનાવવો જેથી Website, Quote, WhatsApp/manual અને Offline-origin commercial orders source label સાથે એક admin viewમાં search/filter/manage થઈ શકે.
- [ ] **YL-121** Campaign/Coupon/Attribution foundation: coupon rules/audit, UTM/referral source, offline QR source tracking અને campaign-to-lead/cart/order conversion reporting; discount stacking business rules explicit રાખવા.

### L. AI Discovery and Guided Selling - YL-122 to YL-123

- [ ] **YL-122** Natural-language product search/recommendation layer બનાવવી જેથી customer use-case, quantity, budget અથવા occasion પ્રમાણે relevant products શોધી શકે; deterministic filters/fallback જાળવવા.
- [ ] **YL-123** AI-assisted Event Planner બનાવવો: event type, participants, budget અને required date પરથી suggested products/quantities/bundles આપવી; final price/availability server-validated data પરથી જ બતાવવી.

---

## 10. Blockers and Required User/Business Inputs

| Input | Blocks |
|---|---|
| Payment provider, merchant KYC અને production credentials | YL-061, YL-062 |
| Courier provider, API credentials અને commercial rules | YL-063, YL-064 |
| Verified prices, sizes, weights અને production lead times | YL-013 to YL-016, YL-023 |
| Return/refund/replacement/cancellation decisions | YL-077, payment/refund QA |
| Final business/GST/contact details | YL-080 |
| Production auth method: password, OTP અથવા magic link | YL-057 to YL-059 |
| AI provider/model choice, pricing/limits અને privacy terms | YL-102, YL-104, YL-108 (provider-dependent parts only) |
| Discount/coupon business rules | YL-121 |

### Safety rules while blocked

- Credentials, price અથવા dimensions guess ન કરવા.
- Payment flag false રાખવો.
- Live courier ન હોય ત્યાં delivery manual confirmation તરીકે બતાવવી.
- Unmapped products YashFlowમાં ખોટા workflowથી auto-sync ન કરવા.

---

## 11. Definition of Done

Website complete ત્યારે જ ગણાશે જ્યારે:

- Customer product શોધી અને યોગ્ય personalisation કરી શકે.
- AI photo tools enabled હોય ત્યારે original file સુરક્ષિત રહે, processing reversible હોય, customer override કરી શકે અને AI previewને production-ready file માનવામાં ન આવે જ્યાં સુધી final quality/proof validation pass ન થાય.
- Final server-validated price, quantity અને delivery information જોઈ શકે.
- Cart અને checkoutમાંથી duplicate વગર order બની શકે.
- Order secure રીતે track થઈ શકે.
- Required proof approve/reject થઈ શકે અને old proof locked રહે.
- Order structured રીતે YashFlow સુધી પહોંચે.
- Production, QC, packing અને dispatch trace થઈ શકે.
- Customer support, review અને reorder flows ચાલે.
- Multilingual, mobile, security, accessibility અને performance QA pass થાય.
- Live કરાયેલા payment/courier modules verified credentials અને real webhook/API tests સાથે pass થાય.
- કોઈ P0/P1 launch blocker open ન રહે.

---

## 12. Historical Planning Index

જૂની planning discussionsના મુખ્ય locked areas આ Master Fileમાં consolidate થયેલા છે:

- Steps 1-11: product families અને custom acrylic catalogue.
- Steps 12-20: navigation, customisation, pricing, checkout, accounts, event, homepage, UX અને search.
- Steps 21-31: admin, YashFlow, shipping, reviews/support, multilingual SEO, security, technology, analytics, marketing અને Phase-1 scope.
- Steps 32-42: execution roadmap, database, admin, sitemap, wireframes, account, event, bulk અને Yash ID.
- Steps 43-54: search, pricing, statuses, notifications, files, media, SEO content, QA, go-live, decision register અને development handover.
- Steps 55-64: sprints, pilot catalogue, product data, admin/order/quote/support/reviews/reorder workflows.
- Steps 65-73: inventory, capacity, batch planning, QC/dispatch, accounts, CRM, marketing, dealer/B2B અને RBAC.
- Remaining launch-readiness decisions હવે YL-001 to YL-123 implementation checklistમાં tracked રહેશે.

### Missing-feature reconciliation — 22 September 2026

- Earlier website/customisation discussionsમાંથી background removal, photo quality/upscale/correction, cutout refinement, smart crop, AI mockup/design help, QR generator, advanced event personalisation, shareable designs, notifications, corporate accounts, CRM/follow-up, shipping damage/replacement, multi-channel orders અને campaign attribution explicit tasks તરીકે YL-101 to YL-123માં ઉમેરાયા.
- Partner/dealer portal, white-label/API resale અને broad distributor ecosystem useful future ideas છે, પરંતુ current Shop launch backlogને unnecessarily inflate ન કરવા Post-launch Growth Backlogમાં જ રાખવામાં આવ્યા.
- AI tasks Photo Standeeને pilot product માનીને reusable engine તરીકે બનાવવાના; 370 products માટે separate AI logic લખવાનો નથી.

### Post-launch growth backlog

Launch stable થયા પછી existing planning પ્રમાણે D2C, B2B, corporate/school outreach, photo-studio/gift-shop partners, regional stockless digital distributors, referral/repeat programmes અને future Partner Portal prioritise કરવા. આ growth items Phase-1 launchના 100-task completion countમાં હાલ સામેલ નથી.

---

## 13. Change Log

### Version 1.6 - 26 September 2026

- Wave 1 foundation માટે draft PR #6 (`yl-041-customization-contract`) બનાવ્યો; main branch અને production deployment untouched રાખ્યાં.
- YL-041/042 foundationમાં versioned universal customisation rule contract ઉમેર્યો: photo, logo, text, name, date, QR, color, choice અને number field types; required/optional rules, limits, conditional visibility અને runtime-safe Admin/API validation.
- Existing customizer v1ને break કર્યા વગર template, quantity, text અને artwork validation shared contract પરથી ચલાવ્યું; generic `fieldValues` bridge ઉમેર્યો અને legacy saved drafts without `fieldValues` restore-compatible રાખ્યાં.
- YL-046/047 foundation માટે additive `shop_order_assets` schema અને lifecycle model ઉમેર્યું જેથી original, preview, proof અને production assets અલગ version/stateમાં track થઈ શકે; RLS/service-role-only access rules ઉમેર્યાં.
- Existing customer-artwork, proof અને project upload flows replace કર્યા નથી; production file format/provider details verify થયા વગર guess કર્યા નથી.
- YL-108 foundation માટે vendor-neutral AI provider policy ઉમેર્યો: capabilities, browser/server execution, first/third-party hosting, consent, retention, max input, timeout, retry અને estimated-cost contract.
- Regression tests ઉમેર્યાં અને draft PR CIમાં lint, production build, offline verification, production-server boot અને route/API smoke verification **success** થયા.
- Vercel branch builds Ignored Build Stepથી cancel થયા; production deploy થયો નથી.
- YL-041/042/046/047/108ને હજી Done mark કર્યા નથી; customer-visible dynamic field UI, live DB migration/apply, production upload path, 3 verified seed products અને provider-specific integration બાકી હોવાથી statuses unchanged રાખ્યાં.

### Version 1.5 - 22 September 2026

- 123-task checklistના IDs/status બદલીયા વગર dependency-based locked execution roadmap ઉમેર્યો જેથી repeated schema/UI/API rewrites ઓછા થાય.
- Current Active Task YL-041 કર્યો: પહેલા shared customisation data contract/rule foundation freeze થશે; AI customer-visible work તરત Wave 2માં ચાલુ રહેશે.
- AI પહેલાં YL-041/042/046/047/108/110 foundation અને 3 seed productsનો contract stable કરવાનો નિર્ણય લીધો.
- Full 370-product catalogue migration/custom data edits pilot customizer/AI engine stable થયા પછી કરવાના જેથી mass rework ટળે.
- Shared product schema, customizer, image pipeline, file/security pipeline, notification event model અને admin rule builder માટે build-once/reuse-everywhere principles lock કર્યા.
- AI/payment/courier provider abstraction, additive migrations, feature flags, automated regression tests અને batched staging deployments change-minimisation rules તરીકે lock કર્યા.

### Version 1.4 - 22 September 2026

- Earlier website chats સામે feature tally કરીને useful-but-missing requirements explicit task IDsમાં ઉમેર્યાં.
- YL-101 to YL-109 AI Photo/Intelligent Customisation માટે ઉમેર્યાં: quality analysis, background removal, manual cutout refine, upscale/enhancement/correction, smart crop/position, mockup integration, design assistance, provider/privacy limits અને production validation.
- YL-110 to YL-121 admin/customer/business workflow માટે ઉમેર્યાં: field builder, name-plate configurator, business QR generator, advanced event personalisation, secure design sharing, notifications, corporate accounts, CRM, automated follow-up, damage/replacement, multi-channel orders અને campaign attribution.
- YL-122 to YL-123 AI natural-language discovery અને AI Event Planner માટે future-capable but useful tasks ઉમેર્યાં.
- Current Active Task YL-101 set કર્યો જેથી AI Customisation workને rate-limit/analytics પહેલાં priority મળે.
- Partner/dealer/white-label ecosystem master launch countમાં ઉમેર્યો નથી; Post-launch Growth Backlogમાં જ રાખ્યો.
- Dashboard હવે **31 Completed, 10 In Progress, 4 Blocked, 78 Pending = 123 tasks** છે; direct Shop open work **85**, જેમાં provider/business blockers કાઢ્યા પછી **81 actionable** છે.

### Version 1.3 - 22 September 2026

- PR #2 (`stage19-multilingual`) audited કરીને `main`માં merge થયું; production merge commit: `95bf0d708f416a845f660cfd7c07fa30fdce3e45`.
- GitHub main CI અને Vercel production deployment success verify થયા.
- Final production-equivalent smoke verification: 487 explicit routes, 1,148 discovered linked routes, 382 redirects, failures 0.
- Environment template formatting, bounded request bodies, secure session cookies, private-route cache/referrer/indexing headers અને multilingual secure-link/query preservation harden કર્યા.
- YL-031, YL-032 અને YL-033 verified complete mark કર્યા.
- Reconciled dashboard: **31 Completed, 9 In Progress, 4 Blocked, 56 Pending**.
- Master-wide open work: **69 tasks**; direct `shop.yashlaser.in` open work: **62 tasks**; provider/business blockers કાઢ્યા પછી **58 actionable website tasks**.
- Business/provider/full-live verification વગરના legal, payment, courier, production-auth, analytics/rate-limit enablement અને full-browser QA tasks open જ રાખ્યા.

### Version 1.2 - 21 September 2026

- `docs/ENVIRONMENT.md` canonical environment register ઉમેર્યું અને YL-009 complete verify કર્યું; કોઈ secret values repositoryમાં ઉમેર્યા નથી.
- `stage19-multilingual` branch પર multilingual Header/Footer, utility pages, customer account routes, customizer routing/status copy અને public About/FAQ/Policy pagesનું code work આગળ વધાર્યું.
- Private customer/customizer routes માટે noindex સાથે `private, no-store` headers harden કર્યા.
- Provider-neutral payment foundationમાં secure order-token validation, server-derived outstanding balance અને adapter contract ઉમેર્યાં; real payment provider/webhook હજી blocked છે અને `PAYMENTS_ENABLED=false` જ રાખવાનું છે.
- Latest code validationમાં lint, production build અને offline route/security verification green થયા; final branch deploy/live verification Vercel availability પછી કરવાનું છે.
- YL-031/032/033/034, legal publish tasks અને payment/courier blocked tasksને production/business verification વગર Done mark કર્યા નથી.

### Version 1.1 - 20 September 2026

- GitHub `main` read/write connection અને latest commit verified.
- Vercel deployment success તથા live custom domain verified.
- Main website routes, multilingual routes, health API, Supabase read અને pincode validation smoke-tested.
- YL-093 અને YL-094 complete mark કર્યા; dashboard counts update કર્યા.
- Current Active Task YL-083 set કર્યો.
- Website-only scope confirmed; YashFlow app changes paused રાખ્યા.

### Version 1.0 - 19 September 2026

- Previous Yash Laser website planningને એક editable project fileમાં consolidate કર્યું.
- 100-task implementation checklist બનાવી.
- Latest known completion status મુજબ 25 Done, 12 In Progress, 4 Blocked અને 59 Pending mark કર્યા.
- Current active task YL-093 set કર્યો.
- New-chat continuation અને update protocol ઉમેર્યો.
- Website Review contextમાંથી Digital Showroom migration અને post-launch partner/marketing direction ઉમેર્યાં.

---

## 14. New Chat Continuation Block

નવી chat શરૂ કરતી વખતે આ Master File attach/mention કરીને નીચેનું લખાણ મોકલવું:

> **YashLaser Website continue. `YASHLASER_MASTER_PROJECT.md` ને Source of Truth માનો. પહેલાં Section 8નું Locked Execution Roadmap, Current Active Task, Dashboard અને છેલ્લો Change Log વાંચો. Task-ID order નહીં પરંતુ dependency-wave order follow કરો. હાલ Wave 1: YL-023 + YL-041/042 + YL-046/047 + YL-108 + YL-110 foundationથી શરૂ કરો; પછી Wave 2 AI Photo/Customisation. YashFlow appમાં અત્યારે changes ન કરો. કોઈ task verify થયા વગર Done mark ન કરો.**

### Current handoff

- Active: **YL-041 - Universal customisation data contract/rule foundation freeze.**\n- Working branch: **`yl-041-customization-contract`**, draft PR **#6**; latest Wave 1 foundation CI green, main merge pending.
- Current Wave: **Wave 1 shared foundation** — YL-023, YL-041/042, YL-046/047, YL-108, YL-110 foundation.
- Next Wave: **Wave 2 AI Photo Engine** — YL-101 to YL-106, YL-109; YL-107 પછી.
- Pilot product: **Photo Standee**, પછી વધુ 2 seed products; engine reusable રાખવો.
- Payments: OFF રાખવા.
- Analytics: હજી enable/test કરવાનું બાકી.
- YashFlow: manual Sync / Retry current safe method.
- Current known mapping: 350 active mapped products; unsupported products auto-route ન કરવા.
- Current scope: Websiteના બાકી બધા કામ પૂર્ણ કરવા; YashFlow appના changes અત્યારે નહીં.

---

## 15. Session End Checklist

દરેક ChatGPT/development sessionના અંતે:

- [ ] આજના code changes GitHubમાં push થયા?
- [ ] Vercel deployment state verify થયું?
- [ ] Live result smoke test થયું?
- [ ] પૂર્ણ tasks `[x]` mark થયા?
- [ ] Dashboard counts update થયા?
- [ ] Current Active Task આગળ ખસેડ્યો?
- [ ] Change Logમાં commit/deployment/result નોંધાયું?
- [ ] Updated Master File projectના `docs/` folderમાં save/commit થઈ?
- [ ] Updated Master Fileની backup version ઉપલબ્ધ છે?
