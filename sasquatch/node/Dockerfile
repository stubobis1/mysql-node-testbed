FROM node:10

WORKDIR /app

COPY . /app
RUN npm install
#RUN npm install -g nodemon

EXPOSE 8081

#CMD ["nodemon", "index.js"]
CMD ["node", "index.js"]
