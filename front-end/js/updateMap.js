const drawTrajectories = (routesCountsList) => {
    console.log(routesCountsList)
    // Transform a list of origina and destinations in a listt of LineString
    linesStrings = routesCountsList.map(route => {
        const originAirport = ctx.airports.find(airport => airport.code == route.origin_airport)
        const destinationAirport = ctx.airports.find(airport => airport.code == route.destination_airport)
        const originCoordinates = [originAirport.longitude, originAirport.latitude]
        const destinationCoordinates = [destinationAirport.longitude, destinationAirport.latitude]

        return {type: "LineString", coordinates: [originCoordinates, destinationCoordinates]}
    })

    // Draw trajectories
    var routes = ctx.routesGroup.selectAll("path")
                   .data(linesStrings)

    
    routes.enter()
          .append("path")
          .attr("class", "route")
          .attr("d", ctx.geoPathGenerator)

    routes.exit()
          .remove()
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
