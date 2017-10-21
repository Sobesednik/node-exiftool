FROM node:4-alpine
RUN apk --no-cache add perl

ADD package.json /app/package.json
RUN cd /app && npm install

ADD . /app
WORKDIR /app
RUN npm install

# ENV NODE_ENV production
CMD ["npm", "run", "build"]
