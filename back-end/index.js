const http = require('http')
const { runQuery } = require('./runQuery.js')

const requestListener = async (request, response) => {
  const { headers, method, url } = request;
  let body = [];
  request.on('error', (err) => {
    console.error(err);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    
    response.on('error', (err) => {
      console.error(err);
    });

    query = runQuery(`SELECT
                          r.origin_airport,
                          r.destination_airport,
                          SUM(r.count) as count,
                          SUM(r.duration) / SUM(r.count) as avg_duration,
                          SUM(r.delay) / SUM(r.count) as avg_delay
                      FROM
                          \`inf552-project.routes.routes2\` r
                      GROUP BY
                          r.origin_airport,
                          r.destination_airport`)

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.write(JSON.stringify(query));
    response.end()
  });
}).listen(8080);