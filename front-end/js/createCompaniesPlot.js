const makeCompaniesPlot = () => {
    const HEIGHT = 230
    const WIDTH = ctx.w / 2 - 24.98
    const BACKGROUND_COLOR = 'rgb(24,26,27)'
    const GRID_COLOR = 'rgb(52, 51, 50)'
    const BARS_COLOR = 'rgba(9, 255, 243, .75)'
    const LABEL_COLOR = 'lightgray'

    var vlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        width: WIDTH,
        height: HEIGHT,
        data: {
            values: [
                { "a": "A", "b": 28 },
                { "a": "B", "b": 55 },
                { "a": "C", "b": 43 },
                { "a": "D", "b": 91 },
                { "a": "E", "b": 81 },
                { "a": "F", "b": 53 },
                { "a": "G", "b": 19 },
                { "a": "H", "b": 87 },
                { "a": "f", "b": 52 },
                { "a": "J", "b": 100 }
            ]
        },
        mark: {
            type: 'bar',
            cornerRadiusEnd: { "expr": 1 }
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        encoding: {
            y: {
                field: "a",
                type: 'nominal',
                title: null,
                axis: {
                    "labelAngle": 0,
                    labelColor: LABEL_COLOR,
                },
                scale: {
                    paddingInner: 0.8,
                    paddingOuter: 0.8
                }
            },
            x: {
                field: "b",
                type: 'quantitative',
                title: 'Nº of flights',
                axis: {
                    titleColor: LABEL_COLOR,
                    gridColor: GRID_COLOR,
                    domainColor: GRID_COLOR,
                    tickColor: GRID_COLOR,
                    labelColor: LABEL_COLOR,
                },
            },
            color: { value: BARS_COLOR }
        }
    }

    // Create element
    sliderG = d3.select('#plots').append('g').attr('id', 'companies')
    var vlOpts = { actions: false }
    vegaEmbed('#plots #companies', vlSpec, vlOpts)
}