# Local development

Development mode runs Django on the host, PostgreSQL in Docker, and stores
uploaded objects on the local filesystem. S3 credentials are not needed.

## Start the backend

From the repository root:

```bash
docker compose up -d db
cd annotation_platform
APP_ENV=development python manage.py migrate
APP_ENV=development python manage.py runserver
```

`APP_ENV=development` supplies these local defaults:

- PostgreSQL: `annotation_platform:annotation_platform@127.0.0.1:5432/annotation_platform`
- Database SSL mode: `disable`
- Object storage directory: `annotation_platform/media/`
- Object URL: `http://localhost:8000/media/`
- Django debug mode: enabled
- Allowed hosts: `localhost,127.0.0.1`
- CORS origins: `http://localhost:5173,http://127.0.0.1:5173`

Every setting can still be overridden with its corresponding environment
variable. For example:

```bash
APP_ENV=development DATABASE_PORT=5433 python manage.py runserver
```

The local media endpoint is intentionally enabled only when both `DEBUG` is
true and `STORAGE_BACKEND=local`. It is a development server, not a production
file-serving setup.

## Stop PostgreSQL

```bash
docker compose stop db
```

The database remains in the `postgres_data` Docker volume between runs.
