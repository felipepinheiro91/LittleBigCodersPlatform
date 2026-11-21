FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.production
WORKDIR /app
COPY requirements.txt requirements-production.txt ./
RUN pip install --no-cache-dir -r requirements-production.txt \
    && useradd --create-home --uid 10001 app
COPY --chown=app:app manage.py ./
COPY --chown=app:app config ./config
COPY --chown=app:app accounts ./accounts
COPY --chown=app:app content ./content
COPY --chown=app:app quizzes ./quizzes
COPY --chown=app:app achievements ./achievements
# Build static assets without production credentials or a database connection.
RUN SECRET_KEY=build-only-placeholder-not-a-runtime-secret \
    DATABASE_URL=postgresql://build:build@localhost/build \
    ALLOWED_HOSTS=build.invalid python manage.py collectstatic --noinput
USER app
EXPOSE 8000
# Run migrations once, explicitly, after restoring the destination database.
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-"]
