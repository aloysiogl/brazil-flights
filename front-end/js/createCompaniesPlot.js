const makeCompaniesPlot = () => {
    const HEIGHT = 260 - 4
    const WIDTH = ctx.w / 2
    const BACKGROUND_COLOR = 'rgb(24,26,27)'
    const GRID_COLOR = 'rgb(52, 51, 50)'
    const BARS_COLOR = 'rgba(9, 255, 243, .75)'
    const LABEL_COLOR = 'lightgray'

    var vlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        width: WIDTH,
        height: HEIGHT,
        autosize: {
            type: 'fit',
            contains: 'padding',
        },
        data: { name: 'data', values: { airline: 'AAA', count: 0 } },
        mark: {
            type: 'bar',
            cornerRadiusEnd: { expr: 1 },
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        selection: {
            highlight: { type: 'single', empty: 'none', on: 'mouseover' },
            select: { type: 'single' },
        },
        encoding: {
            y: {
                field: 'airline',
                type: 'nominal',
                title: null,
                axis: {
                    labelAngle: 0,
                    labelColor: LABEL_COLOR,
                },
                scale: {
                    paddingInner: 0.8,
                    paddingOuter: 0.8,
                },
                sort: '-x',
            },
            x: {
                field: 'count',
                type: 'quantitative',
                title: 'Nº of Flights',
                axis: {
                    format: '~s',
                    titleColor: LABEL_COLOR,
                    gridColor: GRID_COLOR,
                    domainColor: GRID_COLOR,
                    tickColor: GRID_COLOR,
                    labelColor: LABEL_COLOR,
                },
            },
            tooltip: { field: 'name', type: 'nominal' },
            color: { value: BARS_COLOR },
            fillOpacity: {
                condition: [
                    { selection: 'highlight', value: 1 },
                    { selection: 'select', value: 0.75 },
                ],
                value: 0.3,
            },
        },
    }

    // Create element
    sliderG = d3.select('#plots').append('g').attr('id', 'companies')
    var vlOpts = { actions: false }
    vegaEmbed('#plots #companies', vlSpec, vlOpts).then(({ _, view }) => {
        configureAirlinesSignalListener(view)

        ctx.updateAirlines = () => {
            const request = ctx.bigquery.jobs.query({
                projectId: ctx.projectId,
                query: airlinesQuery(),
                useLegacySql: false,
            })
            request.execute(response => {
                const data = response.rows.map(({ f: row }) => ({
                    airline: row[0].v,
                    count: parseInt(row[1].v),
                    name: ctx.airlinesMap.get(row[0].v).name,
                }))

                updateVegaSlider(view, data)
            })
        }

        ctx.updateAirlines()
    })
}

const configureAirlinesSignalListener = view => {
    view.addSignalListener('select', (_, item) => {
        // The only way I found to get their respective airlines was building their vgsid when data changes
        const selectedSids = item?._vgsid_ ?? []
        ctx.filter.airlines = new Set(
            Array.from(ctx.airlinesVgSid.entries())
                .filter(([_, vgsid]) => selectedSids.includes(vgsid))
                .map(([airline, _]) => airline)
        )

        updateMap()
        ctx.updateSlider()
        ctx.updateTypes()
    })
}

const updateVegaSlider = (view, newData) => {
    const newDataMap = new Map(newData.map(data => [data.airline, data]))
    const curData = view.data('data')
    const curDataMap = new Map(curData.map(data => [data.airline, data]))

    // Airlines that weren't showing before
    const insert = newData.filter(({ airline }) => !curDataMap.has(airline))

    // Airlines that won't show anymore
    const remove = curData.filter(({ airline }) => {
        if (!newDataMap.has(airline)) {
            // Remove from filter
            if (ctx.filter.airlines.has(airline)) {
                ctx.filter.airlines.delete(airline)
            }
            return true
        }
        return false
    })

    // Fix vgsig indices to be used later
    if (!ctx.airlinesVgSidCnt) {
        ctx.airlinesVgSidCnt = 1
        ctx.airlinesVgSid = new Map(
            insert.map(({ airline }) => {
                ctx.airlinesVgSidCnt += 1
                return [airline, ctx.airlinesVgSidCnt]
            })
        )
    } else {
        insert.forEach(({ airline }) => {
            ctx.airlinesVgSidCnt += 1
            ctx.airlinesVgSid.set(airline, ctx.airlinesVgSidCnt)
        })
    }

    // Modify airlines that are already in the plot
    const changeSet = vega.changeset().remove(remove).insert(insert)
    curData
        .filter(({ airline }) => newDataMap.has(airline))
        .forEach(cur => {
            changeSet.modify(cur, 'count', newDataMap.get(cur.airline).count)
        })

    view.change('data', changeSet).run()
}

const airlinesQuery = () => {
    const { startDate: start, endDate: end, states, types } = ctx.filter
    filterDate = start || end
    filterState = states.size > 0
    filterType = types.size > 0

    return `SELECT
                r.airline,
                SUM(r.count) as count
            FROM
                \`inf552-project.routes.routes\` r
            WHERE
                1 = 1
                ${
                    filterDate
                        ? `AND "${start}" <= r.date AND r.date <= "${end}"`
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
                r.airline
            ORDER BY
                count DESC
            LIMIT 10`
}
