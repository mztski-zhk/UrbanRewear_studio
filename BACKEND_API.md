# UrbanRewear — Backend API Documentation

## Overview

This document describes the planned backend API endpoints for the UrbanRewear clothing redesign application. No backend is currently connected — these are placeholder specifications for future implementation.

## Planned Endpoints

### Clothing Image Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/clothing` | List available clothing templates |
| `GET` | `/api/v1/clothing/:id` | Get a specific clothing image |
| `POST` | `/api/v1/clothing/:id/redesign` | Submit a redesign request to AI |
| `GET` | `/api/v1/redesign/:jobId` | Poll redesign job status |

### Design Persistence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/designs` | Save a design |
| `GET` | `/api/v1/designs` | List user designs |
| `GET` | `/api/v1/designs/:id` | Load a specific design |
| `DELETE` | `/api/v1/designs/:id` | Delete a design |

### AI Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/ai/generate` | Generate AI redesign from canvas snapshot |
| `GET` | `/api/v1/ai/models` | List available AI models |

## Planned Ports

| Service | Port | Status |
|---------|------|--------|
| Frontend (Vite dev) | `8080` | ✅ Active |
| Backend API | `3001` | 🔲 Planned |
| AI Worker | `3002` | 🔲 Planned |

## Authentication

Authentication will be handled via Lovable Cloud (Supabase Auth). JWT tokens will be passed in the `Authorization: Bearer <token>` header.

## Notes

- Clothing images must be served from the backend — direct user upload of clothing base images is disabled by default (configurable via `config.json` debug mode).
- Asset overlays (patches, logos, etc.) can still be uploaded directly by users.
