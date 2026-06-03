# HealthAI Vision

POC de reconnaissance d'aliments par IA. Une image est envoyée via une interface web, analysée par un modèle HuggingFace, et les 5 aliments les plus probables sont retournés avec leur score de confiance.

## Architecture

```
Navigateur → NestJS :3000 → (réseau Docker) → FastAPI :8000 → modèle nateraw/food
```

Deux containers sur le même réseau Docker. Le service Python n'est pas exposé directement — tout passe par le NestJS.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)

## Lancer le projet

```bash
git clone git@github.com:MSPR-B3-EPSI/healthai-vision.git
cd healthai-vision
docker compose up
```

> Le premier démarrage est long (10–15 min) : téléchargement des images Docker, installation des dépendances Python (~1.5 Go avec PyTorch + CUDA), et téléchargement du modèle HuggingFace (~350 Mo).
> Les relances suivantes démarrent en quelques secondes grâce aux volumes `node_modules` et `hf-cache`.

Les services sont prêts quand les deux lignes suivantes apparaissent dans les logs :

```
nestjs-api-1  | NestJS API listening on http://0.0.0.0:3000
ai-service-1  | INFO:     Application startup complete.
```

## Utiliser l'interface web

Ouvrir `index.html` dans un navigateur (double-clic ou `Fichier > Ouvrir`), puis :

1. Glisser-déposer une photo de nourriture, ou cliquer pour en sélectionner une
2. Cliquer sur **Analyser l'image**
3. Les 5 aliments détectés s'affichent avec leur score de confiance

## API

### `POST /analyze`

Reçoit une image et retourne les prédictions du modèle.

**Requête**

```
Content-Type: multipart/form-data
Champ : image (fichier image)
```

**Exemple avec curl**

```bash
curl -X POST http://localhost:3000/analyze \
  -F "image=@/chemin/vers/photo.jpg"
```

**Réponse**

```json
{
  "predictions": [
    { "label": "pizza",      "score": 0.9241 },
    { "label": "flatbread",  "score": 0.0312 },
    { "label": "bruschetta", "score": 0.0187 },
    { "label": "focaccia",   "score": 0.0098 },
    { "label": "nachos",     "score": 0.0061 }
  ]
}
```

## Structure du projet

```
healthai-vision/
├── docker-compose.yml          # Orchestration des deux containers
├── index.html                  # Interface web (standalone, sans framework)
├── nestjs-api/                 # Container 1 — node:20-alpine
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       └── analyze/
│           ├── analyze.controller.ts   # POST /analyze
│           └── analyze.service.ts      # Proxy vers le service IA
└── ai-service/                 # Container 2 — python:3.11-slim
    ├── requirements.txt
    └── main.py                 # FastAPI + pipeline nateraw/food
```

## Modèle IA

[nateraw/food](https://huggingface.co/nateraw/food) — ViT (Vision Transformer) fine-tuné sur le dataset Food-101, capable de reconnaître 101 catégories d'aliments.

## Arrêter les containers

```bash
docker compose down
```

Pour tout supprimer (containers, volumes, cache du modèle) :

```bash
docker compose down -v
```
