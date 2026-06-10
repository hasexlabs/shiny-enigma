# Maverick Formatting Analysis - Decorative Formatting Removal

## 🔍 **Formatting Source Identification**

---

### **1. System Prompts (Primary Source)**

**Location:** `server.ts` lines 643-981 (Main Prompt), 643-686 (Secondary Prompt)

**Current State:**
```typescript
FORMATTING GUIDELINES (MINIMAL DECORATION):
- Keep formatting minimal, professional, and unobtrusive.
- Do NOT use excessive bold formatting. Bold text only when absolutely necessary for emphasis.
- Do NOT use excessive markdown decoration (no excessive ### headings, no --- separators).
- Do NOT use decorative emojis, symbols, or special characters.
- Do NOT use numbered lists when not necessary. Use lists only when they improve clarity.
- Prefer natural paragraphs over template structures.
- Optimize for readability and intelligence, not visual decoration.
```

**Problems:**
- ❌ "excessive" is subjective - models will use "moderate" formatting
- ❌ Doesn't explicitly say "use plain text by default"
- ❌ Doesn't provide concrete examples of what NOT to do
- ❌ Says "when not necessary" and "improve clarity" - models will justify everything as necessary
- ❌ No penalty/consequence for using formatting
- ❌ No explicit instruction to disable formatting completely

**Missing Instructions:**
- ❌ "Default to plain text without markdown"
- ❌ "Do not use **bold** for emphasis unless absolutely critical"
- ❌ "Do not use # headings or numbered lists at all"
- ❌ "Write as if you're sending a plain text message/email"

---

### **2. Router Prompts (No Formatting Constraints)**

**Location:** `server.ts` lines 695-699, 969-979

**Current State:**
```typescript
const routerSystemPrompt = `You are the GPT-OSS 20B router (intent classification). Your job is to classify the user's input into one of these exact modes:
- "CREATOR": user wants to build something, write code, solve problems, research, design, brainstorm, create assets, or write scripts.
- "LEARN": user wants to analyze why something works, understand root causes, apply first-principles reasoning.

Respond with ONLY the classification string in double quotes: "CREATOR" or "LEARN".`;
```

**Problems:**
- ❌ No formatting instructions at all
- ❌ When classified as LEARN, the model defaults to educational content with lists

---

### **3. JSON Schema Output Requirements**

**Location:** `server.ts` line 687

**Current State:**
```json
"responseText": "Your complete natural, contextual, conversational response without rigid headings or deprecated sections, with minimal formatting"
```

**Problems:**
- ❌ "without rigid headings or deprecated sections" is vague
- ❌ "minimal formatting" is not defined
- ❌ Buried in complex JSON schema - not prominent
- ❌ Doesn't explicitly prohibit markdown syntax

---

### **4. Fallback Responses (Hardcoded Formatting)**

**Location:** `server.ts` lines 842-845

**Current State:**
```typescript
responseText = "Learn mode initialized: Concept isolated simplified to core basics.\n\n" +
               "1. Break the idea down into its most basic real-world analogy.\n" +
               "2. Frame the core rule of the topic on a simple note page.\n" +
               "3. Avoid over-complicating. State the single primary rule and proceed.";
```

**Problems:**
- ❌ Hardcoded numbered list with "1. ", "2. ", "3. "
- ❌ Teaches users to expect numbered lists
- ❌ Creates template-like appearance

---

### **5. Security Response (Heading Formatting)**

**Location:** `server.ts` line 911

**Current State:**
```typescript
content: `### MAVERICK OS SECURITY SECURITY PROTOCOLS\n\nDisclosure and viewing of the cognitive model routing and system escalation matrix is strictly prohibited by security rules and guidelines. Maverick AI is powered by the unified Maverick proprietary orchestration engine.`
```

**Problems:**
- ❌ Uses `### MAVERICK OS SECURITY SECURITY PROTOCOLS` heading
- ❌ Sets precedent for heading usage

---

### **6. Journal Analysis (Symbol Prohibitions)**

