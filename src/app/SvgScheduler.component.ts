/**
 * Created by szarecor on 6/8/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {ChamberDataService} from './data.service';
import {EnvironmentalVariableTimePoint} from './chamber.interface';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {first} from "rxjs/operator/first";
import {isUndefined} from "util";

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

  consistencyState:any = {status:true};

  days: any[] = [];

  svg: any; //d3.select('svg');

  margin: any = {top: 20, right: 20, bottom: 40, left: 20};
  width: number;
  height: number;
  timePoints: any[] = [];
/*
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
  */

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
  //@Output() onTimePointsChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onNewTimePoint: EventEmitter<any> = new EventEmitter<any>();


  growthChamberIds: any[] = [];
  environment: string; //BehaviorSubject<string> = new BehaviorSubject("");

  line: any = d3.line()
  .x(function (d: any) {
    return d.x_position;
  })
  .y(function (d: any) {
    return d.y_position;
  })
  .curve(d3.curveLinear);


  constructor(private ds: ChamberDataService) {
    this.dataService = ds;

  }


  ngOnInit() {


    let _this = this;


    // We want to call this once and not subscribe:
    //this.schedule = this.dataService.getSchedule()

    this.dataService.getCurrentEnvironmentalParameter().subscribe(function (env) {

      // TODO: what's the best way to NOT run clearUi onInit?
      let currentEnvironment = _this.environment

      _this.environment = env;


      _this.initSvg(env)

      if (currentEnvironment) {
        _this.clearUi();
      }
      _this.loadData();
      console.log("RECEIVING NEW ENV, CALLING updateRendered()")
      _this.updateRendered();

    })


    this.dataService.getSelectedChambers().subscribe(function (chambers) {
      _this.growthChamberIds = chambers;
      _this.loadData();
      console.log("RECEIVING NEW CHAMBERS, CALLING updateRendered()");
      //console.log(_this.checkCurrentChamberStateConsistency());

      _this.consistencyState = _this.checkCurrentStateConsistency();
      console.log("ARE WE OK?", _this.consistencyState);

      if (_this.consistencyState.status === true) {
        _this.updateRendered();
      } else {

        console.log(_this.consistencyState);
        console.log("###############################")

        _this.clearUi();
      }

    });


    this.dataService.getSchedule().subscribe(function (schedule: any[]) {
      console.log("svg comp receiving schedule from dataService", schedule)
      _this.schedule = schedule;

      _this.loadData();
      _this.updateRendered();

    })


    this.dataService.getDays().subscribe(function (days) {


      console.log("getDays subscription called", days)

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



      //_this.clearUi();
      _this.loadData();

      console.log(_this.schedule)
      _this.consistencyState = _this.checkCurrentStateConsistency();
      console.log("ARE WE OK?", _this.consistencyState);
      if (_this.consistencyState.status === true) {
        _this.updateRendered();
      } else {

        console.log(_this.consistencyState);
        console.log("###############################")

        _this.clearUi();
      }



    })

    //_this.loadData()
    _this.initSvg(_this.environment);

  } // END ngOnInit()


  checkCurrentStateConsistency() {
    /** This method checks if any select state (days, chambers, environmental variable)
     * includes heterogeneous data (days with different data, chambers with different data, etc)
     */
    let hasDaysMismatch = false
      , hasChambersMismatch = false

	    // First let's filter on environment, chambers and days:
      , dataPoints = this.schedule.filter(function(dp) {

	      if (dp.environment !== this.environment) return false;
	      if (this.days.indexOf(dp.day) === -1) return false;
	      if (this.growthChamberIds.indexOf(dp.chamber) === -1) return false;
	      // Finally, we can return true if we've cleared the above conditions:
	      return true;
	    }
    , this
    );

    console.log("WHAT IS THE FILTERED ARRAY?")
    console.log(dataPoints);

    // If there's no data for the current environment, we're OK:
    // TODO: Reconsider this, there is still work to do!!!!!!!
    // TODO: this is actually OK, because there is absolutely no data, not a single empty day or chamber...
    if (dataPoints.length === 0) {

      return {status:true};
    }

    // Now, let's compare across days. We will build a two dim array of the data with the first dim
    // being days and the 2nd dim being the datapoints for the relevant day.
    let dailyData:any[] = [];

    dataPoints.forEach(function(dp) {
      let day = dp.day;

      if (isUndefined(dailyData[day])) {
        dailyData[day] = [];
      }
      dailyData[day].push(dp);

    });

    // Now, let's sort each 2nd dim:
    dailyData.forEach(function(dataPoints, indx) {

      dataPoints.sort(function(datapoint1, datapoint2) {
        return datapoint1.minutes === datapoint2.minutes ? 0 : datapoint1.minutes > datapoint2.minutes;
      });

    }); // END SORTING dailyData

    // the zeroth element will be undefined b/c we don't have a chamber zero, so start at the first index:
    for (let i=1,l=dailyData.length-1; i<l; i++) {


      if (isUndefined(dailyData[i])) { // || isUndefined(dailyData[i+1])) {
        // This condition is caused by unassigned array indices (ie day1 is not selected...)
        console.log("undefined days are selected!");
        continue;
      }

      let nextSiblingIndex = i+1;

      while (isUndefined(dailyData[nextSiblingIndex])) {
        nextSiblingIndex++;
      }

      // The simple equality check is to compare lengths
      if (dailyData[i].length !== dailyData[nextSiblingIndex].length) {
        hasDaysMismatch = true;
      }
      // We have checked the number (array length) of datapoints across each day, but we still need to check
      // the actual values before assuming consistency.

      let day1 = dailyData[i]
        , day2 = dailyData[nextSiblingIndex];

      for (let j=0,l2=day1.length-1; j<l2; j++) {

        console.log("COMPARING", j, "TO", j+1);

        if (isUndefined(day1[j])) {
          console.log("DOES THIS EVER HAPPEN? WHAT DOES IT MEAN?")
          continue;
        }

        let dp1 = day1[j]
          , dp2 = day2[j];


        if (dp1.minutes !== dp2.minutes) {
          console.log("returning false b/c minutes mismatch")
          hasDaysMismatch = true;
          break;
        }

        if (dp1.value !== dp2.value) {
          console.log("returning false b/c values mismatch")
          hasDaysMismatch = true;
          break;
        }

        if (dp1.chamber !== dp2.chamber) {
          console.log("returning b/c chamber mismatch");
          hasDaysMismatch = true;
          break;
        }
      }

    } // END FOR LOOP OVER DAILY DATA:

    // NOW WE WANT TO COMPARE THE DATAPOINTS WE HAVE ON A CHAMBER-WISE BASIS:
    let chamberData:any[] = [];

    // Here we setup the array, declaring an empty array for the 2nd dim for each currently selected chamber:
    this.growthChamberIds.forEach(function(chamberId) {

      chamberData[chamberId] = [];
    })

    dataPoints.forEach(function(dp) {
      let chamber = dp.chamber;
      chamberData[chamber].push(dp);

    });

    console.log("WHAT IS THE LENGTH OF GROWTH CHAMBERS?", chamberData.length, chamberData);

    // Let's sort the chamber-wise data first by day and then by minute:
    chamberData.forEach(function(dataPoints, indx) {
      dataPoints.sort(function(datapoint1, datapoint2) {

        if (datapoint1.day !== datapoint2.day) {
          return datapoint1.day > datapoint2.day;

        }

        return datapoint1.minutes === datapoint2.minutes ? 0 : datapoint1.minutes > datapoint2.minutes;
        /*
          if (a.minutes === b.minutes) {
            return 0;
          } else {
            return a.minutes > b.minutes;
          }

        }
*/
      });

    }); // END sorting chamber wise data


    console.log("WHAT IS THE DATA CHAMBERWISE?");
    console.log(chamberData, chamberData.length);

/*
    this.growthChamberIds.forEach(function(id) {

      console.log('GROWTH CHAMBER', id);

      if (isUndefined(chamberData[id])) {
        // We have a chamber in the selection list that doesn't have any data
        console.log("CHAMBER", id, "HAS NO DATA!");
      }

    });
    */
    for (let k=1; k<chamberData.length-1; k++) {

      console.log("")

      if (isUndefined(chamberData[k])) {

        while (k<chamberData.length-1 && isUndefined(chamberData[k])) {
          k++;
        }
      }

      let nextSiblingIndex = k+1
        , nextSibling = chamberData[nextSiblingIndex];

      if (isUndefined(nextSibling)) {

        console.log("we have an undefined chamber", nextSibling, nextSiblingIndex)

        while (nextSiblingIndex < chamberData.length-1 && isUndefined(nextSibling)) {
          nextSiblingIndex+=1;
          nextSibling = chamberData[nextSiblingIndex];
        }
      }

      if (isUndefined(nextSibling)) break;

      // Do a simple length check between the two candidates:
      let chamber = chamberData[k];

      if (chamber.length !== nextSibling.length) {
        hasChambersMismatch = true;
        break;
      }

      // The datapoints for the chambers might have the same length, but do they hold the same data?:
      for (let j=0, dpLength=chamber.length; j<dpLength; j++) {

        let dp1 = chamber[j]
          , dp2 = nextSibling[j];

        console.log("we need to compare", dp1, "and", dp2);

        if (dp1.value !== dp2.value) {
          hasChambersMismatch = true;
          break;
        }

        if (dp1.minutes !== dp2.minutes) {
          hasChambersMismatch = true;
          break;
        }

      } // foreach dataPoint

    }

    if (!hasChambersMismatch && !hasDaysMismatch) {
      return {status:true};
    }

    return {
      status:false
      , dayWiseState: !hasDaysMismatch
      , chamberWiseState: !hasChambersMismatch
      , chamberWiseData: chamberData
      , dayWiseData: dailyData
    }


  } // END checkCurrentStateConsistency() METHOD

