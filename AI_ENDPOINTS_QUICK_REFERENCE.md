# 🤖 AI Endpoints - Quick Reference

## 📍 **Endpoints**

### **1. Generate Description**
```
POST /api/ai/generate-description
Authorization: Bearer {token}
Rate Limit: 10/minute

Body:
{
  "title": "My Portfolio",
  "url": "https://example.com",     // Required for type="link"
  "category": "portfolio",          // Optional
  "type": "link"                    // "link" or "item"
}

Response:
{
  "description": "Showcase of professional work...",
  "type": "link",
  "provider": "openai"
}
```

**Input Types:**
- `type: "link"` → Generates link description (requires URL)
- `type: "item"` → Generates product/service description

---

### **2. Generate Bio**
```
POST /api/ai/generate-bio
Authorization: Bearer {token}
Rate Limit: 5/minute

Body:
{
  "name": "John Doe",
  "profession": "Designer",          // Optional
  "links": [                         // Optional
    {"title": "Portfolio", "url": "https://..."}
  ]
}

Response:
{
  "bio": "Designer creating beautiful experiences...",
  "provider": "openai"
}
```

---

### **3. Suggest Category**
```
POST /api/ai/suggest-category
Authorization: Bearer {token}
Rate Limit: 20/minute

Body:
{
  "title": "My YouTube Channel",
  "url": "https://youtube.com/@channel"
}

Response:
{
  "categories": ["media"],
  "provider": "openai"
}
```

**Fallback:** Returns `["general"]` if AI unavailable

---

### **4. Check AI Status**
```
GET /api/ai/status
Authorization: Bearer {token}  // Optional

Response:
{
  "enabled": true,
  "provider": "openai",
  "configured": true
}
```

---

## ⚙️ **Setup**

**1. Set API Key:**
```bash
export OPENAI_API_KEY="sk-..."
# OR
export ANTHROPIC_API_KEY="sk-ant-..."
```

**2. Install Library:**
```bash
pip install openai      # For OpenAI
# OR
pip install anthropic   # For Anthropic
```

**3. Restart Backend:**
```bash
python3 -m uvicorn server:app --reload
```

---

## 🔍 **Input Validation**

| Field | Type | Required | Max Length | Validation |
|-------|------|----------|------------|------------|
| `title` | string | ✅ Yes | 200 chars | Non-empty, trimmed |
| `url` | string | Conditional | - | Required for `type="link"` |
| `category` | string | ❌ No | 50 chars | Trimmed |
| `type` | string | ✅ Yes | - | Must be "link" or "item" |
| `name` | string | ✅ Yes | 100 chars | Non-empty, trimmed |

---

## 📊 **Firestore Status**

✅ **All collections verified:**
- `users`: 3 documents
- `links`: 5 documents
- `items`: 4 documents
- `rings`: 1 document
- `analytics`: 6 documents
- `sessions`: 58 documents
- `audit_logs`: 64 documents
- `refresh_tokens`: 68 documents

**No new collections needed** - AI endpoints read from existing data.

---

## 🎯 **Usage Examples**

### **Generate Link Description:**
```javascript
const response = await fetch('/api/ai/generate-description', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Portfolio',
    url: 'https://example.com',
    category: 'portfolio',
    type: 'link'
  })
});

const { description } = await response.json();
// Use description in your form
```

### **Generate Item Description:**
```javascript
const response = await fetch('/api/ai/generate-description', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Premium Widget',
    category: 'product',
    type: 'item'
  })
});

const { description } = await response.json();
// Use description for your product
```

---

## ✅ **Status**

✅ AI Service implemented  
✅ 4 endpoints created  
✅ Input validation complete  
✅ Rate limiting configured  
✅ Firestore checked  
✅ Error handling added  
✅ Configuration ready  

**Ready to use!** 🚀








