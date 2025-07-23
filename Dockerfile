# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Create sessions directory
RUN mkdir -p sessions

# Expose ports
EXPOSE 3080 3081

# Start in development mode
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Install dev dependencies for build
RUN npm install typescript ts-node --save-dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create sessions directory
RUN mkdir -p sessions

# Expose ports
EXPOSE 3080 3081

# Start the application
CMD ["npm", "start"]