FROM node:18
RUN mkdir /app && chown node /app
USER node
WORKDIR /app
COPY . /app
RUN npm install
CMD ["npm","run","dev"]