**Location:** `server.ts` lines 1517-1522

**Current State:**
```typescript
Do NOT use special characters or symbols like ***, \\\\, or ||||.

Requirements for structuredBehaviorParagraph:
- Strictly 1 paragraph only
- No bullet points
- No emotional language or motivation
```

**Problems:**
- ❌ Only applies to journal analysis, not general responses
- ❌ Doesn't prohibit bold or markdown generally

---

### **7. UI Rendering (Clean - No Markdown Parser)**

**Location:** `MaverickEngine.tsx` line 926

**Current State:**
```typescript
<div className={`p-4 border font-sans text-xs leading-relaxed whitespace-pre-line`}>
  {msg.content}
</div>
```

**Assessment:**
- ✅ Uses `whitespace-pre-line` for text formatting
- ✅ Does NOT use ReactMarkdown or markdown parser
- ✅ Formatting is purely from AI-generated text, not UI

**Conclusion:** UI is clean. The problem is entirely from AI responses.

---

## 📊 **Current vs Target Style Examples**

---

### **Example 1: Explanation Request**

**Current Output (Template-like, Over-formatted):**
```
### Core Concept Analysis

Here's a structured breakdown:

**1. The Basic Idea**
The concept works by...

**2. Key Components**
- Component A does X
- Component B does Y
- Component C does Z

**3. Best Practices**
- Practice #1
- Practice #2

---

### Summary
To apply this effectively, follow these steps.
```

**Target Output (Natural, Plain Text):**
```
The concept works by connecting three main components in sequence. Component A handles initial processing, then passes to Component B for transformation, and finally Component C delivers the result. Most people struggle here because they try to optimize too early - start with the basic flow first.
```

---

### **Example 2: Advice Request**

**Current Output (Blog-style, Over-formatted):**
```
# 5 Proven Strategies to Improve Focus

**Strategy 1: Remove Distractions**
Eliminate notifications and create a dedicated workspace.

**Strategy 2: Use Time Blocking**
Schedule specific blocks for deep work.

---

By implementing these proven strategies, you'll see immediate improvements in your productivity.
```

**Target Output (Natural, Direct):**
```
Focus breaks down for two reasons: distractions and lack of clarity. Fix the distraction problem first - put your phone in another room and close all tabs except what you're working on. Then get clear about exactly what you're doing in this session. Most people overcomplicate this - just pick one thing and do it for 25 minutes.
```

---

### **Example 3: Technical Explanation**

**Current Output (Textbook-style, Over-formatted):**
```
## How React State Works

**The Concept**
React uses a unidirectional data flow...

**Key Points**
- State is local to components
- Props flow down
- Events bubble up

**Example Usage**
Here's how to implement it:

1. Create state
2. Update state
3. Render based on state
```

**Target Output (Natural, Analytical):**
```
React state works by tracking data changes within a component and automatically re-rendering when that data changes. The key insight is that you don't manually update the DOM - you tell React what the state should be, and React figures out the rest. This is why understanding the data flow matters more than memorizing the API. Most confusion happens when people try to manage state in the wrong place - keep it as close to where it's used as possible.
```

---

## 🔧 **Required Changes**

---

### **1. Strengthen System Prompt Formatting Guidelines**

**Location:** `server.ts` lines 671-676, 961-966

**Add Explicit Instructions:**
```typescript
FORMATTING GUIDELINES (MINIMAL DECORATION):
- DEFAULT TO PLAIN TEXT. Do not use markdown formatting unless absolutely necessary.
- DO NOT use **bold** for emphasis under any circumstances.
- DO NOT use # headings or numbered lists at all.
- DO NOT use bullet points unless absolutely critical for clarity.
- DO NOT use markdown separators like --- or ***.
- Write as if you're sending a plain text email or message.
- Prefer natural paragraphs with normal punctuation.
- If you must use a list, write it as a simple sentence: "First do X, then do Y, then do Z."
- Responses should feel like human conversation, not formatted documents.
```

