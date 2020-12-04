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
        return Math.sqrt(flux / maxFlux) * CIRCLE_SIZE_FACTOR
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
        .on("click", (e, d) => clickOnState(d.data.airport.state))
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

const drawPlanes = routesCountsList => {
    // Interpolate trajectories in the map
    const interpolate = (origin, destination, t) => {
        const oX = parseFloat(origin[0])
        const dX = parseFloat(destination[0])
        const oY = parseFloat(origin[1])
        const dY = parseFloat(destination[1])

        const iX = oX + t * (dX - oX)
        const iY = oY + t * (dY - oY)

        return ctx.projection([iX, iY])
    }

    // Define the motion of the plane
    const tween = (origin, destination) => {
        return i => t => {
            // Getting position
            const p = interpolate(origin, destination, t)
            var t2 = t + 0.05
            const p2 = interpolate(origin, destination, t2)

            // Getting rotation
            const x = p2[0] - p[0];
            const y = p2[1] - p[1];
            const r = - Math.atan2(-y, x) * 180 / Math.PI;

            // Gettin scale
            const s = Math.min(Math.sin(Math.PI * t) * 0.07, 0.01);

            return `translate(${p[0]-288*s},${p[1]-256*s}) rotate(${r}, ${288*s}, ${256*s}) scale(${s})`
        }
    }

    // Random sampler from the trajectories
    function randomTrajectorySample() {
        samples = routesCountsList.map((a, i) => ({ weight: a.count, value: i }))
        // [0..1) * sum of weight
        let sample =
            Math.random() *
            samples.reduce((sum, { weight }) => sum + weight, 0);

        // First sample n where sum of weight for [0..n] > sample
        const { value } = samples.find(
            ({ weight }) => (sample -= weight) < 0
        );

        return routesCountsList[value];
    }

    // Defines how to spawn new planes
    const spawnPlane = () => {
        const route = randomTrajectorySample()

        const orig = ctx.airportsMap.get(route.origin_airport)
        const dest = ctx.airportsMap.get(route.destination_airport)

        const traj = [
            [orig.longitude, orig.latitude],
            [dest.longitude, dest.latitude]
        ]

        var plane = ctx.planesGroup
            .data([{traj: traj, route: route}])
            .append("path")
            // Code for the svg plane
            .attr("d", "M480 192H365.71L260.61 8.06A16.014 16.014 0 0 0 246.71 0h-65.5c-10.63 0-18.3 10.17-15.38"+
                       " 20.39L214.86 192H112l-43.2-57.6c-3.02-4.03-7.77-6.4-12.8-6.4H16.01C5.6 128-2.04 137.78."+
                       "49 147.88L32 256 .49 364.12C-2.04 374.22 5.6 384 16.01 384H56c5.04 0 9.78-2.37 12.8-6.4L"+
                       "112 320h102.86l-49.03 171.6c-2.92 10.22 4.75 20.4 15.38 20.4h65.5c5.74 0 11.04-3.08 13.8"+
                       "9-8.06L365.71 320H480c35.35 0 96-28.65 96-64s-60.65-64-96-64z")
            .attr("class", "base_plane")

        // Show plane information after mouse hover
        plane.on("mouseover", (e, d) => {
            if (ctx.selectedPlane)
                ctx.selectedPlane.attr("class", "base_plane")
            plane.attr("class", "selected_plane")

            // Information in the dialog
            d3.select("#about_plane").html(
                    `Origin: ${d.route.origin_airport}\n`+
                    `Destination: ${d.route.destination_airport}\n`

                )
            ctx.selectedPlane = plane
        })

        // Plane movement
        plane
            .transition()
            .duration(10000)
            .attrTween("transform", t => tween(t.traj[0], t.traj[1])())
            .on("end", d => {
                // If the plane was the selected plane clear the selection
                if (plane == ctx.selectedPlane)
                    d3.select("#about_plane").html("")
            })
            .remove()
    }

    // Conditions for spawning new planes
    if (routesCountsList.length > 0){
        clearInterval(ctx.intervalSpawnPlanesId)
        ctx.intervalSpawnPlanesId = setInterval(spawnPlane, 100)
    }
    else {
        clearInterval(ctx.intervalSpawnPlanesId)
    }
}

