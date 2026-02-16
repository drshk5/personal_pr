# CDN Setup for Module Images

## Overview
Module images are now configured to use CDN for faster delivery. The system automatically falls back to local backend serving if CDN is not configured.

## How It Works

### Frontend Configuration
Location: `frontend/src/config/environment.ts`

```typescript
export const environment = {
  baseUrl: "https://localhost:5001",
  
  // CDN Configuration for Module Images
  cdnUrl: "", // Set your CDN URL here
  moduleImagesPath: "/Uploads/ModuleImages",
};
```

### Image Path Resolution
- **`getImagePath()`** - Used for all regular images (profiles, items, etc.) → Uses backend
- **`getModuleImagePath()`** - Used ONLY for module images → Uses CDN if configured, otherwise backend

## Setup Instructions

### Option 1: Cloudflare CDN (Free)

1. **Create Cloudflare Account**: https://dash.cloudflare.com/sign-up

2. **Add Your Domain** to Cloudflare

3. **Enable CDN Caching**:
   - Go to Rules → Page Rules
   - Create rule: `yourdomain.com/Uploads/ModuleImages/*`
   - Settings: Cache Level = Cache Everything, Edge Cache TTL = 1 month

4. **Upload Module Images** to this folder: `backend/Uploads/ModuleImages/`

5. **Update Frontend Config**:
   ```typescript
   cdnUrl: "https://yourdomain.com",
   ```

### Option 2: AWS CloudFront

1. **Create S3 Bucket**: `your-app-module-images`

2. **Upload Files** from `backend/Uploads/ModuleImages/` to S3

3. **Create CloudFront Distribution**:
   - Origin: S3 bucket
   - Price Class: Use U.S., Canada and Europe
   - Default Cache Behavior: Cache Policy = CachingOptimized

4. **Update Frontend Config**:
   ```typescript
   cdnUrl: "https://d111111abcdef8.cloudfront.net",
   ```

### Option 3: Cloudinary (Image Optimization)

1. **Sign Up**: https://cloudinary.com/users/register/free

2. **Get Cloud Name** from dashboard

3. **Upload Images** via Cloudinary Console or API to folder: `module-images`

4. **Update Frontend Config**:
   ```typescript
   cdnUrl: "https://res.cloudinary.com/your-cloud-name/image/upload/module-images",
   ```

### Option 4: Azure CDN

1. **Create Storage Account** in Azure Portal

2. **Create Blob Container**: `module-images` (Public access level: Blob)

3. **Upload Files** from `backend/Uploads/ModuleImages/`

4. **Create CDN Profile** → Create CDN Endpoint

5. **Update Frontend Config**:
   ```typescript
   cdnUrl: "https://yourcdn.azureedge.net/module-images",
   ```

## Syncing Images to CDN

### Manual Upload
1. Copy files from `backend/Uploads/ModuleImages/`
2. Upload to your CDN storage
3. Maintain same folder structure

### Automated Sync (Recommended)

#### For AWS S3:
```bash
# Install AWS CLI
aws s3 sync ./backend/Uploads/ModuleImages/ s3://your-bucket/Uploads/ModuleImages/ --acl public-read
```

#### For Azure Blob:
```bash
# Install Azure CLI
az storage blob upload-batch -d module-images -s ./backend/Uploads/ModuleImages/ --account-name youraccount
```

#### For Cloudflare R2:
```bash
# Using rclone
rclone sync ./backend/Uploads/ModuleImages/ r2:your-bucket/Uploads/ModuleImages/
```

## Testing

### Without CDN (Default):
```typescript
cdnUrl: "",
```
Result: `https://localhost:5001/Uploads/ModuleImages/filename.png`

### With CDN:
```typescript
cdnUrl: "https://cdn.yourdomain.com",
```
Result: `https://cdn.yourdomain.com/Uploads/ModuleImages/filename.png`

## Performance Benefits

- ✅ **Faster Loading**: Images served from edge locations closer to users
- ✅ **Reduced Bandwidth**: Offload traffic from your backend server
- ✅ **Better Caching**: CDN handles cache headers automatically
- ✅ **Improved UX**: Module switcher loads instantly
- ✅ **Cost Effective**: Many CDN providers offer free tiers

## Best Practices

1. **Image Optimization**: Compress images before uploading
   - Recommended format: WebP or PNG
   - Max size: 200x200px (module images are displayed at 80x80px)
   - Use tools like TinyPNG or Squoosh

2. **Naming Convention**: Use descriptive names
   - ✅ `accounting-module.png`
   - ✅ `task-management.png`
   - ❌ `image1.png`

3. **Cache Control**: Set long cache expiration (30 days+)

4. **Fallback**: Always keep images in backend as fallback

## Troubleshooting

### Images not loading from CDN
1. Check `cdnUrl` in `environment.ts`
2. Verify CORS settings on CDN
3. Check browser console for errors
4. Verify image paths match exactly

### Mixed content errors (HTTPS/HTTP)
- Ensure CDN URL uses HTTPS
- Update `cdnUrl` to use `https://`

### Images work locally but not in production
- Verify production `environment.ts` has correct `cdnUrl`
- Check CDN allows public access
- Verify build process includes correct config

## Migration Checklist

- [ ] Choose CDN provider
- [ ] Create CDN account/storage
- [ ] Upload existing module images
- [ ] Configure CORS if needed
- [ ] Update `frontend/src/config/environment.ts`
- [ ] Test in development
- [ ] Deploy to production
- [ ] Monitor CDN usage/costs
- [ ] Set up automated sync (optional)

## Current Module Images Location

- **Backend**: `backend/Uploads/ModuleImages/`
- **Frontend Config**: `frontend/src/config/environment.ts`
- **Used In**:
  - Module Switcher (`components/navigation/module-switcher-modal.tsx`)
  - Module Form (`pages/Central/module/ModuleForm.tsx`)

## Questions?

If CDN is not configured (`cdnUrl: ""`), the system automatically uses your backend server - no changes needed!
