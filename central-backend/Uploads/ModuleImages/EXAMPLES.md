# Example CDN Configurations

## Local Development (Default - No CDN)
```typescript
// frontend/src/config/environment.ts
export const environment = {
  baseUrl: "https://localhost:5001",
  cdnUrl: "", // Empty = use backend
  moduleImagesPath: "/Uploads/ModuleImages",
};
```

## Production with Cloudflare
```typescript
export const environment = {
  baseUrl: "https://api.yourdomain.com",
  cdnUrl: "https://cdn.yourdomain.com",
  moduleImagesPath: "/Uploads/ModuleImages",
};
```

## Production with AWS CloudFront
```typescript
export const environment = {
  baseUrl: "https://api.yourdomain.com",
  cdnUrl: "https://d111111abcdef8.cloudfront.net",
  moduleImagesPath: "/Uploads/ModuleImages",
};
```

## Production with Cloudinary
```typescript
export const environment = {
  baseUrl: "https://api.yourdomain.com",
  cdnUrl: "https://res.cloudinary.com/your-cloud-name/image/upload",
  moduleImagesPath: "/module-images", // Cloudinary folder name
};
```

## Production with Azure CDN
```typescript
export const environment = {
  baseUrl: "https://api.yourdomain.com",
  cdnUrl: "https://yourcdn.azureedge.net",
  moduleImagesPath: "/module-images",
};
```

## Testing URLs

### Without CDN (cdnUrl: ""):
- Module image path in DB: `/Uploads/ModuleImages/accounting.png`
- Final URL: `https://localhost:5001/Uploads/ModuleImages/accounting.png`

### With Cloudflare CDN:
- Module image path in DB: `/Uploads/ModuleImages/accounting.png`
- Final URL: `https://cdn.yourdomain.com/Uploads/ModuleImages/accounting.png`

### With Cloudinary:
- Module image path in DB: `/module-images/accounting.png`
- Final URL: `https://res.cloudinary.com/your-cloud/image/upload/module-images/accounting.png`
