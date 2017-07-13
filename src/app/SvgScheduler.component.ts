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


  growthChambers: any[] = [];
  growthChambers2: any[] = [];
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
    this.dataService = ds;

  }


  ngOnInit() {


    let _this = this;

    //console.log(this.timePoints)

    //console.log("ngOnInit() called")

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


    this.dataService.getSelectedChambers().subscribe(function (chambers) {

      //alert("what do we do here to combine data across chambers?")

      console.log(chambers);

      _this.growthChambers = chambers


      /*
      window.setTimeout(function() {

        _this.growthChambers = chambers.map(c => c).filter(c => c.isChecked);
        console.log("timeout complete"

      )}, 100);
	    */



      /*
      _this.growthChambers = chambers.filter(function (chamber) {
        console.log(chamber.isChecked);
        // TODO: why is the chamber state always one-click behind?
        //console.log(chamber, chamber.isChecked);
        return chamber.isChecked != true;
      });
*/
      console.log(_this.growthChambers);
      console.log("####################")



      _this.loadData()

    });


    this.dataService.getSchedule().subscribe(function (schedule: any[]) {
      _this.schedule = schedule;


      _this.loadData()

    })


    this.dataService.getDays().subscribe(function (days) {

      console.log("Svg component received new days", days)
      console.log(_this.schedule);

      let previousDaysSelection = _this.days;
      _this.days = days;

      if (previousDaysSelection.length === 0) {
        return;

      }

      previousDaysSelection = previousDaysSelection.sort(function (d1: number, d2: number) {

        if (d1 === d2) {
          return 0;
        }
        return d1 < d2 ? -1 : 1;

      })


      //console.log(_this.timePoints);

      _this.clearUi();
      _this.loadData();



    })

    //_this.loadData()
    _this.initSvg();

  } // end ngOnInit()


  timePointsChangeHandler() {

    this.onTimePointsChange.emit(this.timePoints);
  }


  // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
  //selectedDaysChangeHandler(selectedDays: string[]) {
  //  this.onDaysChange.emit(selectedDays);
  //}


  clearUi() {
    // Used when switching environment parameter (ie from Humidity to Lighting)
    var s = d3.selectAll('circle');
    s.remove();

    s = d3.selectAll('path');
    s.remove();

    this.timePoints = [];

  }


  timePointClick(thisPoint: any) {

    // We need to remove the first and last synthetic points before adding our new point:
    this.timePoints.pop()
    this.timePoints.splice(0, 1);



    this.timePoints = this.timePoints.filter(function (p) {
      return !(p.x === thisPoint.x && p.y === thisPoint.y);
    });

    d3.event.stopPropagation();
    this.updateRendered();
    this.timePointsChangeHandler();

  }


  updateRendered() {

    this.svg.selectAll("path").data([]).exit().remove();
    this.svg.selectAll("circle").data([]).exit().remove();

    // Sort the timepoints by time before rendering:



    this.timePoints.sort(function (a, b) {
      if (a === b) {
        return 0;
      } else {
        return a.x < b.x ? -1 : 1;
      }

    });


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
        _this.timePointClick(p);
      }
    );

    mySelection.exit().remove();


  } // updateRendered()


  loadData() {
    // This method contains the logic of what to render at the moment from the larger schedule array
    // based on chamber selection, environmental variable and days


    //console.log("---------------")
    //console.log("loadData called")
    //console.log(this.timePoints)
    //console.log(this.environment)
    //console.log(this.chambers)
    //console.log(this.days)

    //console.log("---------------")

    let _this = this;

    let chamberIds = _this.growthChambers.filter(chamber => chamber.isChecked == true ).map(function(chamber) { return chamber.id; })

    console.log("AND WHAT IS CHAMBERIDS?", chamberIds)
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


    //console.log("filtered data is")
    //console.log(dataPoints)


    if (dataPoints.length > 0) {


      this.timePoints = dataPoints;
      this.updateRendered()
    }

  }






    initSvg() {
    // this function handles the initial rendering and bootstrapping of the the D3 SVG

    // Begin the SVG:
    let _this = this;
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

    _this.xScale = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, this.width]);

    //xScale.ticks(d3.timeMinute.every(10));
      _this.yScale = d3.scaleLinear()
    .domain([0, 40])
    .range([this.height, 0]);

    g.append("g")
    .attr("transform", "translate(0," + this.height + ")")
    .attr("class", "grid")
    .call(
      d3.axisBottom(_this.xScale)
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
      d3.axisLeft(_this.yScale)
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
      "mousemove",
      function () {
        _this.svgOnMouseMove(this);
      }
    );



    // On Click, we want to add data to the array and chart
    this.svg.on(
      "click",
      function () {
        _this.svgOnClick(this);
      });



    //console.log(_this.timePoints);

    if (this.timePoints.length > 0) {
      this.updateRendered();

    }
  } // end renderSvg() method


  svgOnMouseMove(elRef) {

    var rawCoords = d3.mouse(elRef);
    let _this = this;

    // Normally we go from data to pixels, but here we're doing pixels to data
    var newPoint   = {
      x: Math.round(_this.xScale.invert(rawCoords[0] - _this.margin.left)),
      y: Math.round(_this.yScale.invert(rawCoords[1] - _this.margin.top))
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



  svgOnClick(elRef) {

    let _this = this;

    console.log("svg click recorded?")
    console.log(elRef)

    var coords = d3.mouse(elRef);
    console.log(coords)

    // Make sure we don't draw any points outside of the graph area:
    if (coords[0] <= _this.margin.left || coords[0] >= _this.margin.left + _this.width) {
      return;
    }

    if (coords[1] <= _this.margin.top || coords[1] >= _this.margin.top + _this.height) {
      return;
    }

    // Normally we go from data to pixels, but here we're doing pixels to data
    var newPoint             = {
      x: Math.round(_this.xScale.invert(coords[0] - _this.margin.left)),
      y: Math.round(_this.yScale.invert(coords[1] - _this.margin.top))
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
  }


}
