Implémentation Blog/Articles — endpoints et tests

Env vars
- `MONGO_URI` : Mongo connection string

Endpoints

Public:
- GET /blog?page=1&limit=10&q=search&tags=tag1,tag2 — liste paginée (published only)
- GET /blog/:slug — récupérer un article par slug

Admin (protégés par JWT + AdminGuard):
- POST /admin/blog — create (body JSON)
- PUT /admin/blog/:id — update
- DELETE /admin/blog/:id — delete
- PATCH /admin/blog/:id/publish — publish
- POST /admin/blog/upload — upload image (multipart)

Exemples curl

Liste publique :
```bash
curl "http://localhost:9000/blog?page=1&limit=10&q=voiture"
```

Post par slug :
```bash
curl "http://localhost:9000/blog/mon-article-super"
```

Create (admin):
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"T","slug":"t","body":"..."}' http://localhost:9000/admin/blog
```

Publish :
```bash
curl -X PATCH -H "Authorization: Bearer $TOKEN" http://localhost:9000/admin/blog/<id>/publish
```

Upload image :
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -F "file=@image.jpg" http://localhost:9000/admin/blog/upload
```

Notes
- Validation uses `class-validator` DTOs. Ensure global `ValidationPipe` is enabled in main.ts.
- For image upload use the provided `upload.middleware.ts` with `@UseInterceptors(FileInterceptor('file', uploadConfig))` in controller; it stores files locally under `uploads/vehicles` by default. Replace with S3 if desired.
