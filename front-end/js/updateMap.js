const drawTrajectories = (airportsPairListWithCounts) => {

}

const filterTrajectoriesByDate = (start, end) => {
    const routesMap = new Map()
    ctx.routesCounts
        .filter(({ date }) =>
            start && end ? start < date && date < end : true
        )
        .forEach(({ origin_airport, destination_airport, count }) => {
            const key = origin_airport + destination_airport
            routesMap.set(
                key,
                (routesMap.has(key) ? routesMap.get(key) : 0) + parseInt(count)
            )
        })
    return Array.from(routesMap.entries()).map(([key, value]) => ({
        origin_airport: key.substring(0, 4),
        destination_airport: key.substring(4, 8),
        count: value,
    }))
}

const updateMap = (start, end) => {
    drawTrajectories(filterTrajectoriesByDate(start, end))
}
