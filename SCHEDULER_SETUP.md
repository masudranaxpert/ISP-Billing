# APScheduler Setup - ISP Billing System

## Architecture Overview

The APScheduler runs in a **separate container** from the web application to prevent duplicate job execution issues.

### Container Structure:
```
┌─────────────────────┐
│   db (PostgreSQL)   │
└──────────┬──────────┘
           │
    ┌──────┴──────────────────┐
    │                         │
┌───▼────────┐      ┌────────▼────────┐
│    web     │      │   scheduler     │
│ (Gunicorn) │      │  (APScheduler)  │
│ 3 workers  │      │   1 instance    │
└────────────┘      └─────────────────┘
```

## Why Separate Container?

### Problem with Single Container:
- Gunicorn creates **multiple workers** (3 in our case)
- Each worker initializes Django app
- Scheduler starts in **each worker** → **Duplicate jobs** → **Database errors**

### Solution:
- **Web container**: Only handles HTTP requests (Gunicorn + Django)
- **Scheduler container**: Only runs APScheduler jobs
- Both share the same database

## Files Structure

```
isp-billing-backend/
├── docker-compose.yml          # Defines web + scheduler services
├── run_scheduler.py            # Standalone scheduler runner
├── gunicorn.conf.py            # Gunicorn config (NO scheduler code)
├── utils/
│   ├── background_tasks.py     # Scheduler jobs definition
│   └── apps.py                 # Django app config (NO scheduler init)
└── docker-entrypoint.sh        # Container startup script
```

## Scheduled Jobs

### 1. Check Expired Subscriptions
- **Frequency**: Every minute (for testing)
- **Production**: Change to hourly in `background_tasks.py`
- **Function**: `check_and_disable_expired_subscriptions()`
- **Purpose**: Disable subscriptions with unpaid bills past expiry date

### 2. Delete Old Job Executions
- **Frequency**: Every Monday at midnight
- **Function**: `delete_old_job_executions()`
- **Purpose**: Clean up old APScheduler execution logs

## Configuration

### Change Job Schedule

Edit `utils/background_tasks.py`:

```python
# For production - run every hour instead of every minute
scheduler.add_job(
    check_and_disable_expired_subscriptions,
    trigger=CronTrigger(hour='*', minute=0),  # Every hour at minute 0
    id="check_expired_subscriptions",
    max_instances=1,
    replace_existing=True,
    name="Check and disable expired subscriptions"
)
```

### Adjust Worker Count

Edit `gunicorn.conf.py`:

```python
workers = 3  # Change based on your server capacity
```

## Docker Commands

### Start all services:
```bash
docker-compose up -d
```

### View scheduler logs:
```bash
docker-compose logs -f scheduler
```

### View web logs:
```bash
docker-compose logs -f web
```

### Restart scheduler only:
```bash
docker-compose restart scheduler
```

### Check running jobs:
```bash
docker-compose exec web python manage.py shell -c "
from django_apscheduler.models import DjangoJob
for job in DjangoJob.objects.all():
    print(f'Job: {job.id}, Next run: {job.next_run_time}')
"
```

## Troubleshooting

### Scheduler not running jobs?

1. Check scheduler container is running:
   ```bash
   docker-compose ps
   ```

2. Check scheduler logs:
   ```bash
   docker-compose logs scheduler
   ```

3. Verify jobs exist in database:
   ```bash
   docker-compose exec web python manage.py shell -c "
   from django_apscheduler.models import DjangoJob
   print('Jobs:', DjangoJob.objects.count())
   "
   ```

### Duplicate key errors?

This should NOT happen with the new architecture. If it does:

1. Stop all containers:
   ```bash
   docker-compose down
   ```

2. Clear old jobs from database:
   ```bash
   docker-compose up -d db
   docker-compose exec db psql -U postgres -d django_db -c "
   DELETE FROM django_apscheduler_djangojobexecution;
   DELETE FROM django_apscheduler_djangojob;
   "
   ```

3. Restart:
   ```bash
   docker-compose up -d
   ```

## Production Recommendations

1. **Change job frequency** from every minute to appropriate intervals
2. **Monitor scheduler logs** for errors
3. **Set up alerts** for scheduler failures
4. **Backup database** regularly (includes job schedules)
5. **Use environment variables** for sensitive configurations

## Important Notes

⚠️ **DO NOT** initialize scheduler in:
- `utils/apps.py` (Django app config)
- `gunicorn.conf.py` (Gunicorn hooks)
- Any Django middleware or signals

✅ **ONLY** run scheduler via:
- `run_scheduler.py` in the scheduler container
- Docker Compose `scheduler` service

## Monitoring

The scheduler logs show:
- When jobs are added
- When jobs execute
- Execution results
- Any errors

Example log output:
```
scheduler-1  | Starting APScheduler as standalone service
scheduler-1  | Added job "Check and disable expired subscriptions"
scheduler-1  | Scheduler started successfully!
scheduler-1  | Running job "Check and disable expired subscriptions"
scheduler-1  | No expired subscriptions found
scheduler-1  | Job executed successfully
```

---

**Last Updated**: 2026-01-31
**Architecture**: Separate Scheduler Container
**Status**: ✅ Production Ready
