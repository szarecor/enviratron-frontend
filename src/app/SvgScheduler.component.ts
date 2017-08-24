/**
 * Created by szarecor on 6/8/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {ChamberDataService} from './data.service';
import {CurrentSelectionStateValidator} from "./CurrentSelectionStateValidator.service";
import {EnvironmentalVariableTimePoint} from './chamber.interface';
import {isUndefined} from "util";
import {rendererTypeName} from "@angular/compiler";
//import {start} from "repl";

declare var d3: any;

@Component({
  selector: 'svg-scheduler',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './svg_scheduler_template.html'
})


export class SvgSchedulerComponent {
  //@Input() dayCount: number = 0;

  private logging:boolean = false;
  @Input() selectedDays: number[] = [];
  //private dataService: ChamberDataService;
  //validationService: CurrentSelectionStateValidator;

  validationState: any;


  experimentDaysArray: any[];

  consistencyState:any = {status:true};

  days: any[] = [];

  svg: any; //d3.select('svg');

  margin: any = {top: 20, right: 20, bottom: 40, left: 20};
  width: number;
  height: number;
  timePoints: any[] = [];

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
  rawCoords: any[] = [0,0];


  hoursMargin:number = 4;


  schedule : any[] = [];

  // Emit an event for the parent to handle when there is a change on the days <select> list:
  //@Output() onDaysChange: EventEmitter<any> = new EventEmitter<any>();
  //@Output() onTimePointsChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onNewTimePoint: EventEmitter<any> = new EventEmitter<any>();


  chambers: number[] = [];
  environment: string; //BehaviorSubject<string> = new BehaviorSubject("");

  line: any = d3.line()
  .x(function (d: any) {
    return d.x_position;
  })
  .y(function (d: any) {
    return d.y_position;
  })
  .curve(d3.curveLinear);


  constructor(private dataService: ChamberDataService, private validationService: CurrentSelectionStateValidator) {

    let _this = this;


    this.validationService.getState().subscribe(function(validationState) {
      _this.validationState = validationState;
      if (_this.logging) console.log("\nSVG COMPONENT RECEIVING NEW VALIDATION STATE FROM SERVICE")
      if (_this.logging) console.log(validationState);
    });

  }


  ngOnInit() {


    let _this = this;


    // We want to call this once and not subscribe:
    //this.schedule = this.dataService.getSchedule()

    this.dataService.getEnvironment().subscribe(function (env) {

      // TODO: what's the best way to NOT run clearUi onInit?
      let currentEnvironment = _this.environment

      _this.environment = env;


      _this.initSvg(env)

      if (currentEnvironment) {
        _this.clearUi();
      }
      _this.loadData();

      if (_this.validationState.isValid) {

        if (_this.logging) console.log("RECEIVING NEW ENV, CALLING updateRendered()")
        _this.updateRendered();
      }

    })


    this.dataService.getSelectedChambers().subscribe(function(chambers) {

      if (_this.logging) console.log("SVG COMPONENT RECEIVING NEW GROWTH CHAMBERS", chambers);

      _this.chambers = chambers;
      _this.loadData();

      if (_this.logging) console.log("RECEIVING NEW CHAMBERS, CALLING updateRendered()");

      if (_this.validationState.isValid) {
        _this.updateRendered();
      } else {
        _this.clearUi();
      }

    });


    this.dataService.getSchedule().subscribe(function (schedule: any[]) {
      if (_this.logging) console.log("svg comp receiving schedule from dataService", schedule)
      _this.schedule = schedule;

      _this.loadData();
      _this.updateRendered();

    })


    this.dataService.getDays().subscribe(function (days) {


      if (_this.logging) console.log("getDays subscription called", days)

      let previousDaysSelection = _this.days;
      _this.days = days;
      _this.loadData();

      if (_this.logging) console.log(_this.schedule)
      //_this.consistencyState = _this.checkCurrentStateConsistency();
      if (_this.logging) console.log("ARE WE OK?", _this.consistencyState);
      if (_this.consistencyState.status === true) {
        _this.updateRendered();
      } else {

        if (_this.logging) console.log(_this.consistencyState);
        if (_this.logging) console.log("###############################")

        _this.clearUi();
      }
    })

    //_this.loadData()
    _this.initSvg(_this.environment);

  } // END ngOnInit()




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

    if (this.logging) console.log("SVG updateRendered() CALLED")
    if (this.logging) console.log("WHAT IS CHAMBERS?", this.chambers)

    // Make sure the timepoints are properly sorted time-wise:

    this.timePoints.sort(function(a, b) {

      if (a.day === b.day) {
        if (a.minutes === b.minutes) {
          return 0;
        } else {

          return a.minutes > b.minutes ? 1 : -1;
        }

      } else {

        return a.day > b.day ? 1 : -1;

      }
    });
    this.svg.selectAll("path").data([]).exit().remove();
    this.svg.selectAll("circle").data([]).exit().remove();

    // Sort the timepoints by time before rendering:

    //this.timePoints = this.schedule;
    //console.log("in updateRendered, what is schedule?", this.schedule);

    // We need to filter here?


    /*
    this.timePoints = this.schedule.filter(function(dp) {

      if (this.days.indexOf(dp.day) === -1) {
        return false;
      }

      if (this.environment !== dp.environment) {
        return false;
      }

      if (this.chambers.indexOf(dp.chamber) === -1) {
        return false;
      }

      return true;

    }, this);

    */

    // We have filtered schedule, but it still might have redundant points in it
    // for example, two points identical except for the chamber or day
