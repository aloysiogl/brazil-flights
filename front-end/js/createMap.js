const makeMap = svgEl => {
    // Creating the base map group
    ctx.mapG = svgEl.append("g")
                    .attr("id", "map")

    // Setting up the geopath generator
    // TODO create everything here
    const geoPathGenerator = d3.geoPath().projection(getCurrentProjection())

    // Adding the background elements
    addBackground(geoPathGenerator)

    // Setting the as empty the list of selected states
    ctx.selectedStates = []

    // Adding states
    addStates(geoPathGenerator)

    // // Panning and zooming
    // svgEl.append("rect")
    //      .attr("width", ctx.w)
    //      .attr("height", ctx.h)
    //      .style("fill", "none")
    //      .style("pointer-events", "all")
    //      .call(d3.zoom()
    //              .scaleExtent([1, 8])
    //              .on("zoom", zoomed)
    //      );
    // function zoomed(event, d) {
    //     if (ctx.panZoomMode){
    //         ctx.mapG.attr("transform", event.transform);
    //     }
    // }
};

const addBackground = (generator) => {
    

    // ctx.mapG.selectAll("path")
    //     .data(ctx.countries)
    //     .enter()
    //     .append("path")
    //     .attr("class", "country")
    //     .attr("d", generator)
    //     .style("fill", "white")
};

const addStates = (generator) => {
    ctx.statesGroup = ctx.mapG.append("g").attr("id", "states");
    // d3.select("svg").on("click", function(e,d) {
    //     console.log(e);
    // });

    ctx.statesGroup.selectAll("path")
               .data(ctx.states)
               .enter()
               .append("path")
               .attr("d", generator)
               
             // d3.select("div#info").text(d.callsign)
             // countries = d3.select("svg").select("g#countries")

             // origin = d.origin
             
             // // Color coutnries based on origin flight
             // var recolor = (data) => {
             //     name = data.properties.brk_name

             //     if (name == origin)
             //         return "red"
             //     return "white"
             // }
             
             // // Recoloring countries
             // ctx.countryG.selectAll("path.country")
             //             .data(ctx.countries)
             //             .style("fill", recolor)
        //  })
               .attr("class", "country")
            //    .attr("teset", d => console.log(d))
               
               .style("fill", "yellow")
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
                    const colorState = (d) => {
                        const selection = d.properties.sigla
                        if (ctx.selectedStates.includes(selection))
                            return "green"
                        return "yellow"
                    }

                    // Redrawing the states map with highlight colors
                    ctx.statesGroup.selectAll("path")
                                   .data(ctx.states)
                                   .style("fill", colorState)
               })
               
}