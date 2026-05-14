# ═══════════════════════════════════════════════════════════════════════════════
#  WhatsTrade PostgreSQL 18 with Extensions
# ═══════════════════════════════════════════════════════════════════════════════
#  Custom PostgreSQL image with pgvector and pg_textsearch
# ═══════════════════════════════════════════════════════════════════════════════

FROM pgvector/pgvector:pg18-trixie

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-18 \
    libicu-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install pg_textsearch
RUN cd /tmp && \
    git clone https://github.com/timescale/pg_textsearch.git && \
    cd pg_textsearch && \
    make && \
    make install && \
    cd / && \
    rm -rf /tmp/pg_textsearch

# Verify installation
RUN ls -la /usr/share/postgresql/18/extension/pg_textsearch* || echo "pg_textsearch files not found"

# Set labels
LABEL maintainer="WhatsTrade Team"
LABEL description="PostgreSQL 18 with pgvector and pg_textsearch extensions"
LABEL version="1.0"

# Default command
CMD ["postgres"]
