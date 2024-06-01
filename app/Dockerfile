# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY app/package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY app/ . 

# Make the application's port available to the outside world
EXPOSE 8080

# Define the command to run the application
CMD [ "node", "app.js" ]