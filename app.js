const express = require('express')
const path = require('path')

// Getting the correct port
const PORT = process.env.PORT || 3000;

// Create app and assign the files to be returned in the front end
const app = express();
app.use(express.static(__dirname + '/front-end'))

// TODO change this behavior
app.get('/test', (req, res) => {
  res.send('Hello test')
});

app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`))