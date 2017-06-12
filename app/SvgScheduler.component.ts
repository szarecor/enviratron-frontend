/**
 * Created by szarecor on 6/8/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';
declare var d3 : any;


@Component({
  selector: 'svg-scheduler',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './svg_scheduler_template.html'
})


export class SvgSchedulerComponent {
  @Input() dayCount: number = 0;
  experimentDaysArray : any[];
  svg : any; //d3.select('svg');

  margin : any = {top: 20, right: 20, bottom: 40, left: 20};
  width : number;
  height : number;
  //g : any;
  timePoints : any[] = [];
  circleAttrs : any = {
      cx: function(d : any) { return this.xScale(d.x); },
      cy: function(d : any) { return this.yScale(d.y); },
      r: 6
    };

  startDate : any = new Date();
  endDate : any = new Date();
  xScale : any;
  yScale : any;

  // Emit an event for the parent to handle when there is a change on the days <select> list:
  @Output() onDaysChange: EventEmitter<any> = new EventEmitter<any>();

  // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
  selectedDaysChangeHandler(selectedDays: string[]) {
    this.onDaysChange.emit(selectedDays);
  }


  line : any = d3.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .curve(d3.curveLinear);
    //d3.curveStepAfter);





 updateRendered() {

  var mySelection = this.svg.selectAll("circle")
      .data(
          this.timePoints,
          // tell d3 to bind to a property of the obj and not simply it's array pos:
          function(d,i) { return d.time; }
      );

  mySelection
      .enter()
      .append("circle")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", 5)
      .style("stroke", "steelblue")
      .style("stroke-width", 2)
      .attr("data-celcius", function(d) { return d.temp; })
      .attr("data-time", function(d) { return d.time; })
      .classed("time-series-marker", true)
      .on(
          "click",
          function(p) {
            timePointClick(p);
          }
      )

  mySelection
      .exit()
      .remove();


  this.svg.selectAll("path")
      .data([])
      .exit()
      .remove();


  // Sort the timepoints by time before rendering:
  this.timePoints.sort(function(a,b) {
    if (a === b) {
      return 0;
    } else {
      return a.x < b.x ? -1 : 1;
    }

  });

  // Now make sure that the entire 24 hours are covered:
    console.log(this.timePoints)
  // Create a point for 12:01 AM:
  if (this.timePoints[0].x > 0) {
    this.timePoints.splice(
        0,
        0,
        {
          x: 0
          , y: this.timePoints[0].y
          , temp: this.timePoints[0].temp
          , time: new Date(0).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
    )
  }

  // And create a point to cover to the right end (midnight):
  if (this.timePoints[this.timePoints.length-1].time !== '12:00 AM') {

    var lastTimePoint = this.timePoints[this.timePoints.length-1]

    console.log("need to add a terminal")

    this.timePoints.push({
      x: this.width
      , y: lastTimePoint.y
      , temp: lastTimePoint.temp
      , time: new Date(this.width).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
  }

  //console.log(timePoints); //.map(function(p) { return p.x; }))

  this.svg.append("path")
      .datum(this.timePoints)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", this.line);


  var tbl = d3.select("table tbody");
  //console.log(tbl)

  // Clear any existing table rows:
  tbl.selectAll("tr")
      .data([])
      .exit()
      .remove();

  // Render table rows:
  var rows = tbl.selectAll("tr")
      .data(this.timePoints)
      .enter()
      .append("tr");


  // create a cell in each row for each column
  var cells = rows.selectAll("td")
      .data(function(row) {
        return [row.time, row.temp];
      })
      .enter()
      .append("td")
      .html(function(d) { return d; });

} // updateRendered()



  ngOnInit() {








      // Begin the SVG:
      this.svg = d3.select("svg");

      this.margin = {top: 20, right: 20, bottom: 40, left: 20};

      this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
      this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;

      var g = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


      var circleAttrs = {
          cx: function (d: any) {
              return this.xScale(d.x);
          },
          cy: function (d: any) {
              return this.yScale(d.y);
          },
          r: 6
      };

      var startDate = new Date();
      startDate.setHours(0, 0, 0);
      var endDate = new Date();
      endDate.setHours(23, 59, 0);

      var xScale = d3.scaleTime()
          .domain([startDate, endDate])
          .range([0, this.width]);

      //xScale.ticks(d3.timeMinute.every(10));


      var yScale = d3.scaleLinear()
          .domain([0, 40])
          .range([this.height, 0]);

      g.append("g")
          .attr("transform", "translate(0," + this.height + ")")
          .attr("class", "grid")
          .call(
              d3.axisBottom(xScale)
                  .ticks(d3.timeMinute.every(30))
                  .tickSize(-this.height)
          )
          .selectAll("text")
          .attr("y", 0)
          .attr("x", -5)
          .attr("dy", ".35em")
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "end")
          .style("display", function (d, i) {
              return i % 2 === 0 ? "none" : "inherit"
          })

      g.append("g")
          .call(
              d3.axisLeft(yScale)
              //.ticks(d3.timeMinute.every(30))
                  .tickSize(-this.width)
          )
          .attr("class", "grid")
          .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("Celcius");

      var _this = this;

      // Let's track the mouse position!:
      this.svg.on(
          "mousemove"
          , function () {

              var rawCoords = d3.mouse(this);

              // Normally we go from data to pixels, but here we're doing pixels to data
              var newPoint = {
                  x: Math.round(xScale.invert(rawCoords[0] - _this.margin.left)),
                  y: Math.round(yScale.invert(rawCoords[1] - _this.margin.top))
              }
                  , timeString = new Date(newPoint.x).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});


              var currentMouseTemp = newPoint.y;
              var currentMouseTime = timeString;


              if (rawCoords[0] <= _this.margin.left || rawCoords[0] >= _this.margin.left + _this.width) {
                  currentMouseTemp = '';
                  currentMouseTime = '';
              }

              if (rawCoords[1] <= _this.margin.top || rawCoords[1] >= _this.margin.top + _this.height) {
                  currentMouseTemp = '';
                  currentMouseTime = '';
              }
              //console.log(currentMouseTemp, timeString)

          }


      // On Click, we want to add data to the array and chart
      this.svg.on("click", function () {

          var coords = d3.mouse(this);

          // Make sure we don't draw any points outside of the graph area:
          if (coords[0] <= _this.margin.left || coords[0] >= _this.margin.left + _this.width) {
              return;
          }

          if (coords[1] <= _this.margin.top || coords[1] >= _this.margin.top + _this.height) {
              return;
          }

          // Normally we go from data to pixels, but here we're doing pixels to data
          var newPoint = {
              x: Math.round(xScale.invert(coords[0] - _this.margin.left)),
              y: Math.round(yScale.invert(coords[1] - _this.margin.top))
          }
              , timeString = new Date(newPoint.x).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});


          // We need to remove the first and last synthetic points before adding our new point:
          _this.timePoints.pop()
          _this.timePoints.splice(0, 1);

          _this.timePoints.push({
              x: coords[0]
              , y: coords[1]
              , temp: newPoint.y
              , time: timeString

          })


          _this.updateRendered();

      })
  )
  }
  /*

    function timePointClick(thisPoint) {
      //console.log(thisPoint);
      console.log(timePoints);

      timePoints = timePoints.filter(function(p) {

        return !(p.x === thisPoint.x && p.y === thisPoint.y);

      });

      //console.log(timePoints);

      updateRendered();
      d3.event.stopPropagation();
    }

  //}
*/

}

