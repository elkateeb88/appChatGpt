# 🚀 Setup Numeroesim with OpenAI ChatGPT Apps

## ✅ Your Server is Ready!

Your Numeroesim API is now running and accessible publicly via ngrok.

### 📍 Important URLs:

- **Public API URL**: `https://a654ebb66d8a.ngrok-free.app`
- **Manifest URL**: `https://a654ebb66d8a.ngrok-free.app/.well-known/ai-plugin.json`
- **OpenAPI Spec**: `https://a654ebb66d8a.ngrok-free.app/openapi.json`
- **Local Server**: `http://localhost:3000`

---

## 🔧 How to Add to ChatGPT

### Step 1: Go to ChatGPT Apps

1. Open ChatGPT: https://chat.openai.com
2. Click on your profile picture (bottom left)
3. Go to **"Settings"**
4. Select **"Beta features"**
5. Enable **"Apps"** (if not already enabled)

### Step 2: Add Your App

1. In ChatGPT, click on your profile
2. Go to **"My GPTs"** or **"Apps"**
3. Click **"Create a GPT"** or **"Add App"**
4. Choose **"Import from URL"** or **"Plugin manifest"**
5. Enter your manifest URL:
   ```
   https://a654ebb66d8a.ngrok-free.app/.well-known/ai-plugin.json
   ```

### Step 3: Test Your App

Once added, try these prompts in ChatGPT:

```
"Show me Numeroesim communication plans"
"What eSIM plans are available?"
"Tell me about the combo plan"
"Activate the virtual number plan"
```

---

## 📋 Available API Endpoints

### 1. Get All Plans
```bash
GET https://a654ebb66d8a.ngrok-free.app/api/plans
GET https://a654ebb66d8a.ngrok-free.app/api/plans?service_type=eSIM
GET https://a654ebb66d8a.ngrok-free.app/api/plans?service_type=virtual_numbers
```

### 2. Get Plan Details
```bash
GET https://a654ebb66d8a.ngrok-free.app/api/plans/combo-plan
GET https://a654ebb66d8a.ngrok-free.app/api/plans/esim-data
GET https://a654ebb66d8a.ngrok-free.app/api/plans/virtual-number
```

### 3. Activate Plan
```bash
POST https://a654ebb66d8a.ngrok-free.app/api/plans/combo-plan/activate
```

---

## 🧪 Testing the API

Test your API endpoints using curl:

```bash
# Get all plans
curl https://a654ebb66d8a.ngrok-free.app/api/plans

# Get manifest
curl https://a654ebb66d8a.ngrok-free.app/.well-known/ai-plugin.json

# Get OpenAPI spec
curl https://a654ebb66d8a.ngrok-free.app/openapi.json

# Activate a plan
curl -X POST https://a654ebb66d8a.ngrok-free.app/api/plans/combo-plan/activate
```

---

## 🔄 Keeping the Server Running

Your server is currently running in two processes:

1. **Express Server** (port 3000):
   ```bash
   npm run openai
   ```

2. **ngrok Tunnel** (exposing port 3000):
   ```bash
   ngrok http 3000
   ```

**Important Notes:**

- The ngrok URL (`https://a654ebb66d8a.ngrok-free.app`) will change if you restart ngrok
- Free ngrok URLs expire after some time
- Keep both processes running for the app to work

---

## 🛠️ Restarting the Server

If you need to restart:

```bash
# 1. Start the Express server
npm run openai

# 2. In another terminal, start ngrok
ngrok http 3000

# 3. Get the new ngrok URL
curl http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'

# 4. Update the URL in ChatGPT if it changed
```

---

## 📝 Alternative: Using a Permanent Domain

For production use, consider:

### Option 1: Deploy to a Cloud Provider

- **Heroku**: Free tier available
- **Railway**: Easy deployment
- **Vercel**: Great for Node.js apps
- **DigitalOcean**: Affordable VPS

### Option 2: Get ngrok Pro

- Permanent domain
- No session limits
- Custom subdomains

### Option 3: Use Cloudflare Tunnel

Free alternative to ngrok with permanent URLs.

---

## 🐛 Troubleshooting

### Issue: ngrok URL changed

**Solution**: Get the new URL and update it in ChatGPT:
```bash
curl http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

### Issue: Server not responding

**Solution**: Check if the Express server is running:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","service":"numeroesim-api"}
```

### Issue: ChatGPT can't access the app

**Possible causes:**

1. **ngrok session expired**: Restart ngrok
2. **Server crashed**: Check logs and restart with `npm run openai`
3. **Firewall blocking**: Check your network settings
4. **Wrong manifest URL**: Make sure you're using the correct ngrok URL

---

## 📊 Monitoring

### Check ngrok traffic:

Open in browser: http://localhost:4040 (or 4041 if 4040 is busy)

This shows:
- All requests to your API
- Request/response details
- Traffic statistics

### Check server logs:

The Express server logs all requests to the console where you ran `npm run openai`

---

## 🎯 Next Steps

1. ✅ Server is running
2. ✅ ngrok tunnel is active
3. ⏳ Add app to ChatGPT
4. ⏳ Test with real prompts
5. ⏳ Deploy to production (optional)

---

## 📚 Resources

- **OpenAI Apps Documentation**: https://openai.com/index/introducing-apps-in-chatgpt/
- **ngrok Documentation**: https://ngrok.com/docs
- **Your Project README**: [README.md](README.md)
- **Testing Guide**: [TESTING.md](TESTING.md)

---

**Created**: $(date)
**Status**: ✅ Ready for ChatGPT Integration
**Public URL**: https://a654ebb66d8a.ngrok-free.app
