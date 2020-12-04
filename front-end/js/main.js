// import {addCountries} from "./createMap.js"

var ctx = {
    w: 960,
    h: 484,
    filter: {
        startDate: null,
        endDate: null,
        states: new Set(),
        airlines: new Set(),
    },
    currentDropdownState: "hybrid"
}

var createViz = () => {
    console.log('Using D3 v' + d3.version)
    var svgEl = d3.select('#interactiveMap').append('svg')
    svgEl.attr('width', ctx.w)
    svgEl.attr('height', ctx.h)
    loadData(svgEl)
}

var loadData = svgEl => {
    // Load data, transform it, store it in ctx
    const path = 'data/'
    const files = [
        'ne_50m_admin_0_countries.geojson',
        'brazil_states.geojson',
        'filtered_airports.csv',
        'filtered_airlines.csv',
        // 'routes_counts.csv',
        'routes_counts_small.csv',
        // 'airlines_counts.csv',
        'airlines_counts_small.csv',
    ]
    const loaders = files.map(f => {
        if (f.substring(f.length - 3, f.length) == 'csv')
            return d3.csv(path + f)
        else return d3.json(path + f)
    })

    // Executing loads and then calling makeMap
    Promise.all(loaders).then(values => {
        ctx.countries = values[0].features
        ctx.states = values[1].features
        ctx.airports = values[2]
        ctx.airlines = values[3]
        ctx.routesCounts = values[4]
        ctx.airlinesCounts = values[5]
        ctx.airportsMap = new Map(
            ctx.airports.map(airport => [airport.code, airport])
        )
        ctx.airlinesMap = new Map(
            ctx.airlines.map(airline => [airline.code, airline])
        )

        // Drawing screen elements
        makeMap(svgEl)
        makeSlider()
        makeTypesPlot()
        makeCompaniesPlot()
        updateMap()
    })
}
