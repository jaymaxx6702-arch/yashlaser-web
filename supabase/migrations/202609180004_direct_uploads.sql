-- Alternatively use scripts/configure-private-uploads.mjs. No public policies added.
-- Existing stored objects are retained; this limits new uploads.
update storage.buckets set public=false,file_size_limit=8388608,
 allowed_mime_types=array['image/jpeg','image/png','image/webp']
 where id='customer-artwork';
