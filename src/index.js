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

const padding = {top: 60, left: 80, right: 10, bottom: 50}
const svgWidth = 900;
const svgHeight = 500;
const height = svgHeight - padding.top - padding.bottom;
const width = svgWidth - padding.right - padding.left;
const parseTime = d3.timeParse("%b-%Y")
const formatTime = d3.timeFormat("%b %Y")
const legendVals = ['Messages Sent', 'Messages Received']
const bisectDate = d3.bisector(d => d.date);

window.addEventListener("load", populateFreqGraph);

function populateFreqGraph() {
    
    const svg = d3.select(".freq")    
        .attr('width', svgWidth)
        .attr('height', svgHeight)

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
        .attr('y', 20)
    legend.append('text')
        .attr('x', 765)
        .attr('y', 23)
        .text('Messages Received')
        .attr("dy", ".50em")
        .attr('font-size', '12px')

    legend.append('rect').attr('class', 'legend-sent-rect')
    .attr('width', 30)
    .attr('height', 10)
    .attr('fill', '#2A9D8F')
    .attr('x', 730)
    .attr('y', 40)
    legend.append('text')
        .attr('x', 765)
        .attr('y', 43)
        .text('Messages Sent')
        .attr("dy", ".50em")
        .attr('font-size', '12px')
}
