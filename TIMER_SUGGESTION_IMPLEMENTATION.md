# Timer Suggestion Feature - Implementation Summary

## ✅ **Backend Implementation Complete**

---

### **New Endpoint: `POST /api/timer-suggestion`**

**Purpose:** Proactively detect when a timer would increase completion probability

**Input:**
```json
{
  "message": "I'm going to study for 45 minutes."
}
```

**Output:**
```json
{
  "success": true,
  "shouldSuggest": true,
  "reason": "User mentioned studying with explicit duration",
  "suggestion": "A focused 45-minute session could help. Would you like me to set a 45-minute timer?",
  "duration": 45,
  "model": "llama-3.2-1b-instruct"
}
```

---

### **Model Cascade**

As specified by user:
1. `llama-3.2-1b-instruct` (Core Model)
2. `llama-3.2-3b-instruct` (Fallback 1)
3. `nemotron-mini-4b-instruct` (Fallback 2)
4. `llama-3.1-8b-instruct` (Fallback 3)

---

### **Detection Criteria**

The AI analyzes the message for activities that benefit from timers:
- studying
- deep work
- focused work sessions
- exercise
- habits
- productivity tasks
- deadlines
- time blocking
- sprint work

---

### **Rules Implemented**

✅ Extracts duration if explicitly mentioned (e.g., "45 minutes", "an hour")
✅ Sets duration to null if not mentioned
✅ Never forces a timer - suggests only
✅ Always asks permission first
✅ Suggests only when genuinely helpful
✅ Returns concise suggestions (no markdown)
✅ Returns shouldSuggest: false for irrelevant messages

---

### **Examples**

| Input | Output |
|-------|--------|
| "I'm going to study for 45 minutes." | shouldSuggest: true, duration: 45, suggestion: "A focused 45-minute session could help. Would you like me to set a 45-minute timer?" |
| "I need to work on math for an hour." | shouldSuggest: true, duration: 60, suggestion: "Would you like me to set a 60-minute timer for that session?" |
| "I should probably do some coding." | shouldSuggest: true, duration: null, suggestion: "How long do you want to focus? I can set a timer for you." |
| "What's the weather like?" | shouldSuggest: false, suggestion: null |

---

## ⚠️ **Frontend Integration Required**

---

### **Implementation Approach**

The frontend should call the timer suggestion endpoint when the user sends a message, then optionally display the suggestion based on the response.

---

### **Recommended Implementation**

**File:** `MaverickEngine.tsx` (or wherever the chat input is handled)

**Step 1: After user submits message**

```typescript
// After user sends message
async function handleSendMessage(message: string) {
  // 1. Call timer suggestion endpoint
  const timerResponse = await fetch('/api/timer-suggestion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const timerData = await timerResponse.json();

  // 2. Send message to main chat endpoint as usual
  await sendMessageToChat(message);

  // 3. Display timer suggestion if appropriate
  if (timerData.shouldSuggest && timerData.suggestion) {
    displayTimerSuggestion(timerData.suggestion, timerData.duration);
  }
}
```

**Step 2: Display suggestion as a toast/modal**

The suggestion should appear as a non-intrusive prompt:
- Don't automatically start the timer
- Give user a clear accept/decline option
- If user accepts, then use the existing timer mechanism

```typescript
function displayTimerSuggestion(suggestion: string, duration: number | null) {
  // Show a toast/banner with the suggestion
  // Example UI:
  // ┌─────────────────────────────────────┐
  // │ Maverick: {suggestion}            │
  // │ [Accept] [No thanks]               │
  // └─────────────────────────────────────┘

  // If user clicks "Accept":
  if (userAccepted) {
    if (duration) {
      startTimer(duration, taskDescription);
    } else {
      promptUserForDuration(); // Ask "How long?"
    }
  }
}
```

---

### **Alternative: Inline Suggestion**

The suggestion could appear as a quick follow-up in the chat:

```
User: I'm going to study for 45 minutes.

Maverick: [Normal response]

[Timer Suggestion] A focused 45-minute session could help. Would you like me to set a 45-minute timer? [Yes] [No]
```

---

### **Integration with Existing Timer System**

The existing system already has:
- `[START_TIMER: minutes, task_description]` token format
- Timer activation rules in the system prompt
- Fallback local calculation when API unavailable

The new endpoint doesn't interfere with this - it's a parallel check that the frontend calls separately.

---

## 📋 **Testing Checklist**

- [ ] Test with explicit duration: "study for 45 minutes"
- [ ] Test without duration: "do some coding"
- [ ] Test with irrelevant message: "what's the weather"
- [ ] Test with various timer-relevant activities
- [ ] Test API key failure (should return shouldSuggest: false)
- [ ] Test model cascade fallback (if first model fails)
- [ ] Verify suggestions are concise (no markdown)
- [ ] Verify permissions are always requested

---

## 🎯 **User Experience Flow**

```
User types: "I'm going to study for 45 minutes"
  ↓
Frontend calls /api/timer-suggestion
  ↓
AI analyzes and returns: shouldSuggest: true, duration: 45
  ↓
Frontend displays suggestion: "A focused 45-minute session could help. Would you like me to set a 45-minute timer?"
  ↓
User clicks "Accept"
  ↓
Frontend starts 45-minute timer
  ↓
User studies with timer running
```

---

## 🔧 **Configuration**

**Environment Variable Required:**
- `NVIDIA_API_KEY` or `RAG_LLM_API_KEY`

**If No API Key:**
- Returns shouldSuggest: false
- Reason: "API key required for timer suggestion detection"
- Frontend should handle gracefully (don't show suggestions)

---

## 📝 **Notes**

- This is a separate endpoint from the main chat
- The main chat system's TIMER SYSTEM ACTIVATION RULES still apply (they're for when the user explicitly asks or agrees)
- This new endpoint is for proactive suggestion before the user asks
- Models are smaller/faster than the main chat cascade for quick response
- Suggestions are always optional - never forced
