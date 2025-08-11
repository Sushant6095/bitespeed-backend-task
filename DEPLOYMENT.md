# Deployment Guide - Render.com

This guide explains how to deploy the Contact Identity Reconciliation API to Render.com using Docker.

## Prerequisites

1. **Render.com Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Docker**: For local testing (optional)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository contains:
- `Dockerfile` - Multi-stage Docker configuration
- `render.yaml` - Render service configuration
- `.dockerignore` - Docker build optimization
- All source code and configuration files

### 2. Connect to Render

1. Log in to your Render dashboard
2. Click "New +" and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file

### 3. Configure Environment Variables

The following environment variables will be automatically configured:
- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL` - Automatically linked from the PostgreSQL service

### 4. Deploy

1. Click "Apply" to create the services
2. Render will:
   - Create a PostgreSQL database
   - Build your Docker image
   - Deploy the web service
   - Link the database to your application

### 5. Run Database Migrations

After the first deployment, you may need to run migrations:

1. Go to your web service dashboard
2. Open the "Shell" tab
3. Run: `npx prisma migrate deploy`

Or use the Render console to run:
```bash
npm run deploy:migrate
```

## Service Configuration

### Database Service (`bitespeed-database`)
- **Type**: PostgreSQL
- **Plan**: Free tier
- **Database Name**: `bitespeed`
- **User**: `bitespeed_user`

### Web Service (`bitespeed-api`)
- **Type**: Web Service
- **Plan**: Free tier
- **Port**: 3000
- **Health Check**: `/health`
- **Auto Deploy**: Enabled

## Local Docker Testing

Before deploying, you can test the Docker setup locally:

### Build the Docker Image
```bash
npm run docker:build
```

### Run the Container
```bash
# Make sure you have a .env file with DATABASE_URL
npm run docker:run
```

### Test the Application
```bash
curl http://localhost:3000/health
```

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Render)

### Optional
- `NODE_ENV` - Set to "production" (auto-configured)
- `PORT` - Server port (auto-configured to 3000)

## Monitoring and Logs

### Health Check
The application includes a health check endpoint at `/health` that:
- Tests database connectivity
- Returns server status and uptime
- Used by Render for service monitoring

### Logs
View application logs in the Render dashboard:
1. Go to your web service
2. Click on "Logs" tab
3. Monitor real-time application logs

### Metrics
Render provides built-in metrics for:
- CPU usage
- Memory usage
- Request count
- Response times

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if the database service is running
   - Verify DATABASE_URL is correctly configured
   - Ensure database migrations have been run

2. **Build Failed**
   - Check Dockerfile syntax
   - Verify all dependencies are in package.json
   - Review build logs in Render dashboard

3. **Application Won't Start**
   - Check application logs
   - Verify PORT environment variable
   - Ensure health check endpoint is accessible

### Debug Commands

Run these in the Render shell:

```bash
# Check environment variables
env | grep DATABASE_URL

# Test database connection
npx prisma db pull

# Check application status
curl http://localhost:3000/health

# View Prisma client status
npx prisma generate --schema=./prisma/schema.prisma
```

## Scaling and Performance

### Free Tier Limitations
- Database: 1GB storage, 100 connections
- Web Service: 512MB RAM, shared CPU
- Automatic sleep after 15 minutes of inactivity

### Upgrading
For production workloads, consider upgrading to:
- **Starter Plan**: Dedicated resources, no sleep
- **Pro Plan**: Higher performance, more storage

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **Database Access**: Database is only accessible from your web service
3. **HTTPS**: All Render services use HTTPS by default
4. **Container Security**: Application runs as non-root user

## Backup and Recovery

### Database Backups
- Render automatically backs up PostgreSQL databases
- Free tier: 7-day retention
- Paid plans: Longer retention periods

### Application Recovery
- Code is stored in your Git repository
- Render can rebuild and redeploy from any commit
- Database migrations are versioned with Prisma

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Application Logs**: Available in Render dashboard
