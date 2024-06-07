// server.js
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes/index');
const socket = require('./socket');

const app = express();
const server = http.createServer(app);
const io = socket.init(server);

const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());
app.use('/api', routes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
