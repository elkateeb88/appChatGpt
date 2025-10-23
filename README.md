# 🌟 Numeroesim Communication Plans

## Overview

**Numeroesim** is a prototype application specializing in communication services (virtual numbers and eSIM packages), built using the **OpenAI Apps SDK** based on the **Model Context Protocol (MCP)**.

This prototype focuses on an **attractive look and feel** to present to business owners, using realistic mock data inspired by global communication services.

---

## ✨ Key Features

### 🎯 Tools

#### 1️⃣ `display_communication_plans`
- Displays available plans in an attractive interactive interface.
- Filters by service type (eSIM, virtual numbers, all).
- Responsive design that fits all devices.

#### 2️⃣ `activate_plan`
- Simulates the plan activation process.
- Returns an immediate confirmation with details.

#### 3️⃣ `review_plan_details`
- Displays detailed information about any plan.
- Terms of use and payment methods.

### 🎨 UI/UX Design

- ✅ **Modern Design**: Attractive gradient colors.
- ✅ **App SDK Compliant**: Simple, consistent, uses system colors.
- ✅ **Interactive**: Animated buttons with hover effects.
- ✅ **Responsive**: Works on all screen sizes.
- ✅ **"Most Popular" Badge**: Clear highlighting for the featured plan.

---

## 📦 Available Plans (Demo Data)

### 1. Virtual Number Plan 📱
- **Price**: $3.99 / month
- **Features**:
  - US/International phone number
  - 100 local call minutes
  - Unlimited SMS reception

### 2. Global Data Plan 🌍
- **Price**: $19.99 / 7 days
- **Features**:
  - 5 GB travel data
  - Coverage in 100+ countries
  - Instant activation (eSIM)

### 3. Complete Bundle ⭐ (Most Popular)
- **Price**: $49.99 / month
- **Features**:
  - Virtual number + data
  - 10GB global data
  - 300 international minutes

---

## 🚀 Installation and Running

### Prerequisites
- Node.js v18 or later
- npm or yarn

### Installation Steps

```bash
# 1. Clone the project
git clone https://github.com/elkateeb88/appChatGpt.git
cd appChatGpt

# 2. Install dependencies
npm install

# 3. Run the server
npm start
```

### Local Testing with MCP Inspector

```bash
# Use the convenient script
./start-inspector.sh

# Or run manually
npx @modelcontextprotocol/inspector node src/index.js

# Or with the shell script
npx @modelcontextprotocol/inspector ./run-mcp-server.sh
```

The inspector will:
- Start on `http://localhost:6274`
- Open automatically in your browser
- Display an authentication token
- Show all available tools for testing

**For detailed testing instructions, see [TESTING.md](TESTING.md)**

---

## 🎭 Presentation Scenario

### Scenario 1: Display Plans

**User says in ChatGPT**:
> "What are the available Numeroesim plans?"

**ChatGPT calls**:
```javascript
display_communication_plans(service_type='all')
```

**Result**:
- Displays an interactive interface with the three plans.
- Attractive design with gradient colors.
- Clear buttons for activation and review.

### Scenario 2: Activate a Plan

**User clicks on**: "Activate Plan" (for the Complete Bundle)

**JavaScript sends**:
```javascript
window.openai.postMessage('action:purchase_plan', {
  plan_id: 'combo-plan',
  user_intent: 'Please activate the Complete Bundle'
})
```

**ChatGPT calls**:
```javascript
activate_plan(plan_id='combo-plan')
```

**Result**:
```
✅ "Complete Bundle" has been activated successfully!

💰 Price: $49.99 / month
📦 Features:
  • Virtual number + data
  • 10GB global data
  • 300 international minutes

📧 Activation details will be sent to your email.
⏰ Actual Activation: Instant (simulation)
```

### Scenario 3: Review Details

**User clicks on**: "Review Features"

**Result**:
- Detailed information about the plan.
- Terms of use.
- Available payment methods.
- Technical support information.

---

## 🏗️ Technical Architecture

### Project Structure

```
appChatGpt/
├── src/
│   └── index.js                    # Main MCP server
├── public/
│   └── ui/
│       └── plans-display.html      # Interactive user interface
├── package.json                    # Dependencies
├── numeroesim-mcp-config.json           # MCP configuration
├── README.md                       # This file
├── DEPLOYMENT.md                   # Deployment guide
└── .gitignore
```

### Data Flow

```
ChatGPT User Input
       ↓
MCP Tool Call (display_communication_plans)
       ↓
src/index.js (Server)
       ↓
Generate HTML (generatePlansHTML)
       ↓
Return UI Resource
       ↓
ChatGPT Displays UI
       ↓
User Clicks Button
       ↓
window.openai.postMessage / window.parent.postMessage
       ↓
MCP Tool Call (activate_plan / review_plan_details)
       ↓
Return Confirmation Text
       ↓
ChatGPT Displays Result
```

