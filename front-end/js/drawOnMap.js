const drawTrajectories = routesCountsList => {
    const maxTraffic = d3.max(routesCountsList.map(r => r.count))

    // Transform a list of origina and destinations in a listt of LineString
    const linesStrings = routesCountsList.map(route => {
        return {
            type: 'LineString',
            coordinates: [route.origin_coordinates, route.destination_coordinates],
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
        if (airportDensities[route.origin_airport]) {
            airportDensities[route.origin_airport].count += route.count
        } else {
            airportDensities[route.origin_airport] = { 
                count: route.count,
                coordinates: ctx.projection(route.origin_coordinates),
                state: route.origin_state,
                city: route.origin_city,
                country: route.origin_country,
                name: route.origin_name
            }
        }
        if (airportDensities[route.destination_airport]) {
            airportDensities[route.destination_airport].count += route.count
        } else {
            airportDensities[route.destination_airport] = { 
                count: route.count,
                coordinates: ctx.projection(route.destination_coordinates),
                state: route.destination_state,
                city: route.destination_city,
                country: route.destination_country,
                name: route.destination_name,
            }
        }
    })

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
        .on("click", (_, d) => {
            if (d.data.state !== '')
                clickOnState(d.data.state)
        })
        .append('title').text(d => {
            var output = `Airport code: ${d.code}\n`
            // Extra information
            output += `Name: ${d.data.name}\n`
            output += `City: ${d.data.city}\n`
            if (d.data.state != '')
                output += `State: ${d.data.state}\n`
            if (d.data.country != 'BRAZIL')
                output += `Country: ${d.data.country}\n`
            output += `Longitude: ${d.data.coordinates[0].toFixed(2)}\n`
            output += `Latitude: ${d.data.coordinates[1].toFixed(2)}\n`

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
    const SPEED_FACTOR = 100
    const SIZE_FACTOR = 0.02
    const SPAWN_INTERVAL = 500
    const DELAYED_THRESHOLD = 15

    // Variable used to simplify math during interpolation
    var π = Math.PI, τ = 2 * π, halfπ = π / 2, ε = 1e-6, ε2 = ε * ε, d3_radians = π / 180, d3_degrees = 180 / π;


    // D3 original interpolate functions
    function d3_haversin(x) {
        return (x = Math.sin(x / 2)) * x;
    }

    function d3_geo_interpolate(x0, y0, x1, y1) {
        var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);
        var interpolate = d ? function(t) {
            var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
            return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
        } : function() {
            return [ x0 * d3_degrees, y0 * d3_degrees ];
        };
        interpolate.distance = d;
        return interpolate;
    }

    // Interpolate trajectories in the map
    const interpolate = (source, target, t) => ctx.projection(d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians)(t))

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
            const s = Math.min(Math.sin(Math.PI * t) * 0.07, SIZE_FACTOR);

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

    // Gaussion distrubution
    function randomG(u, s, v){ 
        var r = 0;
        for(var i = v; i > 0; i --){
            r += Math.random();
        }
        return u+s*(r / v);
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

        const delay = randomG(route.avg_delay, route.avg_delay/2, 5)
        const duration = randomG(route.avg_duration, route.avg_duration / 10, 5)

        const getPlaneClass = d => {
            if (d.delay > DELAYED_THRESHOLD) return "delayed_plane"
                return "base_plane"
        }

        var plane = ctx.planesGroup
            .data([{traj: traj, route: route, delay: delay, duration: duration}])
            .append("path")
            // Code for the svg plane
            .attr("d", "M480 192H365.71L260.61 8.06A16.014 16.014 0 0 0 246.71 0h-65.5c-10.63 0-18.3 10.17-15.38"+
                       " 20.39L214.86 192H112l-43.2-57.6c-3.02-4.03-7.77-6.4-12.8-6.4H16.01C5.6 128-2.04 137.78."+
                       "49 147.88L32 256 .49 364.12C-2.04 374.22 5.6 384 16.01 384H56c5.04 0 9.78-2.37 12.8-6.4L"+
                       "112 320h102.86l-49.03 171.6c-2.92 10.22 4.75 20.4 15.38 20.4h65.5c5.74 0 11.04-3.08 13.8"+
                       "9-8.06L365.71 320H480c35.35 0 96-28.65 96-64s-60.65-64-96-64z")
            .attr('transform', 'scale(0)')
            .attr("class", d => getPlaneClass(d))

        // Show plane information after mouse hover
        plane.on("mouseover", (_, d) => {
            if (ctx.selectedPlane)
                ctx.selectedPlane.attr("class", d => getPlaneClass(d))
            plane.attr("class", "selected_plane")

            // Information in the dialog
            const div = d3.select("#about_plane")
            div.selectAll("*").remove()
            div.style('display', 'flex')
            div.append("div")
               .attr('class', 'about_plane_line')
               .html(`Route: ${d.route.origin_airport} -> ${d.route.destination_airport}`)
            div.append("div")
               .attr('class', 'about_plane_line')
               .html(`Origin: ${d.route.origin_name}`)
            div.append("div")
               .attr('class', 'about_plane_line')
               .html(`Destination: ${d.route.destination_name}`)
            div.append("div")
               .attr('class', 'about_plane_line')
               .html(`Count: ${d.route.count}`)
            div.append("div")
               .attr('class', 'about_plane_line')
               .html(`Average duration: ${parseInt(d.route.avg_duration)} min`)
            div.append("div")
               .attr('class', 'about_plane_line')
               .html(`Average delay: ${parseInt(d.route.avg_delay)} min`)
            div.append("div")
               .attr('class', 'about_plane_line')
               .html(`Simulated duration: ${parseInt(d.duration)} min`)
            div.append("div")
               .attr('class', 'about_plane_line')
               .html(`Simulated delay: ${parseInt(d.delay)} min`)
            ctx.selectedPlane = plane
        })

        // Plane movement
        plane
            .transition()
            .duration(d => d.duration * SPEED_FACTOR)
            .attrTween("transform", t => tween(t.traj[0], t.traj[1])())
            .on("end", d => {
                // If the plane was the selected plane clear the selection
                if (plane == ctx.selectedPlane)
                    d3.select("#about_plane").style('display', 'none')
            })
            .remove()
    }

    // Conditions for spawning new planes
    if (routesCountsList.length > 0){
        clearInterval(ctx.intervalSpawnPlanesId)
        ctx.intervalSpawnPlanesId = setInterval(spawnPlane, SPAWN_INTERVAL)
    }
    else {
        clearInterval(ctx.intervalSpawnPlanesId)
    }
}

