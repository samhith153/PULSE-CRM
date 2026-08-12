"""
Shared concurrency primitives for background tasks.
"""
import asyncio

# Limits concurrent background AI assessments to prevent connection pool starvation.
# 3 concurrent tasks leaves room for foreground requests in a pool of 15+10.
assessment_semaphore = asyncio.Semaphore(3)
