const makeMap = svgEl => {
    // Creating the base map group
    ctx.mapG = svgEl.append("g")
                    .attr("id", "map")

    // Setting up the geopath generator

    // var projection = d3.geoMercator()
    // .center([0, 5 ])
    // .scale(200)
    // .rotate([-180,0]);
    const projection = d3.geoEquirectangular()
                        //  .center([0,100])
                         .scale(500)
    const center = d3.geoCentroid(ctx.countries);
    console.log(center)
    const geoPathGenerator = d3.geoPath().projection(projection)

    // Adding the background elements
    addBackground(geoPathGenerator)

    // Setting the as empty the list of selected states
    ctx.selectedStates = []

    // Adding states
    addStates(geoPathGenerator)

    // var zoom = d3.zoom()
    //   .scaleExtent([1, 8])
    //   .on('zoom', function() {
    //       ctx.mapG.selectAll('path')
    //        .data(ctx.countries)
    //        .attr('transform', d3.event.transform);
    //     });     
    // svgEl.call(zoom)

    const zoom = d3.zoom()
      .scaleExtent([0.5, 8])
      .on('zoom', zoomed);
    
    svgEl.call(zoom);

    // Panning and zooming
    svgEl.append("rect")
         .attr("width", ctx.w)
         .attr("height", ctx.h)
         .style("fill", "none")
         .style("pointer-events", "auto")
         .call(d3.zoom()
                 .scaleExtent([1, 8])
                 .on("zoom", zoomed)
         );
    ctx.tr = false
    function zoomed(event, d) {
        if (ctx.panZoomMode){
            if (!ctx.tr){
                var trans = event.transform
                // trans.x = trans.x+487
                // trans.y = trans.y-120
                ctx.mapG.attr("transform", trans);
                ctx.tr = true
            }
            else {
                var trans = event.transform
                ctx.mapG.attr("transform", trans);
            }
        }
    }
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
    
    // ctx.mapG.attr("transform", "translate(487, -120)")
};

const addStates = (generator) => {
    // Adding the group that'll contain all the states
    ctx.statesGroup = ctx.mapG.append("g").attr("id", "states");

    // Adding states in the group
    ctx.statesGroup.selectAll("path")
               .data(ctx.states)
               .enter()
               .append("path")
               .attr("d", generator)
               .attr("class", "brazil_state")
               .on("click", (e,d) => {
                    // Getting current selection
                    const state = d.properties.sigla
                    
                    // Adding or removing it from the list
                    if (ctx.selectedStates.includes(state)){
                        const index = ctx.selectedStates.indexOf(state);
                        if (index > -1)
                            ctx.selectedStates.splice(index, 1);
                    }
                    else
                        ctx.selectedStates.push(state)
                    
                    // Function that defines the states colors
                    const stateClass = (d) => {
                        const selection = d.properties.sigla
                        if (ctx.selectedStates.includes(selection))
                            return "selected_state"
                        return "brazil_state"
                    }

                    // Redrawing the states map with highlight colors
                    ctx.statesGroup.selectAll("path")
                                   .data(ctx.states)
                                   .attr("class", stateClass)
               })
               
}