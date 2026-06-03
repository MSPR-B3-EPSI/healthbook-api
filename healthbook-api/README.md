# healthbook-api

Service NestJS qui expose une API d'analyse d'images alimentaires, sécurisée par Keycloak (JWT RS256).

## Architecture

```
healthbook-api/          ← NestJS (port 3000)
healthai-vision/
  ai-service/            ← FastAPI Python (port 8000)
  index.html             ← Frontend de démonstration (port 8090)
```

### Services Docker Compose

| Service | Image | Port |
|---|---|---|
| `healthbook-db` | postgres:15 | 5434 |
| `keycloak` | quay.io/keycloak/keycloak:latest | 8080 |
| `ai-service` | python:3.11-slim | 8000 |
| `healthbook-api` | node:20-alpine | 3000 |

## Lancer le projet

```bash
# Depuis healthbook-api/
docker compose up
```

Le démarrage complet prend quelques minutes (téléchargement du modèle HuggingFace `nateraw/food` au premier lancement).

## Endpoints

### `POST /analyze`

Analyse une image alimentaire et retourne les 5 prédictions les plus probables.

**Authentification requise** : Bearer token Keycloak.

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Authorization: Bearer <token>" \
  -F "image=@photo.jpg"
```

Réponse :
```json
{
  "predictions": [
    { "label": "pizza", "score": 0.9823 },
    { "label": "bruschetta", "score": 0.0091 }
  ]
}
```

### `GET /auth/whoami`

Retourne l'utilisateur courant (JWT + DB).

```bash
curl http://localhost:3000/auth/whoami \
  -H "Authorization: Bearer <token>"
```

## Configuration Keycloak

Keycloak démarre vierge en mode dev. À configurer manuellement à l'adresse http://localhost:8080 (admin / admin) :

1. Créer un client `healthai-client` (type Public, Direct access grants activé)
2. Créer les rôles de realm : `plan-freemium`, `plan-premium`, `plan-premium-plus`
3. Créer un utilisateur test et lui assigner un rôle

Le token se récupère ensuite via :
```bash
curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=healthai-client&grant_type=password&username=<user>&password=<pass>"
```

## Variables d'environnement

| Variable | Valeur par défaut | Description |
|---|---|---|
| `KEYCLOAK_ISSUER` | `http://localhost:8080/realms/master` | Issuer attendu dans le JWT |
| `KEYCLOAK_JWKS_URI` | `http://keycloak:8080/realms/master/protocol/openid-connect/certs` | URL JWKS (résolution Docker interne) |
| `KEYCLOAK_AUDIENCE` | `account` | Audience attendue dans le JWT |
| `AI_SERVICE_URL` | `http://ai-service:8000` | URL du service FastAPI |
| `DATABASE_URL` | — | PostgreSQL (Prisma) |

## Développement

```bash
npm install
npm run start:dev    # hot reload
npm run build        # compilation TypeScript
npm run test         # tests unitaires (Jest)
npm run lint         # ESLint
```

### Migrations Prisma

```bash
# Générer le client après modification de schema.prisma
DATABASE_URL=<url> npx prisma generate

# Créer et appliquer une migration
docker exec -it healthbook_api npx prisma migrate dev --name <nom>
```

## Contexte

Le matching entre les labels Food-101 (snake_case, 101 classes) et les noms d'aliments du CSV (Titre Case + portions, 650 entrées) ne peut pas être fait proprement sans une lookup table manuelle ou un fuzzy match approximatif.

## Blockers

- Pas de normalisation des noms d'aliments dans les ETL existants
- Pas encore de profil utilisateur disponible pour enrichir le conseil
- Décision d'équipe nécessaire sur la normalisation au niveau ETL

## Reprendre quand

- [ ] Repo healthai-recommendation en place
- [ ] Décision d'équipe sur la normalisation des noms d'aliments
- [ ] Profil utilisateur disponible

## Lien

Card kanban : "Enrichir l'ai-service avec les données nutritionnelles"

---

### Ajouter un module

1. Créer `src/<module>/<module>.controller.ts`, `.service.ts`, `.module.ts`
2. Importer le module dans `src/app.module.ts`
3. Protéger les routes avec `@UseGuards(JwtAuthGuard)`
4. Écrire le fichier `.spec.ts` correspondant (mocker `JwtAuthGuard` avec `.overrideGuard()`)
