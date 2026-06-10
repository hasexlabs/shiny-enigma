# Timer System Bug - Root Cause Analysis

## 🐛 **Bug Description**

The timer decreases whenever a new chat message is received.

**Example:** 30 → 25 → 20 → 15 (even though only a few minutes have passed)

---

## 🔍 **Investigation Results**

### **Root Cause Found:**

**File:** `src/components/MaverickEngine.tsx`
**Lines:** 729-734

```typescript
if (data.outputType === "clarified_action" && data.actionEstimate) {
  const match = data.actionEstimate.match(/(\d+)m/);
  const mins = match && match[1] ? parseInt(match[1], 10) : 15;
  setTimeLeft(mins * 60);
  setTimerTotal(mins * 60);
}
```

**Problem:** Every time the AI returns a response with `outputType === "clarified_action"` and an `actionEstimate`, the timer is reset to the minutes specified in `actionEstimate`. This happens on **every AI response**, not just when a timer is explicitly started.

**Context:** This code is in the diagnostic channel response handler (lines 702-758). It runs after every AI message when using the diagnostic channel.

---

## 📋 **Additional Issues Found**

### **Issue 2: Timer useEffect Dependencies**

**File:** `src/components/MaverickEngine.tsx`
**Lines:** 276-295

```typescript
useEffect(() => {
  let interval: NodeJS.Timeout | null = null;
  if (timerActive && timeLeft > 0) {
    interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  }
  // ...
  return () => {
    if (interval) clearInterval(interval);
  };
}, [timerActive, timeLeft]); // ❌ timeLeft in dependencies
```

**Problem:** The useEffect includes `timeLeft` in its dependency array. This causes the interval to be recreated every second when `timeLeft` changes, which is inefficient and can cause timing inconsistencies.

---

### **Issue 3: Similar Pattern in FocusTimerPlugin**

**File:** `src/components/FocusTimerPlugin.tsx`
**Lines:** 237-259

```typescript
useEffect(() => {
  if (isActive && timeLeft > 0) {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        // ...
        return prev - 1;
      });
    }, 1000);
  }
  // ...
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [isActive, timeLeft]); // ❌ timeLeft in dependencies
```

**Problem:** Same issue as MaverickEngine - `timeLeft` in dependencies causes interval recreation every second.

---

## 🎯 **Recommended Fix**

### **Fix 1: Remove Automatic Timer Reset (Critical)**

**File:** `src/components/MaverickEngine.tsx`
**Lines:** 729-734

**Remove these lines:**
```typescript
if (data.outputType === "clarified_action" && data.actionEstimate) {
  const match = data.actionEstimate.match(/(\d+)m/);
  const mins = match && match[1] ? parseInt(match[1], 10) : 15;
  setTimeLeft(mins * 60);
  setTimerTotal(mins * 60);
}
```

**Reason:** The timer should only be set when explicitly started via the `[START_TIMER: mins, task]` command, not automatically reset on every AI response with `actionEstimate`.

---

### **Fix 2: Fix useEffect Dependencies (Important)**

**File:** `src/components/MaverickEngine.tsx`
**Lines:** 276-295

**Change from:**
```typescript
}, [timerActive, timeLeft]);
```

**To:**
```typescript
}, [timerActive]);
```

**Reason:** The interval should only be created/destroyed when `timerActive` changes, not every second when `timeLeft` changes.

---

### **Fix 3: Same Fix for FocusTimerPlugin (Important)**

**File:** `src/components/FocusTimerPlugin.tsx`
**Lines:** 237-259

**Change from:**
```typescript
}, [isActive, timeLeft]);
```

**To:**
```typescript
}, [isActive]);
```

**Reason:** Same as Fix 2 - prevent interval recreation every second.

---

### **Fix 4: Implement endTimestamp-based Timer (Long-term)**

As the user suggested, the timer should be based on:
```
remainingTime = endTimestamp - currentTimestamp
```

This would:
- Prevent timing drift
- Allow timer to persist across page refreshes
- Be more accurate
- Not be affected by component re-renders

**Implementation:**
- Store `endTime: number` (timestamp when timer should end)
- Calculate `timeLeft` on every render: `Math.max(0, Math.floor((endTime - Date.now()) / 1000))`
- Remove the setInterval-based countdown
- Use requestAnimationFrame or a lighter approach for UI updates

---

## 📊 **Summary**

| Issue | File | Lines | Severity |
|-------|------|-------|----------|
| Automatic timer reset on message | MaverickEngine.tsx | 729-734 | 🔴 Critical |
| useEffect with timeLeft dependency | MaverickEngine.tsx | 295 | 🟡 High |
| useEffect with timeLeft dependency | FocusTimerPlugin.tsx | 259 | 🟡 High |

---

## ✅ **Fixes Applied**

### **Fix 1: Remove Automatic Timer Reset (✅ Applied)**

**File:** `src/components/MaverickEngine.tsx`
**Lines:** 729-734

**Status:** ✅ **DONE** - Removed the automatic timer reset on message arrival

**Change:** Deleted the code block that was resetting `timeLeft` and `timerTotal` on every AI response with `actionEstimate`.

---

### **Fix 2: Fix useEffect Dependencies (✅ Applied)**

**File:** `src/components/MaverickEngine.tsx`
**Lines:** 295

**Status:** ✅ **DONE** - Removed `timeLeft` from useEffect dependencies

**Change:**
- From: `}, [timerActive, timeLeft]);`
- To: `}, [timerActive]);`

---

### **Fix 3: Same Fix for FocusTimerPlugin (✅ Applied)**

**File:** `src/components/FocusTimerPlugin.tsx`
**Lines:** 259

**Status:** ✅ **DONE** - Removed `timeLeft` from useEffect dependencies

**Change:**
- From: `}, [isActive, timeLeft]);`
- To: `}, [isActive]);`

---

### **Fix 4: Implement endTimestamp-based Timer (Pending)**

**Status:** ⏳ **NOT YET APPLIED** - Long-term improvement

**Reason:** Requires significant refactoring of timer state management

---

## ✅ **Next Steps**

1. **Immediate:** Remove the automatic timer reset at lines 729-734
2. **High Priority:** Fix useEffect dependencies in both timer components
3. **Long-term:** Refactor to use endTimestamp-based approach

---

**Root Cause:** Lines 729-734 in `src/components/MaverickEngine.tsx` automatically reset the timer on every AI response with `actionEstimate`, causing the timer to decrease when new messages arrive.
