---
title: PulmoScan AI API
emoji: 🫁
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# PulmoScan AI - API

FastAPI service that serves the PulmoScan CNN (pneumonia detection from chest
X-rays) with Grad-CAM explanations. The block above is the configuration
Hugging Face Spaces reads when this folder is pushed as a Docker Space.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Is the server up and the model loaded? |
| `/api/predict` | POST | Multipart upload (`file`) -> prediction, probabilities, Grad-CAM |
| `/api/model/insights` | GET | Architecture, dataset and measured metrics |
| `/docs` | GET | Interactive Swagger documentation |

Environment variables:

| Name | Example | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | `https://pulmoscan-ai.netlify.app` | Comma-separated frontend origins allowed by CORS |
| `ALLOWED_ORIGIN_REGEX` | `https://.*--pulmoscan-ai\.netlify\.app` | Optional, for Netlify deploy previews |
| `MAX_UPLOAD_MB` | `10` | Upload size limit |

**Educational prototype - not a medical device.**
