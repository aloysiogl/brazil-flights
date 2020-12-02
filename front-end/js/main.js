// import {addCountries} from "./createMap.js"

var ctx = {
    w: 960,
    h: 484,
    undefinedColor: "#AAA",
    YEAR: "2015",
    panZoomMode: true,
    TRANSITION_DURATION: 2000,
    rivers: [],
    lakes: [],
    countries: [],
};

const PROJECTIONS = {
    ER: d3.geoEquirectangular().scale(ctx.h / Math.PI),
};




var fadeWaterIn = function(){
    var path4proj = d3.geoPath().projection(getCurrentProjection());
    // clipping
    var defs = d3.select("svg").insert("defs", "#map");
    defs.append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path4proj);
    // defs.append("path")
    //     .datum({type: "Sphere"})
    //     .attr("id", "clipSphere")
    //     .attr("d", path4proj);
    // defs.append("clipPath")
    //     .attr("id", "clip")
    //     .append("use")
    //     .attr("xlink:href", "#clipSphere");
    d3.select("svg")
        .insert("use", "#map")
        .attr("class", "sphereBounds")
        .attr("xlink:href", "#sphere")
        .attr("opacity", 1);
    
};

var getGlobalView = function(){
    ctx.mapG
    .transition()
    .duration(ctx.TRANSITION_DURATION)
    .attr("transform", "translate(0, 0), scale(1, 1)")
};

var getCurrentProjection = function(){
    return (ctx.panZoomMode) ? PROJECTIONS.ER : PROJECTIONS.IM;
};

var createViz = function(){
    console.log("Using D3 v"+d3.version);
    d3.select("body")
      .on("keydown", function(event,d){handleKeyEvent(event);});
    Object.keys(PROJECTIONS).forEach(function(k) {
        PROJECTIONS[k].rotate([0, 0]).center([0, 0]);
    });
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    // Load data, transform it, store it in ctx
    var loadCountries = d3.json("ne_50m_admin_0_countries.geojson")
    var loadLakes = d3.json("ne_50m_lakes.geojson")
    var loadRivers = d3.json("ne_50m_rivers_lake_centerlines.geojson")
    var loadWater = d3.csv("drinking_water.csv")
    var loadBrazilianStates = d3.json("brazil_states.geojson") 

    // Executing loads and then calling makeMap
    Promise.all([loadCountries, loadLakes, loadRivers, loadWater, loadBrazilianStates])
    .then((values) => {
        ctx.countries = values[0].features
        ctx.lakes = values[1].features
        ctx.rivers = values[2].features
        ctx.states = values[4].features

        // Adding extra propertie for water availability
        ctx.countries.forEach(feature => {
            var code = feature.properties.iso_a3
            var waterValue = values[3].find(val => val.Year == ctx.YEAR && val.Code == code)
            if (typeof waterValue != "undefined")
                waterValue = parseFloat(waterValue.ImprovedWaterSourcePC)
            feature.properties["dw"] = waterValue
        })
        
        // Drawing map
        makeMap(svgEl)
    })
};

var togglePZMode = function(){
    ctx.panZoomMode = !ctx.panZoomMode;
    switchProjection(ctx.panZoomMode);
};