//    this.timePoints.sort(function (a, b) {
/*
      let mins1 = (a.day * 24 * 60) + a.minutes,
          mins2 = (b.day * 24 * 60) + b.minutes;

      console.log(a.day, a.minutes, mins1);
      console.log(b.day, b.minutes, mins2);
      console.log("-------------------------")
      */

/*
      if (a.day === b.day) {

        return a.minutes > b.minutes ? 1 : -1

      } else {
        return a.day > b.day ? 1 : -1;

      }
      */


      //return (a.day - b.day || a.minutes - b.minutes); // ? 1 : -1;

      /*
      if (a.day < b.day) {
        return 1;
      } else if (a.day >= b.day) {
        return (a.minutes > b.minutes) ? 1 : -1;
      }

      return 0;
      */




      /*
      if (a === b) {
        return 0;
      } else {

        return a.x_position < b.x_position ? -1 : 1;
      }
*/
   // });


    //console.log("AFTER SORTING IN updateRendered():");
    //console.log(this.timePoints);

    if (this.timePoints.length === 0) {

      // Let's create synthetic start and end points, based on the previous day's values:
/*
      let previousDays = [];
      for (let i=1,l=this.days[0]; i<l; i++) {
        previousDays.push(i)
      }


      let previousDaysPoints = this.schedule.filter(function(dp) {

        if (previousDays.indexOf(dp.day) === -1) {
          return false;
        }

        if (this.environment !== dp.environment) {
          return false;
        }

        if (this.chambers.indexOf(dp.chamber) === -1) {
          return false;
        }
        return true;
      }, this);


      previousDaysPoints.sort(function(a, b) {

        if (a.day == b.day) {

          if (a.x_position === b.x_position) return 0;
          return a.x_position > b.x_position ? 1 : -1;

        } else {

          return a.day > b.day ? 1 : -1;

        }
      })


      if (previousDaysPoints.length === 0) return;

      */

      /*
      let tmpTimePoint = previousDaysPoints[previousDaysPoints.length-1];

      let leftTerminalPoint = JSON.parse(JSON.stringify(tmpTimePoint));
      leftTerminalPoint.minutes = 0;
      leftTerminalPoint.x_position = 30;

      let rightTerminalPoint = JSON.parse(JSON.stringify(tmpTimePoint));
      rightTerminalPoint.minutes = 1430;
      rightTerminalPoint.x_position = 746;

      this.timePoints = [leftTerminalPoint, rightTerminalPoint];

      this.dataService.addScheduleTimePoint(leftTerminalPoint);
      this.dataService.addScheduleTimePoint(rightTerminalPoint);;
	    */

    }


    this.svg.append("path")
    .datum(this.timePoints)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", this.line);

    // TODO: refactor this so that each line is it's own path instead of a single path
    // for all points

    /*
      .classed("not-today", function(tp) {
        console.log("WHAT IS TIMEPOINT?")
        console.log(tp)
        return tp.x_position < 0;
      })
*/

    var mySelection = this.svg.selectAll("circle")
    .data(
      this.timePoints,
      // tell d3 to bind to a property of the obj and not simply it's array pos:
      function (d: any, i: number) {
        //return d.time;
        return [d.day, d.minutes]
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
    .attr("data-value", function (d: any) {
      return d.value;
    })
    .attr("data-time", function (d: any) {
      return d.minutes;
    })
    .attr("data-day", function(d: any) {
      return d.day;

    })
    .classed("time-series-marker", true)
    .classed("not-today", function(d) {

      return _this.days.indexOf(d.day) === -1;

    })
    .on(
      "click",
      function (p: any) {
        _this.timePointClick(p);
      }
    );

    mySelection.exit().remove();

    // Here we are going to mod the points for yesterday's and tomorrow's datapoints:

    /*
    d3.selectAll('g.grid:nth-child(1) g.tick')
    .filter(function(d){ return d.getHours() === 0 && d.getMinutes() == 0;} )
    .select('line') //grab the tick line
    //.attr('class', 'quadrantBorder') //style with a custom class and CSS
    //.style('stroke', "green");
    .style('stroke-width', 2)
    .style('stroke', '#999');
    */




  } // updateRendered()


  getPreviousDayDataPoints() {



    let previousDay = this.days[0]-1;

    let dataPoints = [];

    //console.log("WHAT IS PREVIOUS DAY?", previousDay);

    let previousDayData = this.schedule.filter(function(dp) {

      if (dp.environment !== this.environment) return false;

      if (dp.day !== previousDay) return false;

      if (this.chambers.indexOf(dp.chamber) === -1) return false;

      return true;

    }, this).map(function(dp) {

      return JSON.parse(JSON.stringify(dp));
    });
    //console.log("WHAT IS PREVIOUS DAYS DATA?")
    //console.log(previousDayData);

    if (!isNaN(previousDay) && !isUndefined(previousDayData) && previousDayData.length > 0) {

      previousDayData.forEach(function(dp) {
        let tmpDate = new Date()

        // Roll back one day:
        tmpDate.setHours(tmpDate.getHours() - 24);
        // Roll forward to the correct hour:
        tmpDate.setHours(dp.minutes/60);
        // And roll forward to the minute:
        tmpDate.setMinutes(dp.minutes % 60);

        dp.x_position = this.xScale(tmpDate);


        //if (dp.x_position >= 0) {
          //dataPoints.splice(0, 0, dp);
          // Here we are going to check/filter for redudant datapoints from diff chambers:

          let redundancyCheck = dataPoints.filter(function(dp2) {

            if (dp2.minutes === dp.minutes) return true;

            return false;

          })

          if (redundancyCheck.length === 0) dataPoints.push(dp);

        //}



      }, this);

    } // if previousDay and previousDayData

    return dataPoints;
  }

  getFollowingDayDataPoints() {


    let _this = this;

    // Now we need to do for the following day what we just did for the previous day:

    let followingDay = this.days[this.days.length-1] + 1;
    let followingDayData = this.schedule.filter(function(dp) {
      if (dp.environment !== this.environment) return false;

      if (dp.day !== followingDay) return false;

      if (this.chambers.indexOf(dp.chamber) === -1) return false;

      return true;

    }, this);

    // WE need to bin the following day's data by chamber and make sure each chamber is identical before rendering,
    // otherwise it's confusing and inaccurate.
    let chamberwiseData = {}



    followingDayData.forEach(function(dp) {
      let strChamberId = dp.chamber.toString();

      if (!Object.keys(chamberwiseData).includes(strChamberId)) chamberwiseData[strChamberId] = [];


      let clone = JSON.parse(JSON.stringify(dp));

      chamberwiseData[strChamberId].push(clone);
    })


    // Now make sure each array in the chamberwiseData is properly sorted:

    let chamberKeys = Object.keys(chamberwiseData);


    chamberKeys.forEach(function(key) {

      let arr = chamberwiseData[key];

      arr.sort(function(a, b) {
        // arr should be limited to a single day, chamber and environment, so we only need to address minutes:
        if (a.minutes === b.minutes) return 0;

        return a.minutes > b.minutes ? 1 : -1;

      })

      // Now that we're sorted, let's calc a new x position:

      arr.forEach(function(dp) {
        let tmpDate = new Date()
        tmpDate.setHours(tmpDate.getHours() + 24);
        // Roll forward to the correct hour:
        tmpDate.setHours(dp.minutes/60);
        // And roll forward to the minute:
        tmpDate.setMinutes(dp.minutes % 60);

        dp.x_position = _this.xScale(tmpDate)

      })

    })



    if (chamberKeys.length === 1) {
      // We can proceed without checking consistency across chambers b/c only a single chamber is selected;


      return chamberwiseData[chamberKeys[0]][0];
      /*
      chamberwiseData[chamberKeys[0]].forEach(function(dp) {


        dataPoints.push(dp);

      })
      */

    } else if (chamberKeys.length > 1) {

      // If we have multiple chambers, we need to check if their data is consistent:
      let mismatch = false;

      for (let i=0, l = chamberKeys.length-1; i<l; i++) {

        let j = i + 1;

        let key1 = chamberKeys[i], key2 = chamberKeys[j];
        let arr1 = chamberwiseData[key1], arr2 = chamberwiseData[key2];



        if (arr1.length !== arr2.length) {
          mismatch = true;
          break;

        } else {

          for (let ii=0, ll=arr1.length; ii<ll; ii++) {

            if (arr1[ii].value !== arr2[ii].value) {

              mismatch = true;
              break;
            }

          }

        }

      } // for chamberKeys.length

      if (mismatch === false) {

        let singleChamberData = chamberwiseData[chamberKeys[0]];
        return singleChamberData;

      }
    }

  }


  loadData() {
    // This method contains the logic of what to render at the moment from the larger schedule array
    // based on chamber selection, environmental variable and days

    let _this = this;


    // Take all of the schedule dataPoints from the data service and filter it down to only the datapoints
    // relevant to the current selection of chambers, environmental variable and days:

    let dataPoints = this.schedule.filter(function(dp) {

      if (_this.chambers.indexOf(dp.chamber) === -1) {
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
    if (_this.chambers.length > 1) {


      // chambers is already sorted for us:
      // Simply defaulting to the lowest growth chamber ID doesn't work b/c that chamber might not have data...
      let firstChamberId = _this.chambers[0];
      let filteredDataPoints = []


      for (var i=0,l=_this.chambers.length; i<l; i++) {

        filteredDataPoints = dataPoints.filter(function(dp) {
          return dp.chamber === _this.chambers[i];
        })

        // TODO: I'm not sure about this logic....
        if (filteredDataPoints.length > 0) {
          dataPoints = filteredDataPoints;
          break;
        }
      }

    }

    // We also want to show the trailing data from the day before and leading data for the day after
    // However, we are only going to do that if the data for the day in question is consistent across days and chambers
    // Otherwise, it is confusing.
    //console.log("WHAT ARE THE DATAPOINTS?")
    //console.log(dataPoints)



    let nextDayData = this.getFollowingDayDataPoints();

    console.log("WHAT IS NEXT DAY DATA?");
    console.log(nextDayData)

    if (!isUndefined(nextDayData)) {

      dataPoints = dataPoints.concat(nextDayData);
      //dataPoints.push(nextDayData);
    }

    let previousDayData = this.getPreviousDayDataPoints();
    dataPoints = dataPoints.concat(previousDayData);


/*

    if (!isNaN(previousDay) && !isUndefined(previousDayData) && previousDayData.length > 0) {

      // At this point we have an array of data for the previous day, but we need to pull it apart by chamber and see if
      // it's different on a chamber-wise basis.
      let previousDayDataByChamber = {};

      previousDayData.forEach(function (dp, i) {

        // When using a number (chamber) as a object key, it's getting automagically converted to a string and
        // causing issues with the includes() method, so let's go ahead and explicitly work with strings:
        let chamberIdStr: string = dp.chamber.toString();

        if (!Object.keys(previousDayDataByChamber).includes(chamberIdStr)) previousDayDataByChamber[chamberIdStr] = [];

        previousDayDataByChamber[chamberIdStr].push(dp);
      });

      // Now we need to sort each array in our object and pare each array down to the last element:
      for (let ky of this.chambers) {


        if (!isUndefined(previousDayDataByChamber[ky])) {

          previousDayDataByChamber[ky].sort(function (a, b) {
            return a.minutes - b.minutes;
          })
        }

      }

      // Now pare down to one element:
      for (let ky of Object.keys(previousDayDataByChamber)) {
        let tmpArr = previousDayDataByChamber[ky]



        let dp = tmpArr[tmpArr.length-1];
        // We need to adjust the x_position property to reflect it's from the previous day:

        let tmpDate = new Date()

        tmpDate.setHours(tmpDate.getHours() - 24);

        tmpDate.setHours(dp.minutes/60);
        tmpDate.setMinutes(dp.minutes % 60);


        console.log("WHAT IS ADJUSTED DATE?", tmpDate, _this.xScale(tmpDate));


        let tmpVal = (24*60) - dp.minutes;

        console.log(dp);

        console.log('WHAT IS ADJUSTED MINUTES?', tmpVal, _this.xScale(tmpVal))


        dp.x_position = _this.xScale(tmpDate);

        console.log("WHAT IS X?????", _this.xScale(dp.value));
        console.log("WHAT IS X?????", _this.xScale(0));
        console.log("WHAT IS X?????", _this.xScale(100));

        previousDayDataByChamber[ky] = dp;
      }

      console.log("AND GROUPED BY CHAMBER:");
      console.log(previousDayDataByChamber);

      // Now, finally, we can do a simple equality check across the chambers:
      let kys = Object.keys(previousDayDataByChamber);
      let dataIsConsistent = true;

      for (let i=0,l=kys.length; i<l-1; i++) {
        let j = i+1;

        let dp1 = previousDayDataByChamber[kys[i]]
          , dp2 = previousDayDataByChamber[kys[i+1]];


        if (dp1.minutes !== dp2.minutes || dp1.value !== dp2.value) {
          dataIsConsistent = false;
          break;
        }

      }

      if (dataIsConsistent) {

        console.log("splicing");
        console.log(dataPoints);

        //dataPoints.splice(0, 0, previousDayDataByChamber[kys[0]]);

        console.log(dataPoints);
      }


      console.log("IS CONSISTENT?", dataIsConsistent);
    } // END IF THERE IS DATA FOR THE PREVIOUS DAY

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
    startDate.setHours(-_this.hoursMargin, 0, 0);
    var endDate = new Date();
    //endDate.setHours(23, 59, 0);
    endDate.setHours(24+_this.hoursMargin, 0, 0);

      _this.xScale = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, this.width]);

      //console.log("WHAT IS TICKS?")
      //console.log(d3.scaleTime().domain([startDate, endDate]).ticks())


      let tday = new Date().getDay();



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
        .tickFormat(d3.timeFormat("%I %p"))
    )

    .selectAll("text")
    .attr("y", 0)
    .attr("x", -5)
    .attr("dy", ".35em")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "end")
    .style("display", function (d: any, i: any) {
      return i % 2 === 0 ? "none" : "inherit";
    })
    .style("fill", function(d:any) {
      return d.getDay() === tday ? "#000" : "#ccc";

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
    .attr("dy", "0.71em");

    /*

    .style("fill", "green")
    .attr("text-anchor", "end")
    .text("Celcius");
*/


    // Here we are going to mod the vertical gridlines to make the leading and trailing day regions more subdued:
      d3.selectAll('g.grid:nth-child(1) g.tick')
      .filter(function(d){ return d.getHours() === 0 && d.getMinutes() == 0;} )
      .select('line') //grab the tick line
      //.attr('class', 'quadrantBorder') //style with a custom class and CSS
      //.style('stroke', "green");
      .style('stroke-width', 2)
      .style('stroke', '#999');


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

    let rawCoords = d3.mouse(elRef) || [0,0];
    let _this = this;

    // Normally we go from data to pixels, but here we're doing pixels to data
    var newPoint   = {
      x_position: Math.round(_this.xScale.invert(rawCoords[0] - _this.margin.left)),
      y_position: Math.round(_this.yScale.invert(rawCoords[1] - _this.margin.top))
    }
      , timeString = new Date(newPoint.x_position).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});


    let currentMouseVal = newPoint.y_position;
    var currentMouseTime = timeString;


    if (rawCoords[0] <= _this.margin.left || rawCoords[0] >= _this.margin.left + _this.width) {
      currentMouseVal = 0; //'';
      currentMouseTime = '';
    }

    if (rawCoords[1] <= _this.margin.top || rawCoords[1] >= _this.margin.top + _this.height) {
      currentMouseVal = 0; //'';
      currentMouseTime = '';
    }


    _this.currentTime = currentMouseTime;
    _this.currentValue = currentMouseVal;
    _this.rawCoords = rawCoords;

  }



  svgOnClick(elRef) {

    if (this.logging) console.log("svgOnClick() METHOD CALLED")

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
    var newPoint = {
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
      , day: null
    };

    if (_this.logging) console.log("what are we pushing?")
    if (_this.logging) console.log(newDataPoint)

    //_this.timePoints.push(newDataPoint)

    //this.onNewTimePoint.emit(newDataPoint);
    this.dataService.addScheduleTimePoint(newDataPoint);


    // Sort the timepoints on x_position-axis position:
    _this.timePoints.sort(function (a, b) {
      if (a === b) {
        return 0;
      } else {

        return a.minutes < b.minutes ? -1 : 1;
        //return a.x_position < b.x_position ? -1 : 1;
      }

    });

    // Here we want to see if this is the first time point created for the experiment and, if so, create terminal time points
    // for each day in the experiment
/*
    if (_this.timePoints.length === 1) {
      // This is the first time point created for the experiment, we have extra work to do
      let days:number = _this.dataService.getDayCount()
        , daysArr:number[] = [];

      for (let i=1; i<=days; i++) {
        daysArr.push(i)
      }
      let leadingTerminalTimePoint = this.getLeadingTerminalTimePoint(newDataPoint.y_position, newDataPoint.value);

      let trailingTerminalTimePoint = this.getTrailingTerminalTimePoint(newDataPoint.y_position, newDataPoint.value)

	    //this.dataService.addScheduleTimePoint(leadingTerminalTimePoint, daysArr);
      //this.dataService.addScheduleTimePoint(trailingTerminalTimePoint, daysArr);
    }
    */


    //_this.addTerminalTimePoints()

    //_this.updateRendered();
    //_this.timePointsChangeHandler();



  } // svgOnClick()


  getLeadingTerminalTimePoint(y:number, value:number) {
    var tmpDate = new Date(0)
    tmpDate.setHours(0);
    tmpDate.setMinutes(0);


     return {
        x_position: 135 //_this.margin.x_position
        , y_position: y //100 //this.timePoints[0].y_position
        , value: value //this.timePoints[0].value
        , environment: this.environment
        //, time: tmpDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        , minutes: 1 //(tmpDate.getHours() * 60) + tmpDate.getMinutes()
       , day: null
      };

  }

  getTrailingTerminalTimePoint(y:number, value:number) {
    var tmpDate = new Date(0)
    tmpDate.setHours(23);
    tmpDate.setMinutes(59);

    //let y = this.yScale(value)

    //console.log(this.xScale((tmpDate.getHours() * 60) + tmpDate.getMinutes()))

    return {
      x_position: 824 //this.width
      , y_position: y //lastTimePoint.y
      , value: value
      , environment: this.environment
      //, time: tmpDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      , minutes: (tmpDate.getHours() * 60) + tmpDate.getMinutes()
      , day: null
    };

  }


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

            if (this.chambers.indexOf(timePoint.chamber) === -1) {
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
