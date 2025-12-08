# Use latest stable Node
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install deps
RUN npm install

# Copy app code
COPY . .

# Expose port (Heroku/Render watapass PORT env)
EXPOSE 8080

# Run app
CMD ["node", "index.js"]
