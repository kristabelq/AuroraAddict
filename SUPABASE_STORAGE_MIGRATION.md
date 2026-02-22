# ✅ Supabase Storage Migration Complete!

## What Was Migrated

I've successfully migrated your image uploads from local filesystem to **Supabase Storage**:

### Updated Files

1. **`src/lib/supabase/storage.ts`** ✨ NEW
   - Helper functions for uploading/deleting images
   - Automatic image optimization (resize, compress)
   - Thumbnail generation support
   - CDN-backed public URLs

2. **`src/app/api/sightings/create/route.ts`** ✅ UPDATED
   - Sighting images now upload to Supabase
   - Automatic thumbnails (400x400)
   - Full images (1920x1080 max)

3. **`src/app/api/user/profile/image/route.ts`** ✅ UPDATED
   - Profile pictures upload to Supabase
   - 400x400 square crop

4. **`src/app/api/hunts/create/route.ts`** ✅ UPDATED
   - Hunt cover images upload to Supabase
   - 16:9 landscape (1600x900)

5. **`src/app/api/hunts/[id]/route.ts`** ✅ UPDATED
   - Hunt cover image updates use Supabase

## 🔧 What You Need To Do

### Step 1: Create Storage Buckets in Supabase

Go to your Supabase Dashboard and create these buckets:

**URL**: https://supabase.com/dashboard/project/aogfvwugvdwtbucccjhb/storage/buckets

#### Create 3 Buckets:

1. **sightings**
   - Click "New bucket"
   - Name: `sightings`
   - Public: ✅ Yes
   - File size limit: 10 MB
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Click "Create bucket"

2. **profiles**
   - Name: `profiles`
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Click "Create bucket"

3. **hunts**
   - Name: `hunts`
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Click "Create bucket"

### Step 2: Set Up RLS Policies (Optional but Recommended)

For each bucket, you can set up Row Level Security policies:

**For `sightings` bucket:**
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload sightings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sightings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public read access for sightings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sightings');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own sightings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'sightings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**For `profiles` and `hunts`** - similar policies.

### Step 3: Add Service Role Key to Vercel (CRITICAL!)

**This is required for uploads to work in production!**

1. Go to Supabase Dashboard → **Project Settings** → **API**
   - URL: https://supabase.com/dashboard/project/aogfvwugvdwtbucccjhb/settings/api

2. Find **`service_role`** key (under "Project API keys")

3. Copy the key

4. Go to Vercel → **Environment Variables**
   - URL: https://vercel.com/kristabels-projects-486ca013/aurora-intel/settings/environment-variables

5. Add new variable:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [paste your service role key]
   - Environment: Production, Preview, Development
   - Click "Save"

6. **Redeploy** your app after adding the key

### Step 4: Test the Migration

Once buckets are created and deployed:

1. **Test sighting upload**: Post a new sighting with photos
2. **Test profile picture**: Update your profile image
3. **Test hunt creation**: Create a hunt with a cover image

All images should now be stored in Supabase Storage and load from the CDN!

## 📊 Benefits of This Migration

- ✅ **Production-ready**: Works on Vercel (no filesystem needed)
- ✅ **Persistent**: Images never lost on redeployment
- ✅ **Fast**: CDN-backed global delivery
- ✅ **Scalable**: Handle unlimited uploads
- ✅ **Free tier**: 1GB storage included
- ✅ **Automatic optimization**: Images resized and compressed
- ✅ **Thumbnails**: Automatically generated for grids

## 🔍 How Images Are Stored

### Before (Local Filesystem)
```
/public/uploads/sightings/user123-1234567890-abc.jpg
```
❌ Lost on every Vercel deployment

### After (Supabase Storage)
```
https://aogfvwugvdwtbucccjhb.supabase.co/storage/v1/object/public/sightings/user123/1234567890-abc.jpg
```
✅ Permanent, CDN-backed, fast

## 📁 Storage Structure

```
sightings/
  └── [userId]/
      ├── timestamp-random.jpg (full image)
      └── timestamp-random-thumb.jpg (thumbnail)

profiles/
  └── [userId]/
      └── timestamp-random.jpg

hunts/
  └── [userId]/
      └── timestamp-random.jpg
```

## 🚨 Important Notes

1. **Old images** in `/public/uploads/` will still work but are not in Supabase
2. **New uploads** after deployment will use Supabase Storage
3. **Service role key** is required for uploads to work in production
4. **Buckets must be created** before uploads will work

## ✅ Next Steps

1. ☐ Create the 3 storage buckets in Supabase
2. ☐ Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel
3. ☐ Commit and deploy these changes
4. ☐ Test uploads on production

Once complete, your image storage will be production-ready! 🚀
