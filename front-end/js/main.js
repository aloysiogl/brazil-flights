// import {addCountries} from "./createMap.js"

var ctx = {
    w: 960,
    h: 484
};

var createViz = () => {
    console.log('Using D3 v' + d3.version)
    var svgEl = d3.select('#main').append('svg')
    svgEl.attr('width', ctx.w)
    svgEl.attr('height', ctx.h)
    loadData(svgEl)
}

var loadData = svgEl => {
    // Load data, transform it, store it in ctx
    const path = "data/"

    var loadCountries = d3.json(path+'ne_50m_admin_0_countries.geojson')
    var loadBrazilianStates = d3.json(path+'brazil_states.geojson')
    var loadAirports = d3.csv(path+'filtered_airports.csv')
    var loadRoutesCounts = d3.csv(path+'routes_counts_small.csv')

    // Executing loads and then calling makeMap
    Promise.all([
        loadCountries,
        loadBrazilianStates,
        loadAirports,
        loadRoutesCounts,
    ]).then(values => {
        ctx.countries = values[0].features
        ctx.states = values[1].features
        ctx.airports = values[2]
        ctx.routesCounts = values[3]

        // Drawing map
        makeMap(svgEl)
        makeSlider()
    })
}
