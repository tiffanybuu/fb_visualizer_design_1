/**
 * Main entry point -- this file has been added to index.html in a <script> tag. Add whatever imports and code you
 * want below.  For a detailed explanation of JS modules, see
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
 */
import * as d3 from "d3";


/*
 * Why this line? Because if this script runs before the svg exists, then nothing will happen, and d3 won't even
 * complain.  This delays drawing until the entire DOM has loaded.
 */

const padding = {top: 60, left: 80, right: 10, bottom: 40}
const svgWidth = 900;
const svgHeight = 500;
const height = svgHeight - padding.top - padding.bottom;
const width = svgWidth - padding.right - padding.left;
const parseTime = d3.timeParse("%b-%Y")
const formatTime = d3.timeFormat("%b %Y")
const legendVals = ['Messages Sent', 'Messages Received']
const bisectDate = d3.bisector(d => d.date);

const sentiData = [
    {"name": "Anna", "freq": 21, "pos": 0.9155117803728744, "neg": 0.08081561155500923},
{"name": "Suzy", "freq": 30, "pos": 0.1505277364505845, "neg": 0.04042359192348565},
{"name": "Harry", "freq": 25, "pos": 0.0460962634578847, "neg": 0.07811044965167828},
{"name": "Elizabeth", "freq": 40, "pos": 0.20239995436915356, "neg": 0.08280207620351357}
]

function colorBars(key) {
    if (key == 'before_covid') {
        return '#E76F51'
    }
    return '#2A9D8F'
}
const freq_selection_data = [
    {
        graph_type: "Select Graph Here"
    },
    {
        graph_type: "Message Frequency",
    },
    {
        graph_type: "Call Duration"
    },
    {
        graph_type: "Number of Calls"
    },
    {
        graph_type: "Keywords"
    },
    {
        graph_type: "Sentiment"
    }
]



// const allTemps = weatherData.map(city => city.averageHighByMonth).flat()
const allTemps = sentiData.map(d => d.freq).flat()
const names = sentiData.map(d=>d.name).flat()

// window.addEventListener("load", populateFreqGraph);
window.addEventListener("load", populateFreqDropdown);

