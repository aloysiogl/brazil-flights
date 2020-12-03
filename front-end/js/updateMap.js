const drawTrajectories = routesCountsList => {
    const maxTraffic = d3.max(routesCountsList.map(r => r.count))

    // Transform a list of origina and destinations in a listt of LineString
    linesStrings = routesCountsList.map(route => {
        const originAirport = ctx.airportsMap.get(route.origin_airport)
        const destinationAirport = ctx.airportsMap.get(
            route.destination_airport
        )
        const originCoordinates = [
            originAirport.longitude,
            originAirport.latitude,
        ]
        const destinationCoordinates = [
            destinationAirport.longitude,
            destinationAirport.latitude,
        ]

        return {
            type: 'LineString',
            coordinates: [originCoordinates, destinationCoordinates],
            id: route.origin_airport + route.destination_airport,
            strokeIntensity: (route.count / maxTraffic) * 0.85,
        }
    })

    // Draw trajectories
    var routes = ctx.routesGroup.selectAll('path').data(linesStrings, d => d.id)

    routes
        .enter()
        .append('path')
        .transition()
        .duration(800)
        .attr('class', 'route')
        .attr('d', ctx.geoPathGenerator)
        .attr('opacity', d => 0.15 + d.strokeIntensity)

    routes.exit().transition().duration(800).attr('opacity', 0).remove()
}

const filteredTrajectories = () => {
    const start = ctx.filter.startDate
    const end = ctx.filter.endDate
    const states = ctx.filter.states

    const routesMap = new Map()
    ctx.routesCounts
        .filter(({ date, origin_airport, destination_airport }) => {
            // Filter by date
            const dateOk = start && end ? start < date && date < end : true

            // Filter by state
            const originState = ctx.airportsMap.get(origin_airport).state
            const destinationState = ctx.airportsMap.get(destination_airport)
                .state
            const stateOk =
                states.size == 0 ||
                (states.has(originState) && states.has(destinationState))

            return dateOk && stateOk
        })
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

const updateMap = () => {
    drawTrajectories(filteredTrajectories())
}

const initializeUpdateMap = () => {
    ctx.airportsMap = new Map(
        ctx.airports.map(airport => [airport.code, airport])
    )
}
