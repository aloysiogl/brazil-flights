const makeMap = svgEl => {
    // Parameters for the map
    ctx.mapParams = {
        center: [-55, -15],
        scale: 500,
    }

    // Creating the base map group
    ctx.mapG = svgEl.append("g")
                    .attr("id", "map")

    // Creating the projection
    ctx.projection = d3.geoEquirectangular()
                         .center(ctx.mapParams.center)
                         .scale(ctx.mapParams.scale)

    // Setting up the projection
    ctx.geoPathGenerator = d3.geoPath().projection(ctx.projection)

    // Adding the background elements
    addBackground(ctx.geoPathGenerator)

    // Adding states
    addStates(ctx.geoPathGenerator)

    // Setting up the zoom
    const zoomTransform = (e, d) => ctx.mapG.attr("transform", e.transform)

    const zoom = d3.zoom()
                   .scaleExtent([0.8, 8])
                   .on('zoom', zoomTransform)
    
    svgEl.call(zoom)
};

const addBackground = (generator) => {
    // Add other countries
    ctx.mapG.selectAll("path")
        .data(ctx.countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", generator)

    // Adding oceans
    var defs = d3.select("svg").insert("defs", "#map");
    defs.append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", generator);
    d3.select("svg")
        .insert("use", "#map")
        .attr("class", "oceans")
        .attr("xlink:href", "#sphere")
        .attr("opacity", 1);
};

const addStates = (generator) => {
    // Adding the group that'll contain all the states
    ctx.statesGroup = ctx.mapG.append("g").attr("id", "states")

    // Adding states in the group
    ctx.statesGroup.selectAll("path")
               .data(ctx.states)
               .enter()
               .append("path")
               .attr("d", generator)
               .attr("class", "brazil_state")
               .on("click", (e,d) => clickOnState(d.properties.sigla))
    
    // Adding group for the routes
    ctx.routesGroup = ctx.mapG.append("g").attr("id", "routes")
    
    // Adding group for the circles
    ctx.circlesGroup = ctx.mapG.append("g").attr("id", "circles")
}

const clickOnState = (state) => {
    console.log(state)
    // Adding or removing it from the list
    if (ctx.filter.states.has(state)){
        ctx.filter.states.delete(state)
    } else {
        ctx.filter.states.add(state)
    }
    
    // Function that defines the states colors
    const stateClass = (d) => {
        const selection = d.properties.sigla
        if (ctx.filter.states.has(selection))
            return "selected_state"
        return "brazil_state"
    }

    // Redrawing the states map with highlight colors
    ctx.statesGroup.selectAll("path")
                   .data(ctx.states)
                   .attr("class", stateClass)

    // Redrawing data
    updateMap()
    ctx.updateSlider()
    ctx.updateAirlines()
    ctx.updateTypes()
}