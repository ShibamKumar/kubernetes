# Multi-Tier Kubernetes Deployment on AWS EKS

A fully containerized, production-grade two-tier application deployed on Amazon EKS demonstrating Kubernetes best practices including self-healing, rolling updates, HPA, persistent storage, and FinOps optimization.

---

## Quick Links

|        Resource            |                    URL                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------                                                              |
| **Source Code Repository** |   `https://github.com/ShibamKumar/kubernetes/tree/develop`                                                                             |
| **Docker Hub Image**       |   `https://hub.docker.com/repository/docker/shibamkumar1234/k8s-api-service`                                                           | 
| **Application URL**        |  `http://ab3c454611e974f6fb01fb40c41b2fd3-e2caba10a50d21d8.elb.us-east-1.amazonaws.com`                                                |
| **Live API Endpoint**      |   `http://ab3c454611e974f6fb01fb40c41b2fd3-e2caba10a50d21d8.elb.us-east-1.amazonaws.com/api/records`                                   |
| **Health Check**           |  `http://ab3c454611e974f6fb01fb40c41b2fd3-e2caba10a50d21d8.elb.us-east-1.amazonaws.com/health`                                         |



---

## HIGH Level Architecture Flow

```
Internet → NLB → NGINX Ingress → API Service (4 pods)
                                        ↓ DNS (postgres-service)
                               PostgreSQL StatefulSet (1 pod)
                                        ↓
                               EBS gp3 PVC (5Gi, persists data)
```

| Component          | Technology           | Details                                   |
| ------------------ | -------------------- | ----------------------------------------- |
| API Service        | Node.js 18 + Express | 4 replicas, rolling updates, HPA          |
| Database           | PostgreSQL 15-alpine | StatefulSet, PVC-backed, cluster-internal |
| Container Registry | Docker Hub           | Multi-stage Alpine image                  |
| Cloud Platform     | AWS EKS              | 2 x t3.small nodes                        |
| Ingress            | NGINX + AWS NLB      | Single external entry point               |
| Storage            | Amazon EBS gp3       | Dynamic provisioning via EBS CSI driver   |

