/**
 * Created by szarecor on 6/8/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {ChamberDataService} from './data.service';
import {EnvironmentalVariableTimePoint} from './chamber.interface';
import {BehaviorSubject} from "rxjs/BehaviorSubject";


declare var d3: any;

@Component({
  selector: 'svg-scheduler',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './svg_scheduler_template.html'
})


export class SvgSchedulerComponent {
  //@Input() dayCount: number = 0;

  @Input() selectedDays: number[] = [];
  dataService: any;
  experimentDaysArray: any[];


  days: any[] = [];

  svg: any; //d3.select('svg');

  margin: any = {top: 20, right: 20, bottom: 40, left: 20};
  width: number;
  height: number;
  timePoints: any[] = [

    {
      time: 316,
      value: 32,
      x: 187,
      y: 68
    },
    {
      time: 711,
      value: 30,
      x: 396,
      y: 80
    },

    {
      time: 1054,
      value: 17,
      x: 577,
      y: 160
    }

  ];

	circleAttrs: any = {

    cx: function (d: any) {
      return this.xScale(d.x);
    },
    cy: function (d: any) {
      return this.yScale(d.y);
    },
    r: 6
  };

  //startDate: any = new Date();
  //endDate: any = new Date();
  xScale: any;
  yScale: any;

  currentValue : number;
  currentTime : any;

  schedule : any[] = [];

  // Emit an event for the parent to handle when there is a change on the days <select> list:
  //@Output() onDaysChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onTimePointsChange: EventEmitter<any> = new EventEmitter<any>();


  chambers: any[] = [];
  environment: string; //BehaviorSubject<string> = new BehaviorSubject("");

  line: any = d3.line()
  .x(function (d: any) {
    return d.x;
  })
  .y(function (d: any) {
    return d.y;
  })
  .curve(d3.curveLinear);


  constructor(private ds: ChamberDataService) {

    let _this = this;

    this.dataService = ds;





  }

  timePointsChangeHandler() {

    console.log("emitting", this.timePoints)
    this.onTimePointsChange.emit(this.timePoints);
  }


  // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
  //selectedDaysChangeHandler(selectedDays: string[]) {
  //  this.onDaysChange.emit(selectedDays);
  //}


  clearUi() {
    // Used when switching environment parameter (ie from Humidity to Lighting)
    console.log("clearUi called")
    var s = d3.selectAll('circle');
    s.remove();

    s = d3.selectAll('path');
    s.remove();

    this.timePoints = [];

  }


  timePointClick(thisPoint: any) {

    console.log(thisPoint);
    // We need to remove the first and last synthetic points before adding our new point:
    this.timePoints.pop()
    this.timePoints.splice(0, 1);


    console.log(this)
    console.log(this.timePoints.length)

    this.timePoints = this.timePoints.filter(function (p) {
      return !(p.x === thisPoint.x && p.y === thisPoint.y);
    });




    console.log(this.timePoints.length)

    d3.event.stopPropagation();
    this.updateRendered();
    this.timePointsChangeHandler();

  }


  updateRendered() {

    console.log("updateRendered called", this.timePoints.length)


    this.svg.selectAll("path").data([]).exit().remove();
    this.svg.selectAll("circle").data([]).exit().remove();

    // Sort the timepoints by time before rendering:


    console.log(this.timePoints)

    this.timePoints.sort(function (a, b) {
      if (a === b) {
        return 0;
      } else {
        return a.x < b.x ? -1 : 1;
      }

    });

    console.log(this.timePoints);

    // Now make sure that the entire 24 hours are covered:
    // Create a point for 12:01 AM:
    if (this.timePoints[0].x > 0) {

      var tmpDate = new Date(0)
      tmpDate.setHours(0);
      tmpDate.setMinutes(0);

      this.timePoints.splice(
        0,
        0,
        {
          x: 0
          , y: this.timePoints[0].y
          , value: this.timePoints[0].value
          , type: this.environment
          //, time: tmpDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          , time: (tmpDate.getHours() * 60) + tmpDate.getMinutes()
        }
      )
    }

    // And create a point to cover to the right end (midnight):
    //if (this.timePoints[this.timePoints.length - 1].time !== '12:00 AM') {
    if (this.timePoints[this.timePoints.length - 1].time !== 1439) {

      var lastTimePoint = this.timePoints[this.timePoints.length - 1]

      var tmpDate = new Date(0)
      tmpDate.setHours(23);
      tmpDate.setMinutes(59);

      this.timePoints.push({
        x: this.width
        , y: lastTimePoint.y
        , value: lastTimePoint.value
        , type: this.environment
        //, time: tmpDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        , time: (tmpDate.getHours() * 60) + tmpDate.getMinutes()

      });
    }


    this.svg.append("path")
    .datum(this.timePoints)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", this.line);



    var mySelection = this.svg.selectAll("circle")
    .data(
      this.timePoints,
      // tell d3 to bind to a property of the obj and not simply it's array pos:
      function (d: any, i: number) {
        return d.time;
      }
    );

    var _this: any = this;

    mySelection
    .enter()
    .append("circle")
    .attr("cx", function (d: any) {
      return d.x;
    })
    .attr("cy", function (d: any) {
      return d.y;
    })
    .attr("r", 5)
    .style("stroke", "steelblue")
    .style("stroke-width", 2)
    .attr("data-celcius", function (d: any) {
      return d.temp;
    })
    .attr("data-time", function (d: any) {
      return d.time;
    })
    .classed("time-series-marker", true)
    .on(
      "click",
      function (p: any) {
        console.log("time point click should be called")
        _this.timePointClick(p);
      }
    );

    mySelection.exit().remove();
/*
    var tbl = d3.select("table tbody");

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
    .data(function (row: any) {
      return [row.time, row.temp];
    })
    .enter()
    .append("td")
    .html(function (d: any) {
      return d;
    });

    */

  } // updateRendered()


  loadData() {
    // This method contains the logic of what to render at the moment from the larger schedule array
    // based on chamber selection, environmental variable and days


    //console.log("---------------")
    console.log("loadData called")
    console.log(this.timePoints)
    //console.log(this.environment)
    //console.log(this.chambers)
    //console.log(this.days)

    //console.log("---------------")


    let chamberIds = this.chambers.map(function(chamber) { return chamber.id; })
        //, days = this.days;

    let dataPoints = this.schedule.filter(function(dp) {

      if (chamberIds.indexOf(dp.chamberId) === -1) {
        return false;
      }

      if (this.days.indexOf(dp.day) === -1) {

        return false;
      }

      if (dp.type !== this.environment) {

        return false;
      }

      return true;
    }, this)

    // At this point we have a problem if two or more days are selected that contain separate time points...
    if (this.days.length > 1) {
      // Let's determine what the first day in the data is:
      let filteredDays = dataPoints.map(function(dp) { return parseInt(dp.day); }).filter((v, i, a) => a.indexOf(v) === i).sort(function(a, b) {
        if (a === b) {
          return 0;
        }

        return a < b ? -1 : 1;
      });


      //console.log("what is filteredDays?", filteredDays);

      // Now use the first day to pull out the data:
      dataPoints = dataPoints.filter(function(dp) {
        return dp.day == filteredDays[0];
      }, this);




    }


    console.log("filtered data is")
    console.log(dataPoints)


    if (dataPoints.length > 0) {


      this.timePoints = dataPoints;
      this.updateRendered()
    }

  }





  ngOnInit() {




    let _this = this;

    //console.log(this.timePoints)

    this.dataService.getCurrentEnvironmentalParameter().subscribe(function (env) {

      // TODO: what's the best way to NOT run clearUi onInit?
      let currentEnvironment = _this.environment

      //console.log("receiving new env", env)
      _this.environment = env;


      if (currentEnvironment) {
        _this.clearUi();
      }

      _this.loadData()

    })


    this.dataService.getChambers().subscribe(function (chambers) {

      //alert("what do we do here to combine data across chambers?")

      _this.chambers = chambers.filter(function (chamber) {

        // TODO: why is the chamber state always one-click behind?
        //console.log(chamber, chamber.isChecked);
        return chamber.isChecked == true;
      });

      _this.loadData()

    });


    this.dataService.getSchedule().subscribe(function(schedule : any[]) {
      _this.schedule = schedule;


      _this.loadData()

    })



    this.dataService.getSelectedDays().subscribe(function(days) {

      let previousDaysSelection = _this.days;
      _this.days = days;

      if (previousDaysSelection.length === 0) {
        return;

      }

      previousDaysSelection = previousDaysSelection.sort(function(d1 : number, d2 : number) {

        if (d1 === d2) {
          return 0;
        }
        return d1 < d2 ? -1 : 1;

      })





      //console.log(_this.timePoints);

      _this.clearUi();

      _this.loadData()

/*
      // Now we want to update the UI to extend the value from the previous day across the day(s) at hand:
      console.log(previousDaysSelection);
      console.log(_this.days);
      console.log(_this.schedule)

      let _days = _this.days.sort(function(d1 : number, d2 : number) {

        if (d1 === d2) {
          return 0;
        }
        return d1 < d2 ? -1 : 1;

      }) // sort()

      let firstSelectedDay = _days[0];

      let lastPreviousDay = previousDaysSelection.pop();


      console.log(firstSelectedDay, lastPreviousDay)

      let currentChamberIds = _this.chambers.map(function(chamber) { return chamber.id; })

      console.log(currentChamberIds);

      _this.schedule.forEach(function(tp) {

        console.log(tp.chamberId, currentChamberIds.indexOf(tp.chamberId) > -1);
      })

      // We need to filter the existing schedule based on chambers and environmental paramater:
      let relevantSchedule = _this.schedule.filter(function(tp) {

        if (tp.day !== lastPreviousDay) {
          console.log(tp.day, lastPreviousDay, tp.day === lastPreviousDay)
          return false;
        }


        if (currentChamberIds.indexOf(tp.chamberId) === -1) {
          return false;
        }

        if (tp.type != _this.environment) {
          return false;
        }


        return true;

      });




      console.log("RELEVANT SCHEDULE:");
      console.log(relevantSchedule);

      */


    })


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
    .style("display", function (d: any, i: any) {
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


    // Let's track the mouse position!:
    this.svg.on(
      "mousemove"
      , function () {

        var rawCoords = d3.mouse(this);

        // Normally we go from data to pixels, but here we're doing pixels to data
        var newPoint   = {
          x: Math.round(xScale.invert(rawCoords[0] - _this.margin.left)),
          y: Math.round(yScale.invert(rawCoords[1] - _this.margin.top))
        }
          , timeString = new Date(newPoint.x).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});


        var currentMouseTemp = newPoint.y;
        var currentMouseTime = timeString;


        if (rawCoords[0] <= _this.margin.left || rawCoords[0] >= _this.margin.left + _this.width) {
          currentMouseTemp = 0; //'';
          currentMouseTime = '';
        }

        if (rawCoords[1] <= _this.margin.top || rawCoords[1] >= _this.margin.top + _this.height) {
          currentMouseTemp = 0; //'';
          currentMouseTime = '';
        }


           _this.currentTime = currentMouseTime;
          _this.currentValue = currentMouseTemp;

      }
    );



    // On Click, we want to add data to the array and chart


    this.svg.on(
      "click",
      function () {

        console.log("svg click recorded?")

        var coords = d3.mouse(this);

        // Make sure we don't draw any points outside of the graph area:
        if (coords[0] <= _this.margin.left || coords[0] >= _this.margin.left + _this.width) {
          return;
        }

        if (coords[1] <= _this.margin.top || coords[1] >= _this.margin.top + _this.height) {
          return;
        }

        // Normally we go from data to pixels, but here we're doing pixels to data
        var newPoint             = {
          x: Math.round(xScale.invert(coords[0] - _this.margin.left)),
          y: Math.round(yScale.invert(coords[1] - _this.margin.top))
        }
          , timeString = new Date(newPoint.x).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})

          , tmpDate = new Date(newPoint.x)
          , grossMinutes: number = (tmpDate.getHours() * 60) + tmpDate.getMinutes();


        // We need to remove the first and last synthetic points before adding our new point:
        _this.timePoints.pop()
        _this.timePoints.splice(0, 1);

        _this.timePoints.push({
          x: coords[0]
          , y: coords[1]
          , value: newPoint.y
          , time: grossMinutes //timeString

        })

        // Sort the timepoints on x-axis position:
        _this.timePoints.sort(function (a, b) {
          if (a === b) {
            return 0;
          } else {
            return a.x < b.x ? -1 : 1;
          }

        });


        console.log("Before calling updateRendered")
        console.log(_this.timePoints[_this.timePoints.length-2])


        _this.updateRendered();
        _this.timePointsChangeHandler();

/*
        _this.addTimePoint({
          x: coords[0]
          , y: coords[1]
          , value: newPoint.y
          , time: grossMinutes //timeString

        });
        */

      });



    //console.log(_this.timePoints);

    if (this.timePoints.length > 0) {
      this.updateRendered();

    }
  } // end onInit() method

/*
  addTimePoint(newPoint: any) {



    let tmpDate = new Date(newPoint.x)
      , grossMinutes: number = (tmpDate.getHours() * 60) + tmpDate.getMinutes()
      , point = {
		        type: this.dataService.currentEnvironmentalParameter
            , timePoint: newPoint.time
            , minutes: grossMinutes
            //, chamberId: currentChamber
            , value: newPoint.value
      }
  }

 */

}
