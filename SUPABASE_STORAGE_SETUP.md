# Supabase Storage Setup Instructions

This guide will help you set up Supabase Storage buckets for file uploads in your Academic Projects Marketplace.

## Required Storage Buckets

Your application requires the following storage buckets:

### 1. **project-files**
- **Purpose**: Store project source code files (zip, rar, tar.gz, etc.)
- **Access**: Private (requires authentication)
- **Max File Size**: 50MB recommended

### 2. **thumbnails** (Optional)
- **Purpose**: Store project thumbnail images
- **Access**: Public
- **Max File Size**: 5MB recommended

### 3. **demo-videos** (Optional)
- **Purpose**: Store project demo videos
- **Access**: Public
- **Max File Size**: 100MB recommended

## Step-by-Step Setup

### 1. Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on "Storage" in the left sidebar

### 2. Create Storage Buckets

#### Create 'project-files' Bucket

1. Click "New bucket"
2. Set the following:
   - **Name**: `project-files`
   - **Public bucket**: OFF (unchecked)
   - **File size limit**: 52428800 (50MB in bytes)
   - **Allowed MIME types**: Leave empty or add:
     ```
     application/zip
     application/x-rar-compressed
     application/x-tar
     application/gzip
     application/x-7z-compressed
     ```
3. Click "Create bucket"

#### Configure Bucket Policies

After creating the bucket, you need to set up policies:

1. Click on the `project-files` bucket
2. Go to "Policies" tab
3. Add the following policies:

**Upload Policy (Allow authenticated users to upload):**
```sql
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Download Policy (Allow users to download files they own or purchased):**
```sql
CREATE POLICY "Users can download owned or purchased files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM purchases
      WHERE user_id = auth.uid()
      AND project_id IN (
        SELECT id FROM projects
        WHERE seller_id::text = (storage.foldername(name))[1]
      )
    )
  )
);
```

**Delete Policy (Allow users to delete their own files):**
```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Create Optional Buckets

If you want to store thumbnails and videos in Supabase Storage (instead of using URLs):

**For thumbnails:**
1. Create bucket named `thumbnails`
2. Make it **Public**
3. Set file size limit to 5MB (5242880 bytes)
4. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

**For demo videos:**
1. Create bucket named `demo-videos`
2. Make it **Public**
3. Set file size limit to 100MB (104857600 bytes)
4. Allowed MIME types: `video/mp4`, `video/webm`

### 3. Environment Variables

Make sure your `.env` file has the required Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Test File Upload

After setting up the buckets, test the file upload:

1. Log in to your application
2. Navigate to `/seller/projects/new`
3. Fill in the project details
4. Try uploading a zip file
5. Check Supabase Storage to verify the file was uploaded

## Folder Structure

Files are automatically organized in the following structure:

```
project-files/
└── projects/
    └── {user_id}/
        └── {timestamp}-{random}.{extension}
```

For example:
```
project-files/projects/550e8400-e29b-41d4-a716-446655440000/1704123456789-abc123.zip
```

## Security Considerations

1. **File Size Limits**: Always enforce file size limits to prevent abuse
2. **MIME Type Validation**: Validate file types on both client and server
3. **Virus Scanning**: Consider integrating a virus scanning service for uploaded files
4. **Rate Limiting**: Implement rate limiting on the upload endpoint
5. **User Authentication**: Always verify user authentication before allowing uploads

## Troubleshooting

### Upload Fails with "403 Forbidden"
- Check that the bucket exists
- Verify bucket policies are correctly configured
- Ensure user is authenticated
- Check that the service role key is correct

### Files Not Accessible
- Verify the bucket's public/private setting
- Check download policies
- Ensure the file path is correct

### Large Files Timeout
- Increase the timeout limit in your API route
- Consider implementing chunked uploads for large files
- Use a CDN for faster file delivery

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)

## Next Steps

After setting up storage:

1. Test file uploads thoroughly
2. Set up automated backups for storage buckets
3. Monitor storage usage in Supabase dashboard
4. Consider implementing file compression
5. Add file preview functionality
6. Implement file versioning if needed

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review browser console for errors
3. Verify API endpoint responses
4. Consult Supabase documentation
5. Reach out to Supabase support