---

## 🎨 Design Strengths

### 1. Seamless Integration
The interface doesn't look like an external element but blends perfectly with the ChatGPT look and feel through:
- Use of system colors and fonts.
- Simple and clear design.
- Smooth transitions.

### 2. Simplified UX
- Each service card has only two clear actions.
- Large and clear buttons.
- Immediate feedback.

### 3. Realistic Mock Data
- Logical prices inspired by the market.
- Realistic plan features.
- Names in both Arabic and English.

---

## 📊 Tool Schema

### Tool: `display_communication_plans`

```json
{
  "name": "display_communication_plans",
  "description": "Used to display available Numeroesim plans, such as virtual numbers and eSIM packages, in an interactive interface within ChatGPT.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "service_type": {
        "type": "string",
        "description": "The type of service to display plans for. Can be 'eSIM', 'virtual_numbers', or 'all' (default).",
        "enum": ["eSIM", "virtual_numbers", "all"],
        "default": "all"
      }
    },
    "required": []
  }
}
```

---

## 🔧 ChatGPT Integration

### Method 1: MCP Inspector (for testing and debugging)
```bash
# Easiest way
./start-inspector.sh

# Or manually
npx @modelcontextprotocol/inspector node src/index.js
```

This launches a web interface for testing all tools interactively.

### Method 2: Claude Desktop Integration

Add to the configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "numeroesim": {
      "command": "node",
      "args": ["/absolute/path/to/appChatGpt/src/index.js"]
    }
  }
}
```

Or use the shell script:

```json
{
  "mcpServers": {
    "numeroesim": {
      "command": "/absolute/path/to/appChatGpt/run-mcp-server.sh"
    }
  }
}
```

After adding the configuration:
1. Restart Claude Desktop
2. The Numeroesim tools will be available
3. Ask Claude to display plans or activate services

---

## 🎯 Selling Points for Presentation

### 1. Technical Innovation
- Use of the latest technologies (MCP, OpenAI Apps SDK).
- Seamless integration with ChatGPT.
- Interactive interface without needing a separate app.

### 2. Premium User Experience
- Modern and attractive design.
- Ease of use.
- Full support for Arabic.

### 3. Flexibility and Scalability
- Easy to add new plans.
- Can be integrated with payment systems.
- Fully customizable.

### 4. Low Cost
- No need to develop a separate iOS/Android app.
- Lightweight hosting.
- Simple maintenance.

---

## 📝 Presentation Notes

### Before the presentation:
1. ✅ Make sure the server is running successfully (`npm start`).
2. ✅ Open MCP Inspector for a live demo.
3. ✅ Prepare presentation scenarios (plans, activation, details).
4. ✅ Check that the interface is working correctly.

### During the presentation:
1. 🎤 Start by explaining the problem (difficulty of interactively displaying services).
2. 💡 Explain the solution (integration with ChatGPT).
3. 🖥️ Show the live interface.
4. 🎯 Emphasize ease of use.
5. 📊 Mention the business benefits.

### Expected Questions:
- **Q: Can the plans be customized?**
  - A: Yes, very easily by modifying the `src/index.js` file.

- **Q: How is real payment handled?**
  - A: It can be integrated with Stripe, PayPal, or any payment gateway.

- **Q: Does it work on mobile?**
  - A: Yes, the design is fully responsive.

- **Q: What is the cost?**
  - A: Only the hosting cost (very low).

---

## 🤝 Contribution and Development

To contribute to the prototype development:

```bash
# Fork the project
git clone https://github.com/your-username/appChatGpt.git

# Create a new branch
git checkout -b feature/new-feature

# Apply changes
git commit -am 'Add new feature'

# Push
git push origin feature/new-feature

# Create a Pull Request
```

---

## 📚 References and Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [OpenAI Platform Documentation](https://platform.openai.com/docs)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/sdk)

---

## 📄 License

MIT License - Open Source

---

## 👥 Team

**Numeroesim Communications Team**
- Development: Numeroesim Technical Team
- Design: UX/UI Department
- Product: Product Management

---

## 📞 Contact

For any inquiries or suggestions, please contact:
- Email: info@numeroesim.com (imaginary)
- GitHub Issues: [Create Issue](https://github.com/elkateeb88/appChatGpt/issues)

---

<div align="center">

**Built with ❤️ using OpenAI Apps SDK & Model Context Protocol**

🌟 If you like the project, don't forget to give it a star! 🌟

</div>