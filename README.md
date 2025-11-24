# 🚀 AI Lead Generation Platform

> A comprehensive AI-powered platform for automated lead generation, enrichment, and outreach automation - built to compete with Leadverse.ai, Apollo.io, and Clay.com

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://www.python.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-AI-purple)](https://github.com/langchain-ai/langgraph)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

## 🎯 Overview

This platform combines **LangGraph AI agents**, **waterfall data enrichment**, and **multi-channel outreach** to create a complete lead generation solution. Built for scale, performance, and cost-efficiency.

### Key Features

- 🤖 **AI-Powered Agents**: Research, qualification, and email generation
- 📊 **Waterfall Enrichment**: Multiple providers (Clearbit, Apollo, Hunter)
- 📧 **Smart Email Infrastructure**: AWS SES + SendGrid with warm-up
- 📈 **Real-time Analytics**: Dashboard, funnels, and trends
- 💰 **Cost-Optimized**: 50-70% cheaper LLM usage
- 🐳 **Production-Ready**: Docker, monitoring, rate limiting

## 🚀 Quick Start

### 1. Setup

```bash
# Clone and checkout branch
git clone <repo-url>
cd appChatGpt

# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

### 2. Start with Docker

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

### 3. Access API

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### 4. Create Your First Lead

```bash
curl -X POST "http://localhost:8000/api/leads/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prospect@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Corp",
    "title": "VP of Sales"
  }'
```

The lead will automatically:
1. ✅ Be enriched via waterfall strategy
2. ✅ Get researched by AI
3. ✅ Be qualified and scored (0-10)
4. ✅ Have a personalized email generated (if score ≥ 7)

## 📚 Documentation

See **[PROJECT_README.md](PROJECT_README.md)** for comprehensive documentation including:

- Complete architecture overview
- API endpoint reference
- AI agents deep-dive
- Deployment guides
- Cost optimization strategies
- Roadmap and features

## 🏗️ Architecture

```
FastAPI Application
├── API Layer           (leads, campaigns, enrichment, analytics)
├── Services Layer      (enrichment, email, campaign executor)
├── AI Agents           (research, qualification, email generation)
├── Data Layer          (PostgreSQL, Redis)
└── Integrations        (Clearbit, Apollo, AWS SES, OpenAI)
```

### LangGraph Workflow

```
Lead → Research Agent → Qualification Agent → Email Generation Agent → Send
         (analyze)         (score 0-10)          (personalize)
```

## 🤖 AI Agents

### Research Agent
- Analyzes lead and company data
- Identifies pain points and buying signals
- Finds personalization opportunities

### Qualification Agent
- Scores leads 0-10 using structured criteria
- ICP matching and buying authority assessment
- Minimum score 7 for outreach

### Email Generation Agent
- Creates personalized cold emails (max 125 words)
- Conversational, non-salesy tone
- Specific personalization hooks

## 📊 API Endpoints

### Leads
```
POST   /api/leads/              # Create + enrich
GET    /api/leads/              # List with filters
GET    /api/leads/{id}          # Get by ID
PUT    /api/leads/{id}          # Update
DELETE /api/leads/{id}          # Delete
POST   /api/leads/bulk          # Bulk create
```

### Campaigns
```
POST   /api/campaigns/                 # Create campaign
GET    /api/campaigns/{id}             # Get campaign
POST   /api/campaigns/{id}/start       # Start campaign
GET    /api/campaigns/{id}/analytics   # Campaign metrics
```

### Enrichment
```
POST   /api/enrichment/enrich          # Enrich email
POST   /api/enrichment/enrich/{id}     # Enrich by ID
POST   /api/enrichment/bulk-enrich     # Bulk enrich
```

### Analytics
```
GET    /api/analytics/dashboard        # Dashboard stats
GET    /api/analytics/trends           # Time-series
GET    /api/analytics/funnel           # Conversion funnel
```

## ⚙️ Configuration

Required environment variables:

```env
# Core
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/leadgen_db
REDIS_URL=redis://redis:6379

# AI
OPENAI_API_KEY=sk-your-key

# Data Providers (optional)
CLEARBIT_API_KEY=your-key
APOLLO_API_KEY=your-key
HUNTER_API_KEY=your-key

# Email (optional)
AWS_SES_ACCESS_KEY=your-key
AWS_SES_SECRET_KEY=your-secret
SENDGRID_API_KEY=your-key
```

## 💰 Cost Optimization

**LLM Costs (per qualified lead):**
- Enrichment: $0.005-0.01
- Qualification: $0.001-0.002
- Email Generation: $0.003-0.005
- **Total: $0.01-0.02**

**Techniques:**
- Model selection (gpt-4o-mini for most tasks)
- Response length control (max_tokens)
- Prompt compression (62% reduction)
- Redis caching (7 days)
- Temperature optimization

## 🚢 Deployment

### Option 1: Railway.app (Fastest)
```bash
railway login
railway init
railway up
```

### Option 2: AWS
- ECS Fargate for containers
- RDS PostgreSQL
- ElastiCache Redis
- CloudWatch monitoring

### Option 3: DigitalOcean
- App Platform
- Managed PostgreSQL
- Managed Redis

## 🗺️ Roadmap

- ✅ **Phase 1 (MVP)**: FastAPI backend, AI agents, enrichment
- 🚧 **Phase 2**: Frontend, Chrome extension, A/B testing
- 📋 **Phase 3**: Multi-channel, intent data, AI SDR
- 🎯 **Phase 4**: Marketplace, white-label, enterprise features

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

Contributions welcome! Fork, create a branch, and submit a PR.

---

**Built with ❤️ using FastAPI, LangGraph, and modern Python**

For detailed documentation, see [PROJECT_README.md](PROJECT_README.md)
