# Yash ID — Phase 1 Requirements & Repository Plan

## Purpose

Yash ID is a separate bulk identity-card portal for schools, colleges, companies and institutions. It is intentionally not a large form inside `shop.yashlaser.in`.

Preferred public entry: `id.yashlaser.in` once the separate app is ready.

## Phase 1 scope

- Organisation/project registration
- Admin-approved project access
- Registration-only card personalisation; no unrestricted free-form customer canvas
- Mobile and desktop responsive data entry
- English, Gujarati, Hindi and Marathi UI
- Excel/CSV participant import
- Photo upload with filename-to-record matching
- Clear duplicate/missing-photo/error dashboard
- Approved template selection
- Field rules per template (name, ID/roll no, class/department, designation, blood group or other approved fields)
- Same design / different participant data
- Batch preview and proof generation
- Admin approval and correction workflow
- Repeat-year/repeat-project reuse without overwriting historical records
- Production handoff into YashFlow after approval

## Out of Phase 1

- Full Shop catalogue
- General ecommerce cart
- Public payment gateway
- Arbitrary design editor
- Marketing CRM automation
- School ERP replacement

## Repository plan

Create a separate repository/app when implementation begins, recommended name:

`yashlaser-id`

Architecture:

- Next.js
- Supabase
- Vercel
- private storage for participant photos/files
- server-side privileged database access only
- organisation/project-scoped authorization
- YashFlow integration through explicit project/order handoff

Do not copy Shop customer/order tables as the Yash ID source of truth. Reuse patterns and shared schemas only where contracts are genuinely common.

## Core entities

- Organisation
- Organisation Member
- ID Project
- Template
- Template Field Rule
- Participant Record
- Participant Photo
- Import Batch
- Validation Issue
- Proof Batch
- Approval
- Production Batch
- YashFlow Handoff
- Audit Event

## Data import contract

Preferred bulk template fields are project-defined. Every import must still include a stable record identifier.

Common examples:

- record_id
- name
- roll_no / employee_no
- class / department
- designation
- photo_filename

Rules:

- duplicate record IDs block import
- duplicate uploaded filenames are ambiguous and block matching
- missing referenced photos are errors
- unused photos are warnings
- original uploaded rows/files remain traceable after corrections
- re-import creates a new version/batch rather than silently overwriting approved history

## Security / privacy

- participant photos are private
- no public buckets
- signed upload/download access
- organisation/project isolation
- admin actions audited
- uploads have MIME/size limits
- production files derive from an approved proof/version
- no participant data is sent to an external AI service without an explicit future privacy decision

## Phase 1 customer flow

Organisation/project setup
→ choose approved ID template
→ import or enter participant data
→ upload/match photos
→ fix validation errors
→ batch preview
→ submit
→ Yash Laser review/proof
→ customer approval
→ production handoff
→ project status/history

## Phase 1 acceptance criteria

1. A project can be created without using the Shop cart.
2. 100+ participant records can be imported without manual one-by-one setup.
3. Filename matching shows missing/duplicate/unreferenced photo errors before submit.
4. Every participant remains linked to the correct photo and template version.
5. Customer can review a batch proof and request corrections.
6. Approved data cannot be silently replaced.
7. YashFlow receives only approved production-ready data.
8. A repeat project/year can reuse templates while retaining old history.

## Relationship to Shop

The Shop bulk personalisation tool (YL-043–045) handles normal personalised batches. Very large identity-card datasets should be routed to Yash ID once this separate app is implemented.
