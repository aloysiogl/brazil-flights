const sqlQuery = (name, filters) => {
    fromWhere = fromWhereExp(parse(filters))

    switch (name) {
        case 'flights':
            return flightsQuery(fromWhere)
        case 'slider':
            return sliderQuery(fromWhere)
        case 'airlines':
            return airlinesQuery(fromWhere)
        case 'types':
            return typesQuery(fromWhere)
    }
}

const parse = ({
    startDate = '',
    endDate = '',
    airlines = '[]',
    types = '[]',
    states = '[]',
} = {}) => ({
    start: startDate == '' ? null : startDate,
    end: endDate == '' ? null : endDate,
    airlines: JSON.parse(airlines),
    types: JSON.parse(types),
    states: JSON.parse(states),
})

const fromWhereExp = ({ start, end, airlines, types, states }) => {
    filterDate = start || end
    filterState = states.size > 0
    filterAirline = airlines.size > 0
    filterType = types.size > 0

    return `FROM
                \`inf552-project.routes.routes2\` r
            WHERE
                1 = 1
                ${
                    filterDate
                        ? `AND "${start}" <= r.date AND r.date <= "${end}"`
                        : ''
                }
                ${
                    filterAirline
                        ? `AND r.airline IN ("${airlines.join('","')}")`
                        : ''
                }
                ${filterType ? `AND r.type IN (${types.join()})` : ''}
                ${
                    filterState
                        ? `AND r.origin_state IN ("${states.join('","')}")`
                        : ''
                }
                ${
                    filterState
                        ? `AND r.destination_state IN ("${states.join('","')}")`
                        : ''
                }`
}

const flightsQuery = fromWhere =>
    `SELECT
        r.origin_airport,
        r.destination_airport,
        SUM(r.count) as count,
        SUM(r.duration) / SUM(r.count) as avg_duration,
        SUM(r.delay) / SUM(r.count) as avg_delay
    ${fromWhere}
    GROUP BY
        r.origin_airport,
        r.destination_airport`

const sliderQuery = fromWhere =>
    `SELECT
        r.date,
        SUM(r.count) as count
    ${fromWhere}
    GROUP BY
        r.date`

const airlinesQuery = fromWhere =>
    `SELECT
        r.airline,
        SUM(r.count) as count
    ${fromWhere}
    GROUP BY
        r.airline
    ORDER BY
        count DESC
    LIMIT 10`

const typesQuery = fromWhere =>
    `SELECT
        r.type,
        SUM(r.count) as count,
    ${fromWhere}
    GROUP BY
        r.type
    ORDER BY
        count DESC
    LIMIT 6`

module.exports = {
    sqlQuery,
}
