const makeSlider = () => {
    const HEIGHT = 100
    const BACKGROUND_COLOR = 'rgb(24,26,27)'
    const GRID_COLOR = 'rgb(52, 51, 50)'
    const LINE_COLOR = 'rgba(9, 255, 243, .75)'
    const LABEL_COLOR = 'lightgray'

    // Vega-lite spec for the slider graph
    var vlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: { name: 'data', values: { date: '2020-01-01', count: 1 } },
        width: ctx.w,
        height: HEIGHT,
        autosize: {
            type: 'fit',
            contains: 'padding',
        },
        mark: 'line',
        selection: {
            brush: { type: 'interval', bind: 'scales', encodings: ['x'] },
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        encoding: {
            x: {
                field: 'date',
                type: 'temporal',
                title: null,
                axis: {
                    grid: false,
                    domainColor: GRID_COLOR,
                    tickColor: GRID_COLOR,
                    labelColor: LABEL_COLOR,
                },
            },
            y: {
                field: 'count',
                type: 'quantitative',
                title: null,
                axis: {
                    tickCount: 4,
                    gridColor: GRID_COLOR,
                    domainColor: GRID_COLOR,
                    labels: false,
                    ticks: false,
                },
            },
            color: { value: LINE_COLOR },
        },
    }

    // Create element
    sliderG = d3.select('#interactiveMap').append('g').attr('id', 'slider')
    var vlOpts = { actions: false }
    vegaEmbed('#slider', vlSpec, vlOpts).then(({ _, view }) => {
        configureSliderSignalListener(view)

        ctx.updateSlider = () => {
            const request = ctx.bigquery.jobs.query({
                projectId: ctx.projectId,
                query: sliderQuery(),
                useLegacySql: false,
            })
            request.execute(response => {
                const data = response.rows.map(({ f: row }) => ({
                    date: row[0].v,
                    count: parseInt(row[1].v),
                }))

                const changeSet = vega
                    .changeset()
                    .remove(() => true)
                    .insert(data)
                view.change('data', changeSet).run()
            })
        }

        ctx.updateSlider()
    })
}

const configureSliderSignalListener = view => {
    // Listen to changes in interval, with a 300 ms debounce
    const debounceInterval = this._.debounce(item => {
        ctx.filter.startDate = item
            ? new Date(item[0]).toISOString().substring(0, 10)
            : null
        ctx.filter.endDate = item
            ? new Date(item[1]).toISOString().substring(0, 10)
            : null

        updateMap()
        ctx.updateAirlines()
        ctx.updateTypes()
    }, 300)
    view.addSignalListener('brush_date', (_, item) => {
        debounceInterval(item)
    })
}

const sliderQuery = () => {
    const { states, airlines, types } = ctx.filter
    filterState = states.size > 0
    filterAirline = airlines.size > 0
    filterType = types.size > 0

    return `SELECT
                r.date,
                SUM(r.count) as count
            FROM
                \`inf552-project.routes.routes\` r
            WHERE
                1 = 1
                ${
                    filterAirline
                        ? `AND r.airline IN ("${Array.from(airlines).join(
                              '","'
                          )}")`
                        : ''
                }
                ${
                    filterType
                        ? `AND r.type IN (${Array.from(types).join()})`
                        : ''
                }
                ${
                    filterState
                        ? `AND r.origin_state IN ("${Array.from(states).join(
                              '","'
                          )}")`
                        : ''
                }
                ${
                    filterState
                        ? `AND r.destination_state IN ("${Array.from(
                              states
                          ).join('","')}")`
                        : ''
                }
            GROUP BY
                r.date
            ORDER BY
                r.date`
}