function populateFreqGraph(index) {
    const svg = d3.select(".freq")
    .attr('width', svgWidth)
    .attr('height', svgHeight)

    //d3.select('.overall-graph.svg.deleteMe').remove()

    if (index == 0) {
        svg.selectAll("*").remove();
    }
    else if (index == 1) {
        svg.selectAll("*").remove();
        d3.select('.overall-graph').append('div').attr('class', 'tooltip-freq')
        d3.select('.tooltip-freq').append('p').attr('class', 'tooltip-date');
        d3.select('.tooltip-freq').append('p').attr('class', 'message-received');
        d3.select('.tooltip-freq').append('p').attr('class', 'message-sent');

        d3.json("freq_messages.json").then(function (data) {

            data.forEach(function(d) {
                d.date = parseTime(d.date);
                d.received = +d.received;
                d.sent = +d.sent;
            })
            const x = d3.scaleTime()
                .domain(d3.extent(data, d => (d.date)))
                .range([padding.left, svgWidth-padding.right])

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => Math.max(d.sent, d.received))])
                .range([svgHeight-padding.top, padding.bottom])

            const valueline_received = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.received))

            const valueline_sent = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.sent))

            svg.append('path')
            .data(data)
            .attr('d', valueline_received(data))
            .attr('stroke', '#E76F51')
            .attr('stroke-width', 2)
            .attr('fill', 'none')

            svg.append('path')
            .data(data)
            .attr('d', valueline_sent(data))
            .attr('stroke', '#2A9D8F')
            .attr('stroke-width', 2)
            .attr('fill', 'none')


            svg.append('g')
                .call(d3.axisBottom(x).ticks(15))
                .attr('transform', `translate(0, ${svgHeight-padding.top})`)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            svg.append('g')
                .call(d3.axisLeft(y))
                .attr('transform', `translate(${padding.left}, 0)`)

            // title
            svg.append("text")
            .attr("x", (svgWidth / 2))
            .attr("y", padding.top-40)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-family", 'Roboto Slab')
            .text("Frequency of Messages Pre-Covid (2019-2020) vs. During Covid (2020-2021)");

            // y axis label
            svg.append('text')
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-family", 'Roboto Slab')
            .attr("transform", `translate(${padding.left-50} ${(svgHeight/2)}) rotate(-90)`)
            .text("Number of Messages")

            //http://bl.ocks.org/wdickerson/64535aff478e8a9fd9d9facccfef8929
            const tooltip = d3.select('.tooltip-freq')
                .attr('width', 120)
                .attr('height', 200);
            const tooltipLine = svg.append('line');
            const lineSelection = d3.selectAll('path')

            const tipBox = svg.append('rect')
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .attr('opacity', 0)
            .on("mouseover", (event) => {
                tooltip.style("opacity", 1)
            })
            .on("mouseout", (event) => {
                tooltip.style('opacity', 0)
            })
            .on("mousemove", mousemove);

            function mousemove(event) {
                const coords = d3.pointer(event)
                const date = x.invert(d3.pointer(event, this)[0])
                const i = bisectDate.left(data, date)
                const d0 = data[i-1]
                const d1 = data[i]

                let d;
                if (d0 == undefined) {
                    d = d1;
                } else if (d1 == undefined) {
                    d = d0
                } else {
                    d = date - date.date > d1.date - date ? d1 : d0;
                }

                tooltipLine.attr('stroke', 'black')
                .attr('x1', x(d.date))
                .attr('x2', x(d.date))
                .attr('y1', svgHeight-padding.top)
                .attr('y2', padding.bottom);

                tooltip.style("left", coords[0] + 20 + 'px')
                tooltip.style("top", coords[1] - 20 +'px')

                tooltip.select('.tooltip-date')
                    .text(formatTime(d.date))

                tooltip.select('.message-received')
                    .text('Messages Received: ' + d.received)

                tooltip.select('.message-sent')
                    .text('Messages Sent: ' + d.sent)
              }

        });

        const legend = svg.append('g').attr('class', 'freq-legend')
        legend.append('rect').attr('class', 'legend-received-rect')
            .attr('width', 30)
            .attr('height', 10)
            .attr('fill', '#E76F51')
            .attr('x', 730)
            .attr('y', 10)
        legend.append('text')
            .attr('x', 765)
            .attr('y', 13)
            .text('Messages Received')
            .attr("dy", ".50em")
            .attr('font-size', '12px')
            .attr('font-family', 'Roboto Slab')
            .attr('font-weight', 300)

        legend.append('rect').attr('class', 'legend-sent-rect')
        .attr('width', 30)
        .attr('height', 10)
        .attr('fill', '#2A9D8F')
        .attr('x', 730)
        .attr('y', 30)
        legend.append('text')
            .attr('x', 765)
            .attr('y', 33)
            .text('Messages Sent')
            .attr("dy", ".50em")
            .attr('font-size', '12px')
            .attr('font-family', 'Roboto Slab')
            .attr('font-weight', 300)

    } else if (index == 2) {
        svg.selectAll("*").remove();
        d3.select('.tooltip-freq').remove();

        d3.json("call_duration.json").then(function (data) {
            data.forEach(function(d) {
                d.friend = d.friend;
                d.total = +d.total;
                d.before_covid = +d.before_covid;
                d.during_covid = +d.during_covid;
            })
            const friends = d3.map(data, d => d.friend)
            // const subgroup = ['before_covid','during_covid']
            const subgroup = Object.keys(data[0]).slice(2)

            // title
            svg.append("text")
            .attr("x", (svgWidth / 2))
            .attr("y", padding.top-40)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-family", 'Roboto Slab')
            .text("Call Durations Pre-Covid vs During Covid Among Top 5 Most Called Friends");

            const x = d3.scaleBand()
                .domain(friends)
                .range([padding.left, svgWidth-padding.right])
                .padding(0.2)

            const xSubgroup = d3.scaleBand()
                .domain(subgroup)
                .range([0, x.bandwidth()])
                .padding([0.05])

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => Math.max(d.before_covid, d.during_covid))])
                .range([height, 0])

            // axis
            svg.append('g')
                .call(d3.axisBottom(x))
                .attr('transform', `translate(0, ${svgHeight-padding.top})`)
                .selectAll("text")
                .style("text-anchor", "middle")
            svg.append('g')
                .call(d3.axisLeft(y))
                .attr('transform', `translate(${padding.left}, ${padding.bottom})`)

            // y axis label
            svg.append('text')
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-family", 'Roboto Slab')
            .attr("transform", `translate(${padding.left-50} ${(svgHeight/2)}) rotate(-90)`)
            .text("Call Duration (in Minutes)")

            // bars
            svg.append('g')
                .selectAll('g')
                .data(data)
                .enter()
                .append('g')
                .attr("transform", d => "translate(" + x(d.friend) + ",40)" )
                .selectAll('rect')
                .data(d => subgroup.map(k => {return {k: k, value: d[k]}}))
                .enter()
                .append('rect')
                .attr('x', d => xSubgroup(d.k))
                .attr('y', d => y(d.value))
                .attr('width', xSubgroup.bandwidth())
                .attr('height', d => height - y(d.value))
                .attr('fill', d => colorBars(d.k))

            // tooltip
            // const tooltip = d3.select(".tooltip-call-duration")
            // const rectSelection = d3.selectAll("rect")

            // rectSelection
            // .on("mouseover", (mouseEvent, d) => {
            //     tooltip.style("opacity", 1)
            //     tooltip.text(d.value.toFixed(2))
            //     // Runs when the mouse enters a rect.  d is the corresponding data point.
            //     // Show the tooltip and adjust its text to say the temperature.
            // })
            // .on("mousemove", (mouseEvent, d) => {
            //     /* Runs when mouse moves inside a rect */
            //     const coords = d3.pointer(mouseEvent)
            //     console.log(coords)
            //     tooltip.style("left", coords[0] +'px')
            //     tooltip.style("top", coords[1] +'px')
            // })
            // .on("mouseout", (mouseEvent, d) => {
            //     tooltip.style("opacity", 0)
            // });



            // legend
            const legend = svg.append('g').attr('class', 'call-duration-legend')
            legend.append('rect')
                .attr('width', 30)
                .attr('height', 10)
                .attr('fill', '#E76F51')
                .attr('x', 730)
                .attr('y', 10)
            legend.append('text')
                .attr('x', 765)
                .attr('y', 13)
                .text('Pre-Covid')
                .attr("dy", ".50em")
                .attr('font-size', '12px')
                .attr('font-family', 'Roboto Slab')
                .attr('font-weight', 300)

                legend.append('rect')
                .attr('width', 30)
                .attr('height', 10)
                .attr('fill', '#2A9D8F')
                .attr('x', 730)
                .attr('y', 30)
                legend.append('text')
                    .attr('x', 765)
                    .attr('y', 33)
                    .text('During Covid')
                    .attr("dy", ".50em")
                    .attr('font-size', '12px')
                    .attr('font-family', 'Roboto Slab')
                    .attr('font-weight', 300)
        })
    } else if (index == 3) {
        // freq of calls
        svg.selectAll("*").remove();
        d3.select('.tooltip-freq').remove();
        d3.select('.overall-graph').append('div').attr('class', 'tooltip-num-calls')
        d3.select('.tooltip-num-calls').append('p').attr('class', 'tooltip-date');
        d3.select('.tooltip-num-calls').append('p').attr('class', 'total-calls');

        d3.json("freq_calls.json").then(function (data) {

            data.forEach(function(d) {
                d.date = parseTime(d.date);
                d.total = +d.total;
            })

            const x = d3.scaleTime()
                .domain(d3.extent(data, d => (d.date)))
                .range([padding.left, svgWidth-padding.right])

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.total)])
                .range([svgHeight-padding.top, padding.bottom])

            const valueline_total = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.total))


            svg.append('path')
            .data(data)
            .attr('d', valueline_total(data))
            .attr('stroke', '#E76F51')
            .attr('stroke-width', 2)
            .attr('fill', 'none')

            svg.append('g')
                .call(d3.axisBottom(x).ticks(15))
                .attr('transform', `translate(0, ${svgHeight-padding.top})`)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            svg.append('g')
                .call(d3.axisLeft(y))
                .attr('transform', `translate(${padding.left}, 0)`)

            // title
            svg.append("text")
            .attr("x", (svgWidth / 2))
            .attr("y", padding.top-40)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-family", 'Roboto Slab')
            .text("Frequency of Calls Pre-Covid (2019-2020) vs. During Covid (2020-2021)");

            // y axis label
            svg.append('text')
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-family", 'Roboto Slab')
            .attr("transform", `translate(${padding.left-50} ${(svgHeight/2)}) rotate(-90)`)
            .text("Number of Calls")

            //http://bl.ocks.org/wdickerson/64535aff478e8a9fd9d9facccfef8929
            const tooltip = d3.select('.tooltip-num-calls')
                .attr('width', 120)
                .attr('height', 200);
            const tooltipLine = svg.append('line');
            const lineSelection = d3.selectAll('path')

            const tipBox = svg.append('rect')
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .attr('opacity', 0)
            .on("mouseover", (event) => {
                tooltip.style("opacity", 1)
            })
            .on("mouseout", (event) => {
                tooltip.style('opacity', 0)
            })
            .on("mousemove", mousemove);

            function mousemove(event) {
                const coords = d3.pointer(event)
                const date = x.invert(d3.pointer(event, this)[0])
                const i = bisectDate.left(data, date)
                const d0 = data[i-1]
                const d1 = data[i]

                let d;
                if (d0 == undefined) {
                    d = d1;
                } else if (d1 == undefined) {
                    d = d0
                } else {
                    d = date - date.date > d1.date - date ? d1 : d0;
                }

                tooltipLine.attr('stroke', 'black')
                .attr('x1', x(d.date))
                .attr('x2', x(d.date))
                .attr('y1', svgHeight-padding.top)
                .attr('y2', padding.bottom);

                tooltip.style("left", coords[0] + 20 + 'px')
                tooltip.style("top", coords[1] - 20 +'px')

                tooltip.select('.tooltip-date')
                    .text(formatTime(d.date))

                tooltip.select('.total-calls')
                    .text('Total Number of Calls: ' + d.total)

              }

        });
    } else if (index == 4) {
        // Keyword Bubble Chart
        svg.selectAll("*").remove();
        d3.select('.tooltip-freq').remove();
        d3.select('.tooltip-call-duration').remove();

        function colorMap(category) {
          if (category == "covid") {
            return "#264653";
          } else if (category == "emotions") {
            return "#2A9D8F";
          } else if (category == "recreation") {
            return "#E9C46A";
          } else {
            return "#E76F51";
          }
        }

        // Referenced this website when creating this bubble chart:
        //https://bl.ocks.org/alokkshukla/3d6be4be0ef9f6977ec6718b2916d168

        //Also found this StackOverflow post helpful
        //https://stackoverflow.com/questions/22774049/appending-multiple-bubble-cloud-charts-with-d3-js
        function renderBubbleChart(data, xOffset, yOffset, title_name) {
            var diameter = 450;

            var bubble = d3.pack(data)
                .size([diameter, diameter])
                .padding(1.5);

            var nodes = d3.hierarchy(data)
                .sum(function(d) { return d.freq; });

            var node = svg.selectAll(".node")
                .data(bubble(nodes).descendants())
                .enter()
                .filter(function(d){
                    return  !d.children
                })
                .append("g")
                .attr("class", "node" + title_name)
                .attr("transform", function(d) {
                    return "translate(" + (d.x + xOffset) + "," + (d.y + yOffset) + ")";
                });

            node.append("title")
                .text(function(d) {
                    return d.data.word + ": " + d.data.freq;
                });

            node.append("circle")
                .attr("r", function(d) {
                    return d.r;
                })
                .style("fill", function(d) {
                    return colorMap(d.data.category);
                });

            node.append("text")
                .attr("dy", ".2em")
                .style("text-anchor", "middle")
                .text(function(d) {
                    return d.data.word.substring(0, d.r / 3);
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", function(d){
                    return d.r/5;
                })
                .attr("fill", "white");

            node.append("text")
                .attr("dy", "1.3em")
                .style("text-anchor", "middle")
                .text(function(d) {
                    return d.data.freq;
                })
                .attr("font-family",  "Gill Sans", "Gill Sans MT")
                .attr("font-size", function(d){
                    return d.r/5;
                })
                .attr("fill", "white");

            d3.select(self.frameElement)
                .style("height", diameter + "px");

            //add title
            svg.append("text")
              .attr("x", 20 + xOffset)
              .attr("y", 20 + yOffset)
              .text(title_name)
        }

        d3.json("freq_keywords.json").then(function (data) {
            renderBubbleChart({ "children" : data.pre_covid }, 0, 0, "Pre-Covid");
            renderBubbleChart({ "children" : data.during_covid }, 450, 0, "During Covid");
        });
    } else if (index == 5) {
        svg.selectAll("*").remove();
        d3.select('.tooltip-freq').remove();
        d3.select('.tooltip-call-duration').remove();
        function sentimentBars() {
            // const padding = {top:40,left:40,right:20,bottom:40};
            //const svg = d3.select(".senti");

            const lowVal = d3.min(allTemps);
            const maxVal = d3.max(allTemps);
            const xForMonth = d3.scaleBand().domain(names)
            .range([padding.left, svgWidth-padding.right]).padding(0.6); // TODO
            // .padding();
            const yForTemp = d3.scaleLinear().domain([0, maxVal]).range([svgHeight-padding.top, padding.bottom]);
            // d3 has been added to the html in a <script> tag so referencing it here should work.
            var color = d3.scaleLinear()
                .domain([0, 1])
                .range(["#F6BD8D", "#E27012"]);

            const yTranslation = svgHeight-(padding.top);
            const xTranslation = padding.left;
            const xAxis = svg.append("g").call(d3.axisBottom(xForMonth)) // d3 creates a bunch of elements inside the &lt;g&gt;
            .attr("transform", `translate(0, ${yTranslation})`); // TODO yTranslation

            const yAxis = svg.append("g").call(d3.axisLeft(yForTemp))
            .attr("transform", `translate(${xTranslation}, 0)`);

            var yourYHere = (svgHeight);
            var yourXHere = svgWidth/2;
            svg.append("text").attr("font-size", 12).attr("font-weight", "bold").attr("font-family", "sans-serif").attr("x", yourXHere).attr("y", yourYHere).text("Friend");
            var yourYHere = (svgHeight)/2+padding.top+padding.bottom;
            var yourXHere = padding.left-30;
            svg.append("text").attr("font-size", 12).attr("font-weight", "bold") // should be moved to CSS. For now, the code is this
            .attr("font-family", "sans-serif") // way to simplify our directions to you.
            .attr("transform", `translate(${yourXHere} ${yourYHere}) rotate(-90)`)
            .text("Number of messages exchanged");


            svg.selectAll("rect")
            .append("rect")
                .attr("x", 100)
                .attr("y", 100)
                .attr("width", 20)
            .data(sentiData) // (Hardcoded) only Urbana’s data
                .join("rect")
                    .attr("x", d=>xForMonth(d.name))
                    .attr("y", d=>yForTemp(d.freq))
                    .attr("height", d => yForTemp(0)-yForTemp(d.freq))
                    .attr("width", d => xForMonth.bandwidth())
                    .attr("fill", d=>color(d.pos))

            var w = svgWidth, h = 50;

            var key = d3.select("#legend1")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

            var legend = key.append("defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

            legend.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#F6BD8D")
                .attr("stop-opacity", 1);

            // legend.append("stop")
            // .attr("offset", "50%")
            // .attr("stop-color", "#EE852F")
            // .attr("stop-opacity", 1);

            legend.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#E27012")
                .attr("stop-opacity", 1);

            key.append("rect")
                .attr("width", w)
                .attr("height", h - 30)
                .style("fill", "url(#gradient)")
                .attr("transform", "translate(0,10)");

            var y = d3.scaleLinear()
                .domain([1,0])
                .range([svgWidth, 0]);

            var legend_yAxis = d3.axisBottom()
                .scale(y)
                .ticks(5);

            key.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,30)")
                .call(legend_yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("axis title");
        }
        sentimentBars();
    }
}


function populateFreqDropdown() {
    const select = d3.select(".dropdown-frequency")

    select.selectAll('option')
        .data(freq_selection_data)
        .join('option')
        .text(d => d.graph_type)


    select.on("change", (changeEvent, dataPoint) => {
        populateFreqGraph(changeEvent.target.selectedIndex)

    })
}
