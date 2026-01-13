# 🔑 Setup OpenAI API Key

## **Current Status**
❌ **OPENAI_API_KEY:** Not configured  
❌ **ANTHROPIC_API_KEY:** Not configured

---

## **How to Add OpenAI API Key**

### **Option 1: Add to `.env` file (Recommended)**

1. **Get your OpenAI API key:**
   - Go to: https://platform.openai.com/api-keys
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (starts with `sk-...`)

2. **Add to `.env` file:**
   ```bash
   # Open .env file
   nano .env
   
   # Add this line (replace with your actual key):
   OPENAI_API_KEY=sk-your-actual-key-here
   
   # Save and exit (Ctrl+X, then Y, then Enter)
   ```

3. **Restart backend:**
   ```bash
   pkill -f "python3.*server.py"
   cd backend && python3 server.py
   ```

---

### **Option 2: Set as Environment Variable**

```bash
# Temporary (current session only)
export OPENAI_API_KEY="sk-your-actual-key-here"
cd backend && python3 server.py
```

---

### **Option 3: Use Anthropic (Claude) Instead**

If you prefer Claude over GPT:

1. **Get Anthropic API key:**
   - Go to: https://console.anthropic.com/
   - Create account and get API key

2. **Add to `.env`:**
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

3. **Restart backend**

---

## **Verify Setup**

After adding the key, verify it's working:

```bash
# Check AI service status
curl http://localhost:8000/api/ai/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
{
  "enabled": true,
  "provider": "openai",  # or "anthropic"
  "configured": true
}
```

---

## **Test AI Endpoints**

### **Generate Item Description:**
```bash
curl -X POST http://localhost:8000/api/ai/generate-description \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Premium Wireless Headphones",
    "category": "product",
    "type": "item"
  }'
```

### **Generate Link Description:**
```bash
curl -X POST http://localhost:8000/api/ai/generate-description \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Portfolio",
    "url": "https://example.com",
    "category": "portfolio",
    "type": "link"
  }'
```

### **Generate Bio:**
```bash
curl -X POST http://localhost:8000/api/ai/generate-bio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "profession": "Designer"
  }'
```

---

## **Cost Considerations**

**OpenAI Pricing (GPT-3.5-turbo):**
- ~$0.0015 per 1K tokens
- Average description: ~50-100 tokens
- Cost per generation: ~$0.0001-0.0002 (very cheap!)

**Free Tier:**
- New accounts get $5 free credit
- Enough for ~25,000-50,000 generations

---

## **Without API Key**

If you don't want to use AI:
- ✅ All other features work normally
- ❌ AI endpoints return 503 (Service Unavailable)
- ✅ Users can still manually write descriptions

---

## **Quick Setup Command**

Run this to add OpenAI key to `.env`:

```bash
# Replace YOUR_KEY with actual key
echo "OPENAI_API_KEY=sk-your-actual-key-here" >> .env

# Restart backend
pkill -f "python3.*server.py"
cd backend && python3 server.py
```

---

## **Need Help?**

1. **Get OpenAI Key:** https://platform.openai.com/api-keys
2. **Get Anthropic Key:** https://console.anthropic.com/
3. **Check AI Status:** `GET /api/ai/status`

---

**Next Step:** Get your API key and add it to `.env` file! 🚀








