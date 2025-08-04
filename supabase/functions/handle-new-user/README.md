# Handle New User Webhook

This edge function handles the webhook triggered when a new user signs up via Supabase Auth.

## Security Features

1. **Method Validation**: Only accepts POST requests
2. **Webhook Secret**: Optional shared secret validation via `x-webhook-secret` header
3. **Content Type Validation**: Ensures JSON payload
4. **Payload Structure Validation**: Validates webhook format
5. **Event Type Filtering**: Only processes INSERT events on auth.users table
6. **Idempotency**: Checks if profile already exists before creating
7. **Error Handling**: Comprehensive error logging and appropriate HTTP responses

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL (required)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin access (required)
- `WEBHOOK_SECRET`: Optional shared secret for webhook validation

## Webhook Configuration

When setting up the database webhook in Supabase:

1. Table: `auth.users`
2. Events: INSERT
3. HTTP Headers (if using webhook secret):
   ```
   x-webhook-secret: your-secret-value
   ```

## Webhook Payload Format

Expected payload structure:
```json
{
  "type": "INSERT",
  "table": "auth.users",
  "record": {
    "id": "user-uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## Deployment

```bash
supabase functions deploy handle-new-user
```

To set the webhook secret:
```bash
supabase secrets set WEBHOOK_SECRET="your-secret-value"
```