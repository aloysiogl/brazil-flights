// import {addCountries} from "./createMap.js"

var ctx = {
    w: 960,
    h: 484,
    panZoomMode: true
};

var createViz = function(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    // Load data, transform it, store it in ctx
    var loadCountries = d3.json("ne_50m_admin_0_countries.geojson")
    var loadBrazilianStates = d3.json("brazil_states.geojson") 

    // Executing loads and then calling makeMap
    Promise.all([loadCountries, loadBrazilianStates])
    .then((values) => {
        ctx.countries = values[0].features
        ctx.states = values[1].features
        
        // Drawing map
        makeMap(svgEl)
    })
};