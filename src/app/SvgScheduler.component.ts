/**
 * Created by szarecor on 6/8/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {ChamberDataService} from './data.service';
import {EnvironmentalVariableTimePoint} from './chamber.interface';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {first} from "rxjs/operator/first";


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


  growthChamberIds: any[] = [];
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

    this.dataService.getCurrentEnvironmentalParameter().subscribe(function (env) {

      // TODO: what's the best way to NOT run clearUi onInit?
      let currentEnvironment = _this.environment

      _this.environment = env;


      _this.initSvg(env)

      if (currentEnvironment) {
        _this.clearUi();
      }
      _this.loadData()

    })


    this.dataService.getSelectedChambers().subscribe(function (chambers) {
      _this.growthChamberIds = chambers
      _this.loadData()

    });


    this.dataService.getSchedule().subscribe(function (schedule: any[]) {

      console.log("subscribed to", schedule)
      _this.schedule = schedule;


      _this.loadData()

    })


    this.dataService.getDays().subscribe(function (days) {


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



      _this.clearUi();
      _this.loadData();



    })

    //_this.loadData()
    _this.initSvg(_this.environment);

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

    this.addTerminalTimePoints();

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
    //.style("stroke", "steelblue")
    //.style("stroke-width", 2)
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
    console.log("loadData called")
    //console.log(this.timePoints)
    //console.log(this.environment)
    //console.log(this.chambers)
    //console.log(this.days)
    //console.log("---------------")

    let _this = this;

        //, days = this.days;

    let dataPoints = this.schedule.filter(function(dp) {

      if (_this.growthChamberIds.indexOf(dp.chamberId) === -1) {
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



      // Now use the first day to pull out the data:
      dataPoints = dataPoints.filter(function(dp) {
        return dp.day == filteredDays[0];
      }, this);

    }
    // Done filtering down to the data only for the first day


    // Now we need to do the same thing for chambers where there are multiple chambers selected that have separate time points:
    if (_this.growthChamberIds.length > 1) {

      console.log("WE ARE DEFAULTING TO THE LOWEST GC ID!!!")

      // growthChamberIds is already sorted for us:
      // Simply defaulting to the lowest growth chamber ID doesn't work b/c that chamber might not have data...
      let firstChamberId = _this.growthChamberIds[0];
      let filteredDataPoints = []


      for (var i=0,l=_this.growthChamberIds.length; i<l; i++) {

        filteredDataPoints = dataPoints.filter(function(dp) {
          return dp.chamberId === _this.growthChamberIds[i];
        })

        if (filteredDataPoints.length > 0) {
          dataPoints = filteredDataPoints;
          console.log("BREAKING ON GC", _this.growthChamberIds[i]);
          break;
        }
      }



    }

    // If we have no data for the day(s) at hand, we want to look at previous days and extend
    // the last value we have through the day(s) at hand
    if (dataPoints.length === 0 && this.schedule.length > 0) {
      let day = this.days[0];
      console.log(day)



      while (day > 1) {

        day--;

        console.log(this.environment)

        // Let's see if we have any data:
        let previousDaysData = this.schedule.filter(function(timePoint) {

          // Exclude any data related to a different environmental variable:
          if (timePoint.type !== _this.environment) { return false; }

          // Exclude anything for a different chamber,
          // because we generate a separate timePoint for each chamber when adding points and multiple chambers are
          // selected, it's pretty straighforward to compare the this.growthChamberIds array to the single chamberId
          // of each timePoint in the schedule
          if (this.growthChamberIds.indexOf(timePoint.chamberId) === -1) {
            return false;
          }

          // is this for the day @ hand?
          return timePoint.day === day;

        }, this)

        if (previousDaysData.length !== 0) {

          let previousDataPoint = previousDaysData[previousDaysData.length-1]
          console.log(previousDataPoint)

          let startPoint = JSON.parse(JSON.stringify(previousDataPoint))
          let endPoint = JSON.parse(JSON.stringify(previousDataPoint))

          startPoint.day = this.days[0]
          startPoint.timePoint = 0;
          startPoint.x = 0;

          endPoint.day = this.days[0]
          dataPoints = [startPoint, endPoint]
          break;




        }



      }


    }



    this.timePoints = dataPoints;

    if (dataPoints.length > 0) {

      this.updateRendered()
    } else {
      this.clearUi()

    }

  }






    initSvg(envParam : string) {
	    // this function handles the initial rendering and bootstrapping of the the D3 SVG

      let yDomain;

      console.log(envParam)

      // What is our current scale for the y-axis?
      switch(envParam) {

        case 'Lighting':
          yDomain = [0, 10];
          break;
        case 'Temperature':
          yDomain = [0, 40];
          break;

        default:
		      yDomain = [0, 100];
      }



      console.log(yDomain)


    d3.selectAll("svg > *").remove();

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
    startDate.setHours(-1, 0, 0);
    var endDate = new Date();
    //endDate.setHours(23, 59, 0);
    endDate.setHours(25, 0, 0);

      _this.xScale = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, this.width]);

    //xScale.ticks(d3.timeMinute.every(10));
      _this.yScale = d3.scaleLinear()
    .domain(yDomain)
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
    //.attr("fill", "#000")
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

    var coords = d3.mouse(elRef);

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
      //, timeString = new Date(newPoint.x).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})

      , tmpDate = new Date(newPoint.x)
      , grossMinutes: number = (tmpDate.getHours() * 60) + tmpDate.getMinutes();


    let tday = new Date();

    if (tday.getDay() !== tmpDate.getDay()) {
      return;
    }

    // We need to remove the first and last synthetic points before adding our new point:
    _this.timePoints.pop()
    _this.timePoints.splice(0, 1);


    console.log("onclick, what is newPoint?", newPoint, "and gross minutes?", grossMinutes)

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




    _this.addTerminalTimePoints()


    _this.updateRendered();
    _this.timePointsChangeHandler();
  } // svgOnClick()


  addTerminalTimePoints() {

    // Now make sure that the entire 24 hours are covered:
    // Create a point for 12:01 AM:
    if (this.timePoints[0].x > 0) {

      console.log("what's the first timePoint?", this.days[0])
      let previousDay = this.days[0] - 1;

      if (previousDay >= 1) {

        // see what we have for the previous day:
        var previousDaysData = this.schedule.filter(function (timePoint) {

            console.log(timePoint, previousDay, this)


            if (timePoint.day !== previousDay) {
              console.log("returning false b/c", timePoint.day, "!=", previousDay);
              return false;
            }

            if (this.growthChamberIds.indexOf(timePoint.chamberId) === -1) {
              console.log("returning false b/c", timePoint.chamberId, "is not in", this.growthChamberIds)
              return false;
            }

            if (timePoint.type !== this.environment) {
              console.log("return false b/c", timePoint.type, "not equal to", this.environment);
              return false;
            }

            return true;


          }
          , this)
      } else {
        var previousDaysData = [];

      }

      console.log("what is previousDaysData?", previousDaysData)

      if (previousDaysData.length !== 0) {
        var newY = previousDaysData[previousDaysData.length-1].y;
        var newVal = previousDaysData[previousDaysData.length-1].value;

        console.log("")
        console.log("GOING TO USE TERMINAL FROM PREVIOUS DAY!")
        console.log("")

      } else {
        var newVal = this.timePoints[0].value;
        var newY = this.timePoints[0].y;

      }



      var tmpDate = new Date(0)
      tmpDate.setHours(0);
      tmpDate.setMinutes(0);

      this.timePoints.splice(
        0,
        0,
        {
          x: 49 //_this.margin.x
          , y: newY //this.timePoints[0].y
          , value: newVal //this.timePoints[0].value
          , type: this.environment
          //, time: tmpDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          , time: 1 //(tmpDate.getHours() * 60) + tmpDate.getMinutes()
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


  }


}
