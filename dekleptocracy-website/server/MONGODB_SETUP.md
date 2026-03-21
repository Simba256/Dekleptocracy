# MongoDB Atlas Setup Guide

This guide will help you configure MongoDB Atlas for the Dekleptocracy application.

## Connection String

Your MongoDB Atlas connection string is:

```
mongodb+srv://hasankamal839_db_user:<db_password>@cluster0.fink5ub.mongodb.net/dekleptocracy?retryWrites=true&w=majority&appName=Cluster0
```

## Setup Steps

### 1. Get Your Database Password

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in with your account
3. Navigate to **Database Access** in the left sidebar
4. Find the user `hasankamal839_db_user`
5. Click the **Edit** button (pencil icon)
6. Click **Edit Password**
7. Either:
   - Use the existing password (if you remember it)
   - Reset the password and create a new one
8. Copy the password

### 2. Configure Environment Variables

1. Go to the `server` directory
2. Create a `.env` file (if it doesn't exist)
3. Add the following:

```env
MONGODB_URI=mongodb+srv://hasankamal839_db_user:YOUR_ACTUAL_PASSWORD@cluster0.fink5ub.mongodb.net/dekleptocracy?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Replace `YOUR_ACTUAL_PASSWORD` with the password you copied in step 1.**

### 3. Configure Network Access

Your IP address must be whitelisted in MongoDB Atlas:

1. Go to **Network Access** in MongoDB Atlas
2. Click **Add IP Address**
3. Choose one of the following:
   - **Add Current IP Address**: Adds your current IP (recommended for production)
   - **Allow Access from Anywhere**: Adds `0.0.0.0/0` (convenient for development, but less secure)

### 4. Test the Connection

1. Start your server:

   ```bash
   cd server
   npm run dev
   ```

2. You should see:

   ```
   ✅ Connected to MongoDB Atlas
   🚀 API listening on http://localhost:5000
   ```

3. If you see an error, check:
   - Password is correct in `.env` file
   - IP address is whitelisted
   - Connection string is correct
   - Internet connection is working

## Troubleshooting

### Error: "Authentication failed"

- **Solution**: Check that your password is correct in the `.env` file
- Make sure there are no extra spaces in the connection string
- Verify the username is correct: `hasankamal839_db_user`

### Error: "IP not whitelisted"

- **Solution**: Add your IP address to the Network Access list in MongoDB Atlas
- For development, you can temporarily use `0.0.0.0/0` to allow all IPs

### Error: "Server selection timed out"

- **Solution**: Check your internet connection
- Verify the cluster is running in MongoDB Atlas
- Check that the connection string is correct

### Error: "Database name not found"

- **Solution**: The database `dekleptocracy` will be created automatically when you first connect
- Make sure the connection string includes `/dekleptocracy` at the end

## Connection String Breakdown

```
mongodb+srv://
  hasankamal839_db_user          # Username
  :<db_password>                  # Password (replace this)
  @cluster0.fink5ub.mongodb.net   # Cluster URL
  /dekleptocracy                  # Database name
  ?retryWrites=true               # Connection options
  &w=majority
  &appName=Cluster0
```

## Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Use strong passwords** for your database user
3. **Restrict IP access** - only allow necessary IP addresses
4. **Rotate passwords** regularly
5. **Use environment variables** in production (not hardcoded values)

## Production Deployment

When deploying to production:

1. Update the connection string with production credentials
2. Use environment variables in your hosting platform
3. Restrict network access to your server's IP address only
4. Use a strong JWT secret
5. Enable MongoDB Atlas backup and monitoring

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Connection String Documentation](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
