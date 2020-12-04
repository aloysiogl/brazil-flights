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

const drawAirportDensity = routesCountsList => {
    const CIRCLE_SIZE_FACTOR = 20
    var airportDensities = {}

    // Getting count for each airport
    routesCountsList.forEach(route => {
        if (airportDensities[route.origin_airport])
            airportDensities[route.origin_airport].count += route.count
        else airportDensities[route.origin_airport] = { count: route.count }
        if (airportDensities[route.destination_airport])
            airportDensities[route.destination_airport].count += route.count
        else airportDensities[route.destination_airport] = { count: route.count }
    })

    // Getting coordinates for each airports
    for (var key in airportDensities) {
        const airport = ctx.airportsMap.get(key)
        airportDensities[key].coordinates = ctx.projection([airport.longitude, airport.latitude])
        airportDensities[key].airport = airport
    }

    // Gettin an array as needed for D3
    airportDensities = Object.keys(airportDensities).map(k => { return { code: k, data: airportDensities[k] } })

    // Calculates the airport with maximum flux
    const maxFlux = d3.max(airportDensities.map(a => a.data.count))

    // Calcualtas the radius based on the flux
    const calcRadius = (flux) => {
        return Math.sqrt(flux/maxFlux)*CIRCLE_SIZE_FACTOR
    }
    
    // Selecting existing circles and binding them to the data
    var circles = ctx.circlesGroup.selectAll('circle').data(airportDensities, d => d.code)

    // Making circles
    circles
        .enter()
        .append('circle')
        .attr('class', 'circle')
        .attr("cx", d => d.data.coordinates[0])
        .attr("cy", d => d.data.coordinates[1])
        .attr("r", d => calcRadius(d.data.count))
        .on("click",(e, d) => clickOnState(d.data.airport.state))
        .append('title').text(d => {
            var output = `Airport code: ${d.code}\n`
            if (d.data.airport.brazilian == "1")
                output += `Airport State: ${d.data.airport.state}\n`
            output += `Fligths: ${d.data.count}`
            return output
        })

    // Adding animation for circles to show
    ctx.circlesGroup.selectAll('circle').transition()
                    .duration(800)
                    .attr("opacity", 0.3)

    // Removing and animatig the circles
    circles.exit().transition().duration(800).attr('opacity', 0).remove()
}

