# Google OAuth Sign-In Flow - Race Condition Analysis

## 🐛 **Bug Description**

**Current Behavior:**
1. User clicks Sign In
2. User selects Google account
3. User is redirected to loading page
4. Nothing happens
5. User goes back
6. User clicks Continue again
7. User successfully enters the app

**Expected Behavior:** User should enter the app immediately after successful Google authentication.

---

## 🔍 **Root Cause Analysis**

### **Issue 1: Duplicate AuthProvider Instances**

**File:** `src/main.tsx` (lines 72-76, 80-84)

**Problem:**
```typescript
if (path === '/auth/callback') {
  root.render(
    <StrictMode>
      <AuthProvider>  {/* AuthProvider instance 1 */}
        <AuthCallback />
      </AuthProvider>
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <App />  {/* App contains AuthProvider instance 2 */}
    </StrictMode>
  );
}
```

**Impact:** Every time the route changes or a re-render occurs, a new AuthProvider instance is created. This causes the auth state to reset each time, breaking session continuity.

---

### **Issue 2: Separate Auth Systems**

**LandingPortal uses:**
- Import: `auth` from `src/lib/supabase.ts`
- Method: `auth.onAuthStateChanged()`
- State: Local state (`currentUser`)

**Other components use:**
- Context: `AuthContext` from `src/contexts/AuthContext.tsx`
- Method: `supabase.auth.onAuthStateChange()`
- State: Context state (`user`)

**Impact:** Two separate auth state listeners that fire at different times, creating race conditions.

---

### **Issue 3: Race Condition Timing**

**Sequence of events:**

1. User clicks Sign In → Google OAuth
2. Supabase redirects to `/auth/callback`
3. AuthCallback component mounts with new AuthProvider (instance 1)
4. AuthCallback checks for session (line 11)
5. Waits 1 second (line 20)
6. Checks for session again (line 23)
7. If session exists, redirects to "/"
8. **NEW** App component mounts with new AuthProvider (instance 2)
9. **NEW** LandingPortal mounts with its own `auth.onAuthStateChanged` listener
10. **RACE:** LandingPortal's auth listener fires at different time than AuthContext's
11. LandingPortal's `isAuthChecking` might still be true when user interacts
12. User sees "Continue as Guest" button because `currentUser` is null
13. On second attempt, session has propagated, so it works

---

### **Issue 4: Insufficient Delay**

**File:** `src/components/AuthCallback.tsx` (line 20)

```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

**Problem:** 1-second delay might not be enough for:
- Supabase to fully establish the session
- Session to propagate to both auth listeners
- React components to mount and initialize

---

## 📋 **Recommended Fixes**

### **Fix 1: Single AuthProvider Instance (Critical)**

**File:** `src/main.tsx`

**Change:**
```typescript
// Create root once
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);

// Always render App with AuthProvider at top level
root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
```

**Remove:** Conditional rendering of different components with AuthProvider wrappers.

**Update App.tsx to handle routing internally.**

---

### **Fix 2: Unify Auth System (Critical)**

**File:** `src/components/LandingPortal.tsx`

**Change:**
- Remove the separate `auth` import from supabase.ts
- Use `useAuth()` from AuthContext instead
- Replace `auth.onAuthStateChanged` with the context-based approach

**Before:**
```typescript
import { auth, signInWithGooglePortal } from "../lib/supabase";
// ...
const unsubscribe = auth.onAuthStateChanged((usr: any) => {
  setCurrentUser(usr);
  setIsAuthChecking(false);
});
```

**After:**
```typescript
import { useAuth } from "../contexts/AuthContext";
// ...
const { user, loading } = useAuth();
```

---

### **Fix 3: Increase AuthCallback Delay (Temporary)**

**File:** `src/components/AuthCallback.tsx` (line 20)

**Change:**
```typescript
await new Promise(resolve => setTimeout(resolve, 2000)); // Increase to 2 seconds
```

**Reason:** Give more time for session to establish and propagate.

---

### **Fix 4: Better Session Check (Long-term)**

**File:** `src/components/AuthCallback.tsx`

**Instead of fixed delay, poll for session:**
```typescript
const maxRetries = 10;
let retries = 0;

const checkSession = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session || retries >= maxRetries) {
    if (sessionData.session) {
      window.location.href = "/";
    } else {
      window.location.href = "/?error=no_session";
    }
  } else {
    retries++;
    await new Promise(resolve => setTimeout(resolve, 500));
    checkSession();
  }
};

checkSession();
```

---

## 🎯 **Summary**

| Issue | Severity | Root Cause |
|-------|----------|-------------|
| Duplicate AuthProvider instances | 🔴 Critical | New instance on every route change |
| Separate auth systems | 🔴 Critical | LandingPortal uses different auth than rest of app |
| Race condition timing | 🟡 High | Session propagation timing mismatch |
| Insufficient delay | 🟡 High | 1 second not enough for session to propagate |

---

## ✅ **Priority Fixes**

1. **Critical:** Move AuthProvider to top level (single instance)
2. **Critical:** Unify LandingPortal to use AuthContext
3. **High:** Implement better session checking logic
4. **Medium:** Increase callback delay as temporary fix

---

**Root Cause:** Duplicate AuthProvider instances and separate auth systems create a race condition where the session hasn't propagated to the LandingPortal by the time the user tries to enter the app.
