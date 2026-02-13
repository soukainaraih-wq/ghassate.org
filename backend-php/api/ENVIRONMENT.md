# PHP API Environment Notes

You can configure the API by either:

- Setting environment variables in hosting panel, or
- Editing `config.php` defaults directly.

Recommended variables:

- `APP_ENV=production`
- `ADMIN_TOKEN=<long-random-secret-32-plus>`
- `ENABLE_ADMIN_ENDPOINT=true`
- `FRONTEND_ORIGIN=https://your-domain`
- `PUBLIC_ORIGIN=https://your-domain`
- `FRONTEND_EXTRA_ORIGINS=https://www.your-domain`
- `ALLOW_NO_ORIGIN=false`

If `ADMIN_TOKEN` is not provided, admin endpoints remain unavailable in production.

If your hosting does not expose env vars directly, you can set Apache vars in `.htaccess`:

```apache
SetEnv APP_ENV production
SetEnv ENABLE_ADMIN_ENDPOINT true
SetEnv ADMIN_TOKEN change_this_to_a_long_secret
SetEnv FRONTEND_ORIGIN https://your-domain
SetEnv PUBLIC_ORIGIN https://your-domain
```
