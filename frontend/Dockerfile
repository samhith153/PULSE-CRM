FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Install dependencies first (leverage caching)
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN pnpm install

# Copy configuration and source files
COPY tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs ./
COPY public ./public
COPY src ./src

# Build the Next.js application
RUN pnpm run build

# Expose port 3000
EXPOSE 3000

# Start the dev server or production server (dev is useful for this sandbox, but let's build for start)
CMD ["pnpm", "start"]
