# 🚀 **Deployment Guide - Grand Lodge Web**

Complete guide to deploy the Grand Lodge Hotel Management System to production.

---

## **1. Vercel Deployment (Recommended)**

### Auto Deployment (Easiest)
```bash
# Push your code to GitHub
git push origin main

# Vercel will automatically deploy from GitHub
# Check deployment status at: https://vercel.com
```

### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set production URL
vercel --prod
```

**Live URL:** https://grandlodge-web.vercel.app

---

## **2. Netlify Deployment**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the app
npm run build

# Deploy
netlify deploy --prod --dir=build

# Or drag and drop 'build' folder to Netlify
```

**Features:**
- Automatic branch deployments
- Environment variables support
- CDN included
- HTTPS enabled

---

## **3. AWS S3 + CloudFront**

```bash
# Build the app
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## **4. Docker Deployment**

### Create Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

### Build and Deploy

```bash
# Build Docker image
docker build -t grandlodge-web:latest .

# Run locally
docker run -p 3000:3000 grandlodge-web:latest

# Push to Docker Hub
docker tag grandlodge-web:latest username/grandlodge-web:latest
docker push username/grandlodge-web:latest

# Deploy to AWS ECS, Kubernetes, etc.
```

---

## **5. Heroku Deployment**

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create grandlodge-web

# Create Procfile
echo "web: serve -s build -l $PORT" > Procfile

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

---

## **6. Custom Server (Node.js)**

```bash
# Install production server
npm install -g serve

# Build the app
npm run build

# Start production server
serve -s build -l 3000 --ssl-cert server.crt --ssl-key server.key
```

Or use express:

```javascript
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

app.listen(process.env.PORT || 3000);
```

---

## **7. Environment Variables**

### Set Variables on Vercel
```bash
vercel env add REACT_APP_API_URL
# Enter: https://api.grandlodge.com/api

vercel env add REACT_APP_DB_PASSWORD
# Enter: your-secure-password
```

### Set Variables on Netlify
```
Settings → Build & deploy → Environment → Add environment variables
```

---

## **8. Performance Optimization**

### Enable Gzip Compression
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Encoding",
          "value": "gzip"
        }
      ]
    }
  ]
}
```

### Optimize Bundle Size
```bash
npm run build
npm install -g source-map-explorer
npm run analyze
```

---

## **9. Security Checklist**

- [ ] Environment variables are set
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] API authentication enabled
- [ ] Database password secured
- [ ] CORS configured properly
- [ ] Sensitive data not in code
- [ ] Secrets stored securely

---

## **10. Monitoring & Maintenance**

### Check Deployment Status
```bash
# Vercel
vercel list deployments

# Netlify
netlify status

# AWS
aws cloudfront list-invalidations --distribution-id YOUR_DIST_ID
```

### View Logs
```bash
# Vercel
vercel logs

# Netlify
netlify logs

# Heroku
heroku logs --tail
```

### Rollback Deployment
```bash
# Vercel
vercel rollback

# Netlify
netlify deploy --alias=rollback

# GitHub
git revert <commit-hash>
git push origin main
```

---

## **11. CI/CD Pipeline (GitHub Actions)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to Vercel
        uses: BetaHuhn/deploy-to-vercel-action@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## **12. Domain Configuration**

### Connect Custom Domain

**Vercel:**
1. Go to Project Settings
2. Domains → Add Domain
3. Add DNS records

**Netlify:**
1. Site settings → Custom domain
2. Update DNS records at registrar

**DNS Records:**
```
CNAME: grandlodge.com → cname.vercel-dns.com
```

---

## **13. SSL/TLS Certificate**

Most platforms provide free SSL certificates automatically.

For custom certificates:
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

---

## **14. Backup & Recovery**

```bash
# Export data
git clone --mirror https://github.com/ramkeerthi0610/grandlodge-web.git

# Keep database backups
# Daily automated backups at 2 AM UTC
```

---

## **15. Post-Deployment Checklist**

- [ ] App is accessible at live URL
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] Forms submit properly
- [ ] API calls work
- [ ] Authentication functions
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Security headers present

---

## **Quick Reference**

| Platform | Command | Time | Cost |
|----------|---------|------|------|
| Vercel | `vercel` | 1-2 min | Free* |
| Netlify | `netlify deploy --prod` | 2-3 min | Free* |
| AWS | AWS console | 5-10 min | Pay-as-you-go |
| Docker | `docker build && push` | 3-5 min | Depends |
| Heroku | `git push heroku main` | 2-3 min | Paid |

*Free tier available with limitations

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- React Docs: https://react.dev

---

**Last Updated:** May 2, 2026
**Status:** ✅ Production Ready
