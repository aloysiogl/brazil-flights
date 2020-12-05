const Pool = require('pg').Pool

const getPool = () => {
    return new Pool({
        user: 'postgres',
        host: 'inf552-project.cqol7avxybj4.eu-west-3.rds.amazonaws.com',
        //  database: 'api',
        password: 'dxLtfNhU>87VF`8x',
        port: 5432,
    })
}

module.exports = {
    getPool,
}