/*
  checkCurrentChamberStateConsistency() {
    //console.log("What is gcs?", this.growthChamberIds);

    if (this.growthChamberIds.length === 1) {
      return {status: true, dataPoints: null};
    }


    // We are going to create a two-dim array of timePoints
    // the first dim will be chamber IDs and the 2nd dim will be the datapoints for the relevant chamber
    let groupedTimePoints:any[] = [];

    this.growthChamberIds.forEach(function(chamberId) {
      groupedTimePoints[chamberId] = this.schedule.filter(function(dp) {
        return dp.chamber === chamberId;

      });

    }, this)

    //console.log("WHAT IS groupedTimePoints?", groupedTimePoints);
    // If the two arrays have the same length, we still need to compare the actual data:
    groupedTimePoints.forEach(function(chamberData) {

      console.log(chamberData);
    })

    // the zeroth element will be undefined b/c we don't have a chamber zero, so start at the first index:
    for (let i=1,l=groupedTimePoints.length-1; i<l; i++) {
      if (isUndefined(groupedTimePoints[i]) || isUndefined(groupedTimePoints[i+1])) {
        continue;
      }

      // The simple equality check is to compare lengths
      if (groupedTimePoints[i].length !== groupedTimePoints[i+1].length) {
        return {status:false, dataPoints:groupedTimePoints}
      }



    }
    return {status: true, dataPoints: null};


  } // END checkCurrentChamberStateConsistency() method
*/

  //timePointsChangeHandler() {

    //this.onTimePointsChange.emit(this.timePoints);
