const express = require('express')
const path = require('path')
const url = require('url')

// Getting the correct port
const PORT = process.env.PORT || 3002;

// Create app and assign the files to be returned in the front end
const app = express();
app.use(express.static(__dirname + '/front-end'))

// Handle queries
const { runQuery } = require(__dirname + '/back-end/runQuery.js')
const { sqlQuery } = require(__dirname  + '/back-end/sqlQueries.js')

app.get('/query', async (request, response) => {
  var { name, ...filters } = url.parse(request.url, true).query
  var sql = sqlQuery(name, filters)

  const data = await runQuery(sql)

  response.statusCode = 200
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Content-Type', 'application/json')
  response.write(JSON.stringify(data))
  response.end()
});

app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`))