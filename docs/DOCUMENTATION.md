# Comprehensive Documentation — Multi-Tier Kubernetes Deployment



## 1. Requirement Understanding

The assignment requires building and deploying a **two-tier application** on Kubernetes:

### Tier 1 — Service/API Layer
- A microservice exposing a REST API
- Fetches employee records from the database and returns them as JSON
- Must be externally accessible via Ingress
- Must run **4 replicas** with rolling update capability
- Must demonstrate self-healing (pod restarts automatically after failure)
- Must demonstrate HPA (auto-scaling based on CPU/memory load)
- Configuration (DB host, port, name) must come from **ConfigMap** — not hardcoded
- DB password must come from **Kubernetes Secret** — not visible in YAML

### Tier 2 — Database Layer
- PostgreSQL database with one table (`employees`) containing 8 seeded records
- Accessible **only within the cluster** (ClusterIP service, no external exposure)
- Data must **persist** across pod restarts (PersistentVolumeClaim backed by EBS)
- Must automatically recover after pod deletion (StatefulSet)

### Cross-Cutting Requirements
- Inter-tier communication via **DNS service names**, never pod IPs
- External access via **Ingress** (not direct NodePort/LoadBalancer on the API service)
- Resource requests and limits defined on all pods (FinOps)
- At least 3 FinOps optimizations identified and implemented



## 2. Assumptions

| # | Assumption |
|---|---|
| 1 | AWS is the cloud provider; **Amazon EKS** is used as the managed Kubernetes service |
| 2 | AWS EBS CSI driver is installed in the cluster for dynamic PV provisioning |
| 3 | Kubernetes Metrics Server is installed (required for HPA to function) |
| 4 | NGINX Ingress Controller is used (simpler setup than AWS ALB Controller for this use case) |
| 5 | Docker Hub is used as the container registry |
| 6 | Node.js 18 (LTS) + Express.js is chosen as the API framework |
| 7 | PostgreSQL 15 is used as the database engine |
| 8 | The cluster has at least 2 worker nodes (`t3.medium`) |
| 9 | `kubectl`, `eksctl`, `helm`, and `docker` are installed on the developer's machine |
| 10 | The `gp3` StorageClass is created before applying the PVC manifest |
| 11 | For demo purposes, the Secret file contains base64-encoded placeholder passwords - in production these would come from AWS Secrets Manager via External Secrets Operator |



## 3. Solution Overview

### Architecture Diagram

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  AWS EKS Cluster (t3.medium worker nodes)                    │
│                                                               │
│  ┌─────────────────────┐                                     │
│  │  ingress-nginx (NLB) │  ← externally accessible           │
│  └──────────┬──────────┘                                     │
│             │  HTTP :80                                       │
│             ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Namespace: multitier                                 │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  API Deployment (4 pods)                     │     │    │
│  │  │  image: shibamkumar1234/k8s-api-service:2.0.2 │     │    │
│  │  │  Node.js + Express + pg (connection pool)    │     │    │
│  │  │  ┌──────────────────────────────────────┐   │     │    │
│  │  │  │ ConfigMap: DB_HOST, DB_PORT, DB_NAME  │   │     │    │
│  │  │  │ Secret:    DB_PASSWORD                │   │     │    │
│  │  │  └──────────────────────────────────────┘   │     │    │
│  │  │  HPA: min=4, max=8 @ 60% CPU               │     │    │
│  │  └───────────────────┬─────────────────────────┘     │    │
│  │                      │  DNS: postgres-service:5432    │    │
│  │                      ▼                                 │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  PostgreSQL StatefulSet (1 pod)              │     │    │
│  │  │  image: postgres:15-alpine                   │     │    │
│  │  │  ClusterIP only — NOT exposed externally     │     │    │
│  │  │  PVC → EBS gp3 5Gi (data persists)          │     │    │
│  │  │  Init SQL: creates + seeds employees table   │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
kubernetes/
├── PROBLEM_STATEMENT.md          ← Problem statement reference
├── README.md                     ← Deliverable README
├── app/
│   ├── server.js                 ← Node.js Express API
│   ├── package.json
│   └── Dockerfile                ← Multi-stage Docker build
├── k8s/
│   ├── 00-namespace.yaml         ← Namespace: multitier
│   ├── 01-configmap.yaml         ← DB host/port/name/pool config
│   ├── 02-secret.yaml            ← DB password (base64)
│   ├── 03-postgres-init-configmap.yaml  ← SQL init script
│   ├── 04-postgres-pvc.yaml      ← 5Gi EBS PersistentVolumeClaim
│   ├── 05-postgres-statefulset.yaml     ← PostgreSQL StatefulSet
│   ├── 06-postgres-service.yaml  ← ClusterIP service for DB
│   ├── 07-api-deployment.yaml    ← API Deployment (4 replicas)
│   ├── 08-api-service.yaml       ← ClusterIP service for API
│   ├── 09-api-hpa.yaml           ← HPA (min=4, max=8, CPU 60%)
│   ├── 10-ingress.yaml           ← NGINX Ingress (external access)
│   └── 11-storageclass.yaml      ← gp3 EBS StorageClass
└── docs/
    └── DOCUMENTATION.md
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **StatefulSet for PostgreSQL** | Provides stable pod name (`postgres-0`), enabling predictable DNS resolution and ordered restart |
| **Deployment for API** | Stateless service — Deployment is the right workload type; enables easy scaling and rolling updates |
| **ClusterIP for PostgreSQL service** | Satisfies "accessible only within cluster" requirement; DNS-based access avoids pod IP dependency |
| **ConfigMap for DB config** | Externalises connection parameters — no rebuild needed to change DB host/port/name |
| **Secret for DB password** | Prevents credential exposure in YAML files; base64 encoding is not encryption but keeps credentials out of plain text in manifests |
| **Multi-stage Dockerfile** | Builder stage installs deps; runtime stage is minimal — smaller image, faster pulls, reduced attack surface |
| **Non-root user in Docker** | Security best practice — container runs as `appuser`, not root |
| **WaitForFirstConsumer binding** | EBS volume only created when pod is actually scheduled — avoids paying for unattached volumes |



## 4. Justification for Resources Utilized

### AWS EKS
Chosen so the Kubernetes control plane does not need to be managed manually, while still integrating cleanly with IAM, EBS, and load balancers on AWS.

### EC2 t3.medium Worker Nodes
This instance size is enough for the API pods, PostgreSQL pod, and cluster system components without making the demo unnecessarily expensive.

### Amazon EBS gp3 (5 Gi)
Used for PostgreSQL persistent storage. It is a better fit than gp2 here because it is cheaper and gives solid baseline performance.

### NGINX Ingress Controller
Used as a simple way to expose the API externally through one entry point, while still keeping routing inside Kubernetes.

### Node.js 18 + Express
Chosen because it is lightweight, quick to start, and works well for a small API that mostly handles database-backed requests.

### PostgreSQL 15-alpine
Used because it is reliable for structured data, and the Alpine-based image is smaller and faster to pull.

### Kubernetes Metrics Server
Needed so HPA can read CPU and memory usage and make scaling decisions.

