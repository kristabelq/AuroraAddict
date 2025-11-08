# Hunt Visibility Logic Implementation

## Valid Scenarios Matrix

All 11 valid scenarios from your specification are correctly implemented:

| # | Private | Hide from Public | Paid | Hide Location | Status |
|---|---------|------------------|------|---------------|--------|
| 1 | ✓ | ✓ | ✓ | ✓ | ✅ Valid |
| 2 | ✓ | ✓ | ✓ | ✗ | ✅ Valid |
| 3 | ✓ | ✓ | ✗ | ✓ | ✅ Valid |
| 4 | ✓ | ✓ | ✗ | ✗ | ✅ Valid |
| 5 | ✓ | ✗ | ✓ | ✓ | ✅ Valid |
| 6 | ✓ | ✗ | ✓ | ✗ | ✅ Valid |
| 7 | ✓ | ✗ | ✗ | ✓ | ✅ Valid |
| 8 | ✓ | ✗ | ✗ | ✗ | ✅ Valid |
| 9 | ✗ | ✗ | ✓ | ✗ | ✅ Valid |
| 10 | ✗ | ✗ | ✓ | ✓ | ✅ Valid |
| 11 | ✗ | ✗ | ✗ | ✗ | ✅ Valid |

## Rules Enforced

### Frontend (Immediate UX Feedback)

#### Rule 1: Private vs Public (Mutually Exclusive)
- ✅ Only one can be checked at a time
- ✅ Checking Private → Unchecks Public
- ✅ Checking Public → Unchecks Private AND resets Hide from Public to false

#### Rule 2: Hide from Public (Conditional Visibility)
- ✅ Only visible when Private is checked
- ✅ Automatically hidden when Public is checked
- ✅ Automatically reset to false when switching from Private to Public
- ✅ Indented with visual border (border-l-2 border-aurora-green/30) to show hierarchy

#### Rule 3: Hide Location (Conditional Enable)
- ✅ Only enabled when Private OR Paid is checked
- ✅ Disabled (grayed out) when both Private and Paid are unchecked
- ✅ Automatically unchecked when both conditions become false

### Backend (Data Validation)

#### Validation 1: hideFromPublic Constraint
```javascript
if (hideFromPublic && isPublic) {
  return NextResponse.json(
    { error: "Hide from Public can only be enabled for private hunts" },
    { status: 400 }
  );
}
```

#### Validation 2: hideLocation Constraint
Frontend enforces this by disabling the checkbox, preventing invalid states from being submitted.

## Testing Results

All 14 test cases passed:
- ✅ 11/11 valid scenarios allowed
- ✅ 3/3 invalid scenarios correctly blocked

### Invalid Scenarios (Correctly Blocked)
1. ❌ Public + Hide from Public + Paid + Hide Location
   - **Blocked by:** Frontend hides the checkbox, Backend returns 400 error
2. ❌ Public + Hide from Public + Unpaid + Unhide Location
   - **Blocked by:** Frontend hides the checkbox, Backend returns 400 error
3. ❌ Public + Unhide from Public + Unpaid + Hide Location
   - **Blocked by:** Frontend disables the checkbox

## Implementation Files

### Frontend
- `/src/app/(main)/createhunt/page.tsx` - Create hunt form
- `/src/app/(main)/hunts/[id]/edit/page.tsx` - Edit hunt form

### Backend
- `/src/app/api/hunts/create/route.ts` - Create hunt API
- `/src/app/api/hunts/[id]/route.ts` - Update hunt API (PATCH)

### Database
- `/prisma/schema.prisma` - Hunt model with all visibility fields

## UI Behavior Examples

### Scenario: Starting from Public
1. User checks **Private** → Public unchecks, "Hide from Public" option appears
2. User checks **Hide from Public** → Checkbox visible and enabled
3. User checks **Public** → Private unchecks, "Hide from Public" disappears and resets to false

### Scenario: Hide Location Toggle
1. User unchecks both **Private** and **Paid** → "Hide Location" becomes disabled and grayed out
2. User checks **Paid** → "Hide Location" becomes enabled
3. User checks **Private** → "Hide Location" remains enabled
4. User unchecks **Paid** → "Hide Location" remains enabled (Private is still checked)

## Visual Styling

The visibility options are grouped in a styled container:
```tsx
<div className="space-y-3 bg-white/5 p-4 rounded-lg">
  {/* Private checkbox */}

  {/* Hide from Public - conditionally rendered with indentation */}
  {formData.isPrivate && (
    <div className="ml-6 border-l-2 border-aurora-green/30 pl-4">
      {/* Hide from Public checkbox */}
    </div>
  )}

  {/* Public checkbox */}
  {/* Paid checkbox */}
  {/* Hide Location checkbox - with disabled state */}
</div>
```

This creates a clear visual hierarchy showing that "Hide from Public" is a sub-option of "Private".