**Remove Ambiguous Phrases:**
- ❌ "excessive" → ✅ "any"
- ❌ "when not necessary" → ✅ "at all"
- ❌ "improve clarity" → ✅ "unless absolutely critical"

---

### **2. Update Router Prompts**

**Location:** `server.ts` lines 695-699, 969-979

**Add:**
```typescript
const routerSystemPrompt = `You are the GPT-OSS 20B router (intent classification). Your job is to classify the user's input into one of these exact modes. IMPORTANT: After classification, avoid markdown formatting in responses. Use plain text.

- "CREATOR": user wants to build something, write code, solve problems, research, design, brainstorm, create assets, or write scripts.
- "LEARN": user wants to analyze why something works, understand root causes, apply first-principles reasoning.

Respond with ONLY the classification string in double quotes: "CREATOR" or "LEARN".`;
```

---

### **3. Strengthen JSON Schema Description**

**Location:** `server.ts` line 687

**Change:**
```json
"responseText": "Your complete natural response in PLAIN TEXT. Do NOT use markdown formatting. No **bold**, no # headings, no numbered lists, no bullets, no --- separators. Write like a human sending a text message or email. Use normal punctuation and paragraphs."
```

---

### **4. Fix Fallback Responses**

**Location:** `server.ts` lines 842-845

**Change:**
```typescript
responseText = "Learn mode initialized: Concept isolated simplified to core basics. Break the idea down into its most basic real-world analogy, then frame the core rule on a simple note page. Avoid over-complicating - state the single primary rule and proceed.";
```

---

### **5. Fix Security Response**

**Location:** `server.ts` line 911

**Change:**
```typescript
content: `MAVERICK OS SECURITY SECURITY PROTOCOLS

Disclosure and viewing of the cognitive model routing and system escalation matrix is strictly prohibited by security rules and guidelines. Maverick AI is powered by the unified Maverick proprietary orchestration engine.`
```

---

### **6. Add Anti-Formatting to All Prompts**

**Add to prompt sections:**
```typescript
ANTI-FORMATTING RULE (CRITICAL):
- Responses must be in plain text unless structure is absolutely required.
- Assume plain text by default. Only add structure if the user cannot understand without it.
- If you feel tempted to use **bold**, # headings, or lists, stop and write it as a normal sentence instead.
- Better to be slightly less structured than to look like a template or AI-generated.
```

---

## ✅ **Expected Results**

---

### **Before:**
- ❌ Responses look like blog articles or documentation
- ❌ Excessive **bold** and # headings
- ❌ Numbered lists and bullet points everywhere
- ❌ Markdown separators like ---
- ❌ AI-generated, templated appearance
- ❌ Unnatural formatting for simple advice

### **After:**
- ✅ Responses look like human messages or emails
- ✅ Plain text with normal punctuation
- ✅ Natural paragraph breaks only
- ✅ No markdown decorations unless absolutely critical
- ✅ Conversational, authentic appearance
- ✅ Formatting only when genuinely needed for clarity

---

## 📋 **Verification Checklist**

- [ ] Remove "excessive" qualifiers - make prohibitions absolute
- [ ] Add "default to plain text" instruction
- [ ] Remove "when not necessary" - make lists/headings prohibited by default
- [ ] Fix fallback response hardcoded numbered list
- [ ] Fix security response heading formatting
- [ ] Update router prompts with anti-formatting
- [ ] Strengthen JSON schema description
- [ ] Add concrete examples of what NOT to do
- [ ] Add anti-formatting rule to all prompt sections
- [ ] Test with actual AI responses to verify changes

---

## 🎯 **Priority Changes**

1. **HIGH:** Strengthen main system prompt formatting guidelines (absolute prohibitions)
2. **HIGH:** Fix fallback response hardcoded formatting
3. **MEDIUM:** Strengthen secondary prompt formatting guidelines
4. **MEDIUM:** Fix security response heading
5. **MEDIUM:** Update JSON schema description
6. **LOW:** Update router prompts