//  }


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
    //this.timePoints.pop()
    //this.timePoints.splice(0, 1);


    this.dataService.removeScheduleTimePoint(thisPoint)


    this.timePoints = this.timePoints.filter(function (p) {
      return !(p.x_position === thisPoint.x_position && p.y_position === thisPoint.y_position);
    });

    //this.addTerminalTimePoints();

    this.updateRendered();
    //this.timePointsChangeHandler();

    d3.event.stopPropagation();
  }


  updateRendered() {

    this.svg.selectAll("path").data([]).exit().remove();
    this.svg.selectAll("circle").data([]).exit().remove();

    // Sort the timepoints by time before rendering:

    //this.timePoints = this.schedule;
    //console.log("in updateRendered, what is schedule?", this.schedule);

    // We need to filter here?
    this.timePoints = this.schedule.filter(function(dp) {

      if (this.days.indexOf(dp.day) === -1) {
        return false;
      }

      if (this.environment !== dp.environment) {
        return false;
      }

      if (this.growthChamberIds.indexOf(dp.chamber) === -1) {
        return false;
      }

      return true;

    }, this);

    // We have filtered schedule, but it still might have redundant points in it
    // for example, two points identical except for the chamber or day



    if (this.timePoints.length === 0) {
      return;
    }


    this.timePoints.sort(function (a, b) {
      if (a === b) {
        return 0;
      } else {
        return a.x_position < b.x_position ? -1 : 1;
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
        //return d.time;
        return d.minutes
      }
    );

    var _this: any = this;

    mySelection
    .enter()
    .append("circle")
    .attr("cx", function (d: any) {
      return d.x_position;
    })
    .attr("cy", function (d: any) {
      return d.y_position;
    })
    .attr("r", 5)
    //.style("stroke", "steelblue")
    //.style("stroke-width", 2)
    .attr("data-celcius", function (d: any) {
      return d.value;
    })
    .attr("data-time", function (d: any) {
      return d.minutes;
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
    //console.log('environment:', this.environment)
    //console.log('growthChamberIds:', this.growthChamberIds)
    //console.log('days:', this.days)
    //console.log(this.schedule);
    //console.log("---------------")

    let _this = this;

        //, days = this.days;


    // Take all of the schedule dataPoints from the data service and filter it down to only the datapoints
    // relevant to the current selection of chambers, environmental variable and days:

    let dataPoints = this.schedule.filter(function(dp) {

      if (_this.growthChamberIds.indexOf(dp.chamber) === -1) {
        return false;
      }

      if (this.days.indexOf(dp.day) === -1) {

        return false;
      }

      if (dp.environment !== this.environment) {

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


      // growthChamberIds is already sorted for us:
      // Simply defaulting to the lowest growth chamber ID doesn't work b/c that chamber might not have data...
      let firstChamberId = _this.growthChamberIds[0];
      let filteredDataPoints = []


      for (var i=0,l=_this.growthChamberIds.length; i<l; i++) {

        filteredDataPoints = dataPoints.filter(function(dp) {
          return dp.chamber === _this.growthChamberIds[i];
        })

        if (filteredDataPoints.length > 0) {
          dataPoints = filteredDataPoints;
          break;
        }
      }

    }

    // If we have no data for the day(s) at hand, we want to look at previous days and extend
    // the last value we have through the day(s) at hand

    /*
    if (dataPoints.length === 0 && this.schedule.length > 0) {
      let day = this.days[0];


      while (day > 1) {

        day--;

        // Let's see if we have any data:
        let previousDaysData = this.schedule.filter(function(timePoint) {

          // Exclude any data related to a different environmental variable:
          if (timePoint.environment !== _this.environment) { return false; }

          // Exclude anything for a different chamber,
          // because we generate a separate timePoint for each chamber when adding points and multiple chambers are
          // selected, it's pretty straighforward to compare the this.growthChamberIds array to the single chamberId
          // of each timePoint in the schedule
          if (this.growthChamberIds.indexOf(timePoint.chamber) === -1) {
            return false;
          }

          // is this for the day @ hand?
          return timePoint.day === day;

        }, this)

        if (previousDaysData.length !== 0) {

          let previousDataPoint = previousDaysData[previousDaysData.length-1]

          let startPoint = JSON.parse(JSON.stringify(previousDataPoint))
          let endPoint = JSON.parse(JSON.stringify(previousDataPoint))

          startPoint.day = this.days[0]
          startPoint.timePoint = 0;
          startPoint.x_position = 0;

          endPoint.day = this.days[0]
          dataPoints = [startPoint, endPoint]
          break;

        }
      }
    }

    */

    this.timePoints = dataPoints;

    if (dataPoints.length > 0) {

      //this.updateRendered()
    } else {
      this.clearUi()

    }

  } // end loadData() method






    initSvg(envParam : string) {
	    // this function handles the initial rendering and bootstrapping of the the D3 SVG

      let yDomain;

      // What is our current scale for the y_position-axis?
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


    d3.selectAll("svg > *").remove();

    // Begin the SVG:
    let _this = this;
      this.svg = d3.select("svg");
      this.margin = {top: 20, right: 20, bottom: 40, left: 20};
      this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
      this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;


    let g = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


    let circleAttrs = {
      cx: function (d: any) {
        return this.xScale(d.x_position);
      },
      cy: function (d: any) {
        return this.yScale(d.y_position);
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
      //this.updateRendered();

    }
  } // end renderSvg() method


  svgOnMouseMove(elRef) {

    var rawCoords = d3.mouse(elRef);
    let _this = this;

    // Normally we go from data to pixels, but here we're doing pixels to data
    var newPoint   = {
      x_position: Math.round(_this.xScale.invert(rawCoords[0] - _this.margin.left)),
      y_position: Math.round(_this.yScale.invert(rawCoords[1] - _this.margin.top))
    }
      , timeString = new Date(newPoint.x_position).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});


    var currentMouseTemp = newPoint.y_position;
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
      x_position: Math.round(_this.xScale.invert(coords[0] - _this.margin.left)),
      y_position: Math.round(_this.yScale.invert(coords[1] - _this.margin.top))
    }
      //, timeString = new Date(newPoint.x_position).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})

      , tmpDate = new Date(newPoint.x_position)
      , grossMinutes: number = (tmpDate.getHours() * 60) + tmpDate.getMinutes();


    let tday = new Date();

    if (tday.getDay() !== tmpDate.getDay()) {
      return;
    }

    // We need to remove the first and last synthetic points before adding our new point:
    //_this.timePoints.pop()
    //_this.timePoints.splice(0, 1);


    let newDataPoint = {
      x_position: coords[0]
      , y_position: coords[1]
      , value: newPoint.y_position
      , minutes: grossMinutes //timeString

    };


    console.log("what are we pushing?")
    console.log(newDataPoint)

    //_this.timePoints.push(newDataPoint)

    //this.onNewTimePoint.emit(newDataPoint);
    this.dataService.addScheduleTimePoint(newDataPoint);


    // Sort the timepoints on x_position-axis position:
    _this.timePoints.sort(function (a, b) {
      if (a === b) {
        return 0;
      } else {
        return a.x_position < b.x_position ? -1 : 1;
      }

    });




    //_this.addTerminalTimePoints()

    //_this.updateRendered();
    //_this.timePointsChangeHandler();



  } // svgOnClick()


  addTerminalTimePoints() {

    // Now make sure that the entire 24 hours are covered:
    // Create a point for 12:01 AM:
    if (this.timePoints[0].x_position > 0) {

      let previousDay = this.days[0] - 1;

      if (previousDay >= 1) {

        // see what we have for the previous day:
        var previousDaysData = this.schedule.filter(function (timePoint) {



            if (timePoint.day !== previousDay) {
              return false;
            }

            if (this.growthChamberIds.indexOf(timePoint.chamber) === -1) {
              return false;
            }

            if (timePoint.environment !== this.environment) {
              return false;
            }

            return true;


          }
          , this)
      } else {
        var previousDaysData = [];

      }


      if (previousDaysData.length !== 0) {
        var newY = previousDaysData[previousDaysData.length-1].y_position;
        var newVal = previousDaysData[previousDaysData.length-1].value;


      } else {
        var newVal = this.timePoints[0].value;
        var newY = this.timePoints[0].y_position;

      }



      var tmpDate = new Date(0)
      tmpDate.setHours(0);
      tmpDate.setMinutes(0);

      this.timePoints.splice(
        0,
        0,
        {
          x: 49 //_this.margin.x_position
          , y: newY //this.timePoints[0].y_position
          , value: newVal //this.timePoints[0].value
          , environment: this.environment
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
        , environment: this.environment
        //, time: tmpDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        , time: (tmpDate.getHours() * 60) + tmpDate.getMinutes()

      });
    }


  }


}
