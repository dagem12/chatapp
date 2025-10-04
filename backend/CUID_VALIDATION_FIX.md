# CUID Validation Fix

## Issue
The application was experiencing validation errors when trying to access conversation and message endpoints. The error logs showed:

```
Validation failed (uuid is expected)
```

## Root Cause
The backend was using `ParseUUIDPipe` for validating route parameters, but Prisma was configured to generate CUIDs (Collision-resistant Unique Identifiers) instead of standard UUIDs.

- **Prisma Configuration**: `@default(cuid())` in schema.prisma
- **Generated IDs**: Format like `cmgb1tyby0009u89ogjjmlkoo` (25 characters, starts with 'c')
- **UUID Format**: Standard UUIDs like `550e8400-e29b-41d4-a716-446655440000`

## Solution
Created a custom `CuidValidationPipe` to properly validate CUID format:

### New File: `src/common/pipes/cuid-validation.pipe.ts`
```typescript
@Injectable()
export class CuidValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    // CUID format: starts with 'c', followed by 24 characters (base36)
    const cuidRegex = /^c[a-z0-9]{24}$/;
    
    if (!cuidRegex.test(value)) {
      throw new BadRequestException('Validation failed (cuid is expected)');
    }
    
    return value;
  }
}
```

### Updated Controllers
Replaced `ParseUUIDPipe` with `CuidValidationPipe` in:
- `MessagesController.getMessages()`
- `MessagesController.updateMessage()`
- `MessagesController.deleteMessage()`
- `ConversationsController.getConversation()`

### Updated API Documentation
Changed example IDs in Swagger documentation from UUID format to CUID format:
- From: `clx1234567890abcdef`
- To: `cmgb1tyby0009u89ogjjmlkoo`

## Result
- ✅ CUID validation now works correctly
- ✅ API endpoints accept Prisma-generated IDs
- ✅ Proper error messages for invalid CUIDs
- ✅ Updated API documentation with correct examples

## Testing
The fix resolves the validation errors seen in the logs:
```
2025-10-04T08:15:23.482Z [LoggingInterceptor] error: Error: GET /conversations/cmgb1tyby0009u89ogjjmlkoo - Validation failed (uuid is expected)
```

Now these requests will be properly validated and processed.
