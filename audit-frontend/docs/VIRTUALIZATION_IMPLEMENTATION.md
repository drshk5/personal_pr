# Virtualization Implementation - Performance Optimization

## Overview

Replaced accordion-based tree rendering with react-window virtualization to massively improve expand-all performance from ~5 seconds to sub-second speeds.

## Problem

The Chart of Accounts accordion was rendering ALL nodes in the DOM at once (500+ nodes with nested accordions, icons, buttons), causing:

- 4.9s "'message' handler" violations
- 2.1s "Forced reflow while executing JavaScript" violations
- Unresponsive UI during expand-all operations

## Solution: List Virtualization

Only render visible rows (~15-20 items) instead of all 500+ nodes, eliminating the DOM creation bottleneck.

## Changes Made

### 1. New Files Created

- **VirtualizedTreeList.tsx** (233 lines)
  - `flattenTree()`: Converts hierarchical tree to flat list based on expandedIds
  - `Row`: Memoized component for individual virtualized rows
  - `VirtualizedTreeList`: Main component using react-window's `List`
  - Features: O(1) expand/collapse lookup using Set, permission checks, edit buttons

### 2. Modified Files

#### RenameScheduleAccordion.tsx

**Removed:**

- Event-driven architecture (window.dispatchEvent)
- Array-based expandedItems state
- nestedExpandedMap complexity
- Chunked expansion batching logic (no longer needed!)
- Accordion and AccordionItemNode imports
- handleValueChange, updateNestedState functions

**Added:**

- Set-based expandedIdsSet for O(1) lookup
- Simple handleToggleExpand callback
- expandAllIdsCompute useMemo (synchronous computation)
- VirtualizedTreeList integration

**Before:**

```tsx
const [expandedItems, setExpandedItems] = useState<string[]>([]);
const [nestedExpandedMap, setNestedExpandedMap] = useState<
  Record<string, string[]>
>({});

// Chunked batching with setTimeout
const startChunkedExpand = useCallback(() => {
  // ... 70 lines of queue processing
}, [data, MAX_EXPANDED_DEPTH, MAX_EXPANDED_ITEMS, startTransition]);
```

**After:**

```tsx
const [expandedIdsSet, setExpandedIdsSet] = useState<Set<string>>(() => {
  // Load from sessionStorage
  return new Set(stored ? JSON.parse(stored) : []);
});

// Simple synchronous expansion
const expandAllIdsCompute = useMemo(() => {
  const ids = new Set<string>();
  // ... simple BFS traversal
  return ids;
}, [data, MAX_EXPANDED_DEPTH]);

// Apply instantly
setExpandedIdsSet(expandAllIdsCompute);
```

#### AccordionItemNode.tsx

- No longer used in main rendering (kept for backwards compatibility)
- Previous optimizations (usePermission hook, tooltip removal) still intact

### 3. Key Technical Details

#### react-window Library

```bash
npm install react-window @types/react-window
```

Version: 1.8.10

- Uses `List` component (not FixedSizeList)
- Props: `rowComponent`, `rowProps`, `rowCount`, `rowHeight`, `defaultHeight`
- Row component receives: `index`, `style`, `ariaAttributes` + custom `rowProps`

#### Flattening Algorithm

```typescript
function flattenTree(
  items: RenameSchedule[],
  expandedIds: Set<string>,
  level = 0
): FlatNode[] {
  const result: FlatNode[] = [];

  for (const item of items) {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.strScheduleGUID);

    result.push({ item, level, hasChildren, isExpanded });

    // Only traverse children if expanded
    if (hasChildren && isExpanded) {
      result.push(...flattenTree(item.children, expandedIds, level + 1));
    }
  }

  return result;
}
```

#### State Management

- **expandedIds**: `Set<string>` for O(1) lookup
- **flatNodes**: Memoized flat array computed from tree + expandedIds
- **Expansion**: Set mutation triggers re-flatten → only visible rows re-render

### 4. Performance Characteristics

**Before (Accordion-based):**

- Renders all nodes: O(N) DOM operations where N = total visible nodes (500+)
- Expand-all: Creates 500+ DOM elements in one frame
- Time: ~5000ms

**After (Virtualized):**

- Renders visible rows only: O(V) where V = viewport rows (~15-20)
- Expand-all: Instant state update, renders only visible rows
- Expected time: <500ms (10x+ improvement)

### 5. Features Preserved

✅ Expand/collapse hierarchy  
✅ Edit button with permissions  
✅ Visual depth indentation (paddingLeft: level \* 12 + 12px)  
✅ Level-based background colors  
✅ Chevron icons (ChevronDown/ChevronRight)  
✅ Session storage persistence  
✅ Skeleton loading state  
✅ Accessibility (aria attributes)

### 6. Migration Notes

**Breaking Changes:**

- None! Public API unchanged
- `RenameSchedulesPage.tsx` still calls same `toggleExpandAll()`
- All props to `RenameScheduleAccordion` remain identical

**Internal Changes:**

- State structure: Array → Set (internal only)
- Rendering: Accordion → react-window List

### 7. Testing Checklist

- [ ] Expand all: Should complete in <1s
- [ ] Collapse all: Already fast, should remain instant
- [ ] Individual node expand/collapse: Should work smoothly
- [ ] Edit button: Should trigger modal correctly
- [ ] Scroll performance: Should be butter-smooth
- [ ] Deep nesting: Should respect MAX_EXPANDED_DEPTH=4
- [ ] Session storage: Should persist expanded state
- [ ] Chrome DevTools Performance: No more 5s violations

### 8. Constants

```typescript
const ROW_HEIGHT = 48; // pixels per row
const MAX_EXPANDED_DEPTH = 4; // max tree depth
const OVERSCAN_COUNT = 5; // render 5 extra rows above/below viewport
```

## Expected Results

- **Expand-all time**: 5000ms → <500ms (90%+ faster)
- **Collapse-all time**: Already fast, no change
- **Scroll FPS**: 60fps constant (virtualized)
- **DOM nodes**: 500+ → 15-20 (97% reduction)
- **Memory usage**: Significantly reduced

## Credits

Optimization journey:

1. Event system removal → prop-based state
2. Queue optimization (shift → index-based)
3. Tooltip component removal
4. WithPermission → usePermission hook
5. Chunked expansion with batching
6. **Virtualization** ← Current implementation (biggest win!)

---

**Status**: ✅ Implemented, compiled successfully, ready for testing
