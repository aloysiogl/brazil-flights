const makeTypesPlot = () => {
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
        data: { name: 'data', values: { name: ['', ''], count: 100000 } },
        mark: {
            type: 'bar',
            cornerRadiusEnd: { expr: 1 },
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        selection: {
            highlight: { type: 'single', empty: 'none', on: 'mouseover' },
            select: { type: 'multi', toggle: 'true' },
        },
        encoding: {
            x: {
                field: 'name',
                type: 'nominal',
                title: null,
                sort: '-y',
                axis: {
                    labelAngle: 0,
                    labelColor: LABEL_COLOR,
                },
                scale: {
                    paddingInner: 0.6,
                    paddingOuter: 0.6,
                },
            },
            y: {
                field: 'count',
                type: 'quantitative',
                title: 'Nº of Flights',
                scale: { type: 'log' },
                axis: {
                    format: '~s',
                    titleColor: LABEL_COLOR,
                    gridColor: GRID_COLOR,
                    domainColor: GRID_COLOR,
                    tickColor: GRID_COLOR,
                    labelColor: LABEL_COLOR,
                },
            },
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
    sliderG = d3.select('#plots').append('g').attr('id', 'types')
    var vlOpts = { actions: false }
    vegaEmbed('#plots #types', vlSpec, vlOpts).then(({ _, view }) => {
        configureTypesSignalListener(view)

        const names = {
            1: ['Domestic', 'mixed'],
            2: ['Domestic', 'freighter'],
            3: ['International', 'mixed'],
            4: ['International', 'freighter'],
            5: ['Not', 'informed'],
            6: ['Sub', 'regional'],
            7: ['Postal', 'network'],
            8: 'Regional',
            9: 'Special',
        }

        ctx.updateTypes = () => {
            const request = ctx.bigquery.jobs.query({
                projectId: ctx.projectId,
                query: typesQuery(),
                useLegacySql: false,
            })
            request.execute(response => {
                const data = response.rows.map(({ f: row }) => ({
                    type: parseInt(row[0].v),
                    count: parseInt(row[1].v),
                    name: names[parseInt(row[0].v)],
                }))

                updateVegaTypes(view, data)
            })
        }

        ctx.updateTypes()
    })
}

const configureTypesSignalListener = view => {
    view.addSignalListener('select_tuple', (_, item) => {
        if (item) {
            // The only way I found to get their respective airlines was building their vgsid when data changes
            const type = Array.from(ctx.typesVgSid.entries()).filter(
                ([_, vgsid]) => vgsid == item.values[0]
            )[0][0]
            if (ctx.filter.types.has(type)) {
                ctx.filter.types.delete(type)
            } else {
                ctx.filter.types.add(type)
            }
        }

        updateMap()
        ctx.updateSlider()
        ctx.updateAirlines()
    })
}

const updateVegaTypes = (view, newData) => {
    const newDataMap = new Map(newData.map(data => [data.type, data]))
    const curData = view.data('data')
    const curDataMap = new Map(curData.map(data => [data.type, data]))

    // Types that weren't showing before
    const insert = newData.filter(({ type }) => !curDataMap.has(type))

    // Types that won't show anymore
    const remove = curData.filter(({ type }) => {
        if (!newDataMap.has(type)) {
            // Remove from filter
            if (ctx.filter.types.has(type)) {
                ctx.filter.types.delete(type)
            }
            return true
        }
        return false
    })

    // Fix vgsig indices to be used later
    if (!ctx.typesVgSidCnt) {
        ctx.typesVgSidCnt = 1
        ctx.typesVgSid = new Map(
            insert.map(({ type }) => {
                ctx.typesVgSidCnt += 1
                return [type, ctx.typesVgSidCnt]
            })
        )
    } else {
        insert.forEach(({ type }) => {
            ctx.typesVgSidCnt += 1
            ctx.typesVgSid.set(type, ctx.typesVgSidCnt)
        })
    }
    

    // Modify types that are already in the plot
    const changeSet = vega.changeset().remove(remove).insert(insert)
    curData
        .filter(({ type }) => newDataMap.has(type))
        .forEach(cur => {
            changeSet.modify(cur, 'count', newDataMap.get(cur.type).count)
        })

    view.change('data', changeSet).run()
}

const typesQuery = () => {
    const { startDate: start, endDate: end, states, airlines } = ctx.filter
    filterDate = start || end
    filterState = states.size > 0
    filterAirline = airlines.size > 0

    return `SELECT
                r.type,
                SUM(r.count) as count,
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
                    filterAirline
                        ? `AND r.airline IN ("${Array.from(airlines).join(
                              '","'
                          )}")`
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
                r.type
            ORDER BY
                count DESC
            LIMIT 6`
}
