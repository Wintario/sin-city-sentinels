# Security Policy

## Authentication & Session Management

### HttpOnly Cookies (v1.1.1+)

The application uses **secure HttpOnly cookies** for session management:

#### Cookie Attributes

```javascript
res.cookie('auth_token', token, {
  httpOnly: true,           // ✅ Not accessible from JavaScript (XSS protection)
  secure: true,             // ✅ HTTPS only in production
  sameSite: 'strict',       // ✅ CSRF protection - not sent in cross-site requests
  maxAge: 7 * 24 * 60 * 60 * 1000,  // ✅ 7-day expiry
  path: '/'                 // ✅ Accessible from all routes
});
```

#### Why HttpOnly Cookies?

- **XSS Protection**: JavaScript code (including malicious scripts) cannot access HttpOnly cookies
- **CSRF Protection**: SameSite=strict prevents cookies from being sent in cross-site requests
- **Automatic Transmission**: Cookies are automatically sent with every request (no localStorage needed)
- **Server Control**: Session expiry is controlled by the server, not the client

#### Session Restoration

When the app loads:
1. Sends `POST /api/auth/verify` request
2. Server checks the `auth_token` cookie
3. If valid, returns user info and updates localStorage
4. If invalid/expired, redirects to login

This happens **automatically** - no need to re-login when:
- Navigating from admin to homepage
- Refreshing the page
- Browser tabs
- Closing and reopening the browser (within 7 days)

### Token Handling

**Dual Storage Strategy** (for redundancy):

1. **HttpOnly Cookie** (primary) - Server-managed, cannot be stolen via JavaScript
2. **localStorage** (fallback) - Client-accessible, used as backup

Both are set during login and cleared during logout.

### API Security

#### Request Headers

All API requests include:

```javascript
fetch(url, {
  credentials: 'include',  // ✅ Automatically send cookies
  headers: {
    'Authorization': `Bearer ${token}`,  // ✅ Redundant token header
    'Content-Type': 'application/json'
  }
});
```

#### Authentication Middleware

```javascript
if (response.status === 401) {
  clearToken();  // Clear localStorage backup
  window.location.href = '/admin/login';  // Redirect to login
}
```

### Password Security

- Passwords are **hashed with bcrypt** in the database
- Never logged or exposed in responses
- Login attempts are **rate-limited** (prevent brute force)

### Admin Routes

**All admin endpoints require authentication:**

```
✅ POST /api/auth/login - Public (rate-limited)
✅ POST /api/auth/logout - Protected (clears cookies)
✅ GET /api/auth/me - Protected
✅ POST /api/auth/verify - Protected

✅ POST /api/news/admin/* - Protected (author+ role)
✅ PUT /api/news/admin/* - Protected (author+ role)
✅ DELETE /api/news/admin/* - Protected (author+ role)

✅ GET /api/users - Protected (admin role only)
✅ POST /api/users - Protected (admin role only)
✅ DELETE /api/users - Protected (admin role only)
```

### CORS Configuration

**Production (https://wicked-rabbits.ru):**
```javascript
cors({
  origin: 'https://wicked-rabbits.ru',
  credentials: true,  // ✅ Allow cookies in cross-origin requests
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

**Local Development (http://localhost:5173):**
```javascript
cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### Rate Limiting

**Login endpoint** - prevents brute force attacks:
- **15 requests per hour** per IP address
- Returns **429 Too Many Requests** if exceeded

```javascript
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 15,                    // 15 requests
  message: 'Too many login attempts'
});
```

## Security Best Practices

✅ **DO:**
- Use HTTPS in production (enforced via `secure: true`)
- Clear cookies on logout (`clearCookie()`)
- Verify token expiry on server
- Use strong passwords for admin accounts
- Change default admin password immediately
- Keep dependencies updated
- Monitor logs for suspicious activity

❌ **DON'T:**
- Store auth tokens in localStorage as primary method
- Send sensitive data in URLs
- Log authentication tokens
- Disable CORS protection
- Use weak passwords
- Commit `.env` files
- Share admin credentials

## Known Limitations

1. **Same-Origin Only**: Cookies only work on the same domain (wicked-rabbits.ru)
2. **7-Day Expiry**: Sessions expire after 7 days
3. **No Refresh Tokens**: Consider implementing for longer sessions
4. **Single Device**: Each device maintains separate session

## Future Improvements

- [ ] Implement refresh token rotation
- [ ] Add 2FA (two-factor authentication)
- [ ] Implement session invalidation on password change
- [ ] Add security headers (HSTS, CSP, X-Frame-Options)
- [ ] Implement audit logging for admin actions
- [ ] Add IP whitelist for admin panel
- [ ] Implement bot detection (reCAPTCHA)

## Incident Response

**If you suspect a security breach:**

1. **Immediately change** all admin passwords
2. **Check logs** for unauthorized access
3. **Review** recent changes in news/members
4. **Clear all sessions** if necessary (restart backend)
5. **Enable 2FA** if implemented
6. **Update** all dependencies

## Contact

For security concerns, please contact: [your contact]

---

**Last Updated:** 2025-12-20
**Version:** 1.1.1
