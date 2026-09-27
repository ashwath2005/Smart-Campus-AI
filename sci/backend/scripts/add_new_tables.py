"""Create only new tables (refresh_tokens, forum_posts, forum_replies) without dropping existing ones."""
import asyncio
from app.database import engine, Base
# Import all models to register them on Base.metadata
import app.models  # noqa: F401


async def main():
    async with engine.begin() as conn:
        # create_all with checkfirst=True (default) only creates tables that don't exist
        await conn.run_sync(Base.metadata.create_all)
    print("Done! New tables created (existing tables preserved).")


if __name__ == "__main__":
    asyncio.run(main())
