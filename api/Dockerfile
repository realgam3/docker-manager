FROM node:12.18-stretch-slim

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Bundle app source
COPY . /app/

# Install packages
RUN npm install
RUN npm install -g forever

CMD [ "npm", "start" ]
