# Configure static server
FROM node:18-alpine
RUN npm install -g serve

WORKDIR /app
EXPOSE 81

# COPY frontend data
COPY ["Presentation/authorize-form", "./authorize-form"]
COPY ["Presentation/workspace-form", "./workspace-form"]

# Initiate static server + ASP.NET
CMD ["serve", ".", "-l", "81"]
