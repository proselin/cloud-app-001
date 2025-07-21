# Comic Sync/Crawl Feature

## Overview
Added a sync button to the comic detail page that allows users to pull/crawl new chapters from the source using Server-Sent Events (SSE).

## Features

### Sync Button Location
- Located in the "Chapters" section header of the comic detail page
- Positioned to the right of the "Chapters" title
- Shows different states based on current operation

### Functionality
1. **Idle State**: Shows "Sync Chapters" button with refresh icon
2. **Connecting State**: Shows spinner and "Connecting..." message
3. **Syncing State**: Shows spinner and real-time progress messages
4. **Completed State**: Shows checkmark and success message
5. **Error State**: Shows error icon and error message
6. **Cancel Option**: Users can cancel ongoing sync operations

### Server-Sent Events Integration
- **Endpoint**: `https://api-margiet.proselin.id.vn/api/v1/crawl/crawl-chapter-by-id-sse`
- **Parameter**: `comicId` - The ID of the comic to sync
- **Real-time Updates**: Receives live progress updates during the crawl process

## UI Components

### Sync Button States
```html
<!-- Idle State -->
<button class="sync-button">
  <refresh-icon />
  Sync Chapters
</button>

<!-- Loading States -->
<div class="sync-status">
  <spinner />
  <status-message />
</div>

<!-- Cancel Button (during sync) -->
<button class="cancel-button">
  <close-icon />
  Cancel
</button>
```

### Progress Display
- **Header Status**: Compact status indicator next to the button
- **Detail Panel**: Expanded progress information when syncing
- **Visual Indicators**: Different colors and icons for each state

## Implementation Details

### Component Structure
```typescript
// State Management
isSyncing = signal(false);
syncProgress = signal<string>('');
syncStatus = signal<'idle' | 'connecting' | 'syncing' | 'completed' | 'error'>('idle');

// SSE Connection
private eventSource: EventSource | null = null;
```

### Methods
- `syncComic()`: Initiates the sync process
- `cancelSync()`: Cancels ongoing sync operation  
- `closeSyncConnection()`: Closes SSE connection
- `resetSyncState()`: Resets all sync-related state

### Error Handling
- Connection failures are handled gracefully
- User-friendly error messages are displayed
- Automatic cleanup and state reset after errors
- Retry capability by allowing new sync attempts

## User Experience

### Visual Feedback
- **Immediate Response**: Button state changes instantly when clicked
- **Progress Updates**: Real-time messages show current operation
- **Status Icons**: Clear visual indicators for different states
- **Color Coding**: Blue for connecting, green for success, red for errors

### Responsive Design
- Button adapts to different screen sizes
- Progress panel is mobile-friendly
- Proper spacing and alignment maintained

### Accessibility
- Proper ARIA labels and titles
- Keyboard navigation support
- Screen reader friendly status updates
- High contrast color schemes

## Auto-Refresh
After successful sync completion:
1. Comic data is automatically refreshed
2. Chapter list is updated with new chapters
3. Crawl status indicators are updated
4. User sees the latest chapter availability

## Error Recovery
- Connection timeouts are handled
- Network errors display helpful messages
- Users can retry failed operations
- State is automatically reset after errors

## Technical Notes

### Performance
- SSE connection is properly managed and cleaned up
- No memory leaks from unclosed connections
- Efficient state updates using Angular signals

### Security
- HTTPS endpoint for secure communication
- Proper error handling prevents information leakage
- Connection cleanup prevents resource exhaustion

## Usage Instructions
1. Navigate to any comic detail page
2. Look for the "Sync Chapters" button in the chapters section
3. Click the button to start syncing new chapters
4. Monitor progress through the real-time status updates
5. Cancel if needed using the cancel button
6. Wait for completion and see updated chapter list

## Files Modified
- `apps/cloud/src/app/pages/comic/comic.component.ts`: Added sync functionality
- `apps/cloud/src/app/pages/comic/comic.component.html`: Added sync UI elements
