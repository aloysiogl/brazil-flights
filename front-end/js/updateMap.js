const drawTrajectories = (routesCountsList) => {
    const maxTraffic = d3.max(routesCountsList.map(r => r.count))

    // Transform a list of origina and destinations in a listt of LineString
    linesStrings = routesCountsList.map(route => {
        const originAirport = ctx.airports.find(airport => airport.code == route.origin_airport)
        const destinationAirport = ctx.airports.find(airport => airport.code == route.destination_airport)
        const originCoordinates = [originAirport.longitude, originAirport.latitude]
        const destinationCoordinates = [destinationAirport.longitude, destinationAirport.latitude]

        return {
            type: "LineString", 
            coordinates: [originCoordinates, destinationCoordinates],  
            id: route.origin_airport+route.destination_airport,
            strokeIntensity: route.count/maxTraffic*0.85
            }
    })

    // Draw trajectories
    var routes = ctx.routesGroup.selectAll("path")
                   .data(linesStrings, d => d.id)

    
    routes.enter()
          .append("path")
          .transition()
          .duration(800)
          .attr("class", "route")
          .attr("d", ctx.geoPathGenerator)
          .attr("opacity", d => 0.15+d.strokeIntensity)

    routes.exit()
          .transition()
          .duration(800)
          .attr("opacity", 0)
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

const filterTrajectoriesByStates = (routes) => {
    return routes.filter(route => {
        const originState = ctx.airports.find(airport => airport.code == route.origin_airport).state
        const destinationState = ctx.airports.find(airport => airport.code == route.destination_airport).state

        var selection = ctx.selectedStates

        if (selection.length == 0 || (selection.find(s => s == originState) && selection.find(s => s == destinationState)))
            return true
        return false
    })
}

const updateMap = (start, end) => {
    drawTrajectories(filterTrajectoriesByStates(filterTrajectoriesByDate(start, end)))
}
