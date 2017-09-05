/**
 * Created by szarecor on 8/4/17.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {ChamberDataService} from './data.service';
import { Chamber } from './chamber.interface';
import { ValidationState } from './validationState.interface';
import {isUndefined} from "util";

@Injectable()
export class CurrentSelectionStateValidator {


  private state = new BehaviorSubject<ValidationState>({
    isValid: true,
    chambersValid: true,
    chamberData: [],
    chamberIds: [],
    daysValid: true,
    dayData: {}, //[],
    days: []
  });

  private environment:string;
  private chambers:number[] = [];
  private schedule:any[] = [];
  private days:number[] = [];

  private logging: boolean = false;

  constructor(private dataService: ChamberDataService) {

    if (this.logging) console.log("VALIDATION SERVICE");
    if (this.logging) console.log(this.dataService);

    // The data to watch:

    let _this = this;

    this.dataService.getEnvironment().subscribe(function (env) {
      _this.environment = env;
      if (_this.logging) console.log("VALIDATION SERVICE RECEIVED ENVIRONMENT", _this.environment);
      _this.checkCurrentStateConsistency();

    });


    this.dataService.getSelectedChambers().subscribe(function (chambers) {
      _this.chambers = chambers;
      //if (_this.logging)
        if (_this.logging) console.log("VALIDATION SERVICE RECEIVED CHAMBERS", _this.chambers);
      _this.checkCurrentStateConsistency();
    });


    this.dataService.getSchedule().subscribe(function(schedule: any[]) {
        _this.schedule = schedule;
	      if (_this.logging) console.log("VALIDATION SERVICE RECEIVED SCHEDULE", _this.schedule);
	      _this.checkCurrentStateConsistency();

    });


    this.dataService.getDays().subscribe(function (days) {
      _this.days = days;
      if (_this.logging) console.log("VALIDATION SERVICE RECEIVED DAYS", this.days);
      if (_this.logging) console.log(_this);
      _this.checkCurrentStateConsistency();

    });

    _this.checkCurrentStateConsistency();

  } // END constructor() METHOD


  getState() {


    return this.state.asObservable();

  }




  checkCurrentDaysSelectionConsistency() {
    let hasDaysMismatch:boolean = false

        // First let's filter on environment, chambers and days:
      , dataPoints = this.schedule.filter(function(dp) {

        if (dp.environment !== this.environment) return false;
        if (this.days.indexOf(dp.day) === -1) return false;
        if (this.chambers.indexOf(dp.chamber) === -1) return false;
        // Finally, we can return true if we've cleared the above conditions:
        return true;
      } , this);

      let dailyData:object = {};


      for (let day of this.days) {

        dailyData[day] = dataPoints.filter(function(dp) {
          return dp.day === day;

        });

      }

      let keys = Object.keys(dailyData);



      for (let i=0, l=keys.length-1; i<l; i++) {
        let nextI = i+1;

        let day1 = dailyData[keys[i]];
        let day2 = dailyData[keys[nextI]];

        if (day1.length !== day2.length) {

          hasDaysMismatch = true;
          break;

        }
      }

      /*




    for (let day of this.days) {

      console.log(day)
    }

    for (let i=0,l=this.days[this.days.length]; i<l; i++) {

        if (this.days.indexOf(i) === -1) {
          console.log(i, 'IS NOT IN this.days', this.days);
          daysArr[i] = false;
        } else {

          daysArr[i] = dataPoints.filter(function(dp) {
            return dp.day === i;

          });
        }
    }


    console.log('this.days:', this.days);
    console.log('DAYS ARRAY:', daysArr)
    console.log('DATA POINTS:', dataPoints)

    for (let i=0, l=daysArr.length; i<l; i++) {
      if (daysArr[i] === false) {
        // this is an unselected day, ignore it and move on
        continue;
      }

      // Get the next non-false array element:
      let nextIndex = i+1;

      while (daysArr[nextIndex] === false) {
        nextIndex++;
      }

      console.log("WHAT IS THE NEXT INDEX FOR", i, "?", nextIndex);
      console.log(daysArr[i], daysArr[nextIndex]);

      if (isUndefined(daysArr[i]) || isUndefined(daysArr[nextIndex])) {
        // One of the two days has no data, need to err
        console.log("UNDEFINED LEADS TO ERR", daysArr[i], daysArr[nextIndex], daysArr);
        hasDaysMismatch = true;
        break;
      }


      if (daysArr[i].length !== daysArr[nextIndex].length) {
        hasDaysMismatch = true;
        break;
      }
    }
    */


    //console.log("RETURNING", hasDaysMismatch, daysArr);
    return {
      mismatch: hasDaysMismatch
      , data: dailyData //daysArr
      , days: this.days
    };
  } // END METHOD checkCurrentDaysSelectionConsistency()



  checkCurrentStateConsistency() {
    /** This method checks if any select state (days, chambers, environmental variable)
     * includes heterogeneous data (days with different data, chambers with different data, etc)
     */

    if (this.logging) console.log("CHECKING STATE CONSISTENCY!!!!!");


    let hasDaysMismatch = false
      , hasChambersMismatch = false

        // First let's filter on environment, chambers and days:
      , dataPoints = this.schedule.filter(function(dp) {

        if (dp.environment !== this.environment) return false;
        if (this.days.indexOf(dp.day) === -1) return false;
        if (this.chambers.indexOf(dp.chamber) === -1) return false;
        // Finally, we can return true if we've cleared the above conditions:
        return true;
      }
      , this
    );

    if (this.logging) console.log("WHAT IS THE FILTERED ARRAY?")
    if (this.logging) console.log(dataPoints);

    if (dataPoints.length === 0) {
      // We can exit early because there is no data to validate
      this.state.next({
        isValid: true
        , daysValid: true
        , chambersValid: true
        , chamberData: []
        , chamberIds: []
        , dayData: {}
        , days: []
      });
      return;
    }


    // If there's no data for the current environment, we're OK:
    // TODO: Reconsider this, there is still work to do!!!!!!!
    // TODO: this is actually OK, because there is absolutely no data, not a single empty day or chamber...
    if (dataPoints.length === 0) {

      return {status:true};
    }


    // Now, let's compare across days. We will build a two dim array of the data with the first dim
    // being days and the 2nd dim being the datapoints for the relevant day.
    let dailyData:any[] = [];


    let daywiseCheck:any = this.checkCurrentDaysSelectionConsistency();
    hasDaysMismatch = daywiseCheck.mismatch;

    /*

    dailyData[0] = [];

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

        if (datapoint1.chamber !== datapoint2.chamber) return datapoint1.chamber > datapoint2.chamber ? 1 : -1;
        if (datapoint1.day !== datapoint2.day) return datapoint1.day > datapoint2.day ? 1 : -1;
        if (datapoint1.minutes !== datapoint2.minutes) return datapoint1.minutes > datapoint2.minutes ? 1 : -1;
        if (datapoint1.value !== datapoint2.value) return datapoint1.value > datapoint2.value ? 1 : -1;

        return 0;
      });

    }); // END SORTING dailyData


    if (this.logging) console.log("WHAT IS DAILY DATA?");
    if (this.logging) console.log(dailyData);

    // the zeroth element will be undefined b/c we don't have a chamber zero, so start at the first index:
    for (let i=1,l=dailyData.length-1; i<l; i++) {

      if (this.logging) console.log("LOOPING DAY", i, dailyData[i]);

      if (isUndefined(dailyData[i])) { // || isUndefined(dailyData[i+1])) {
        // This condition is caused by unassigned array indices (ie day1 is not selected...)
        if (this.logging) console.log("undefined days are selected, ignoring", i);
        //continue;
      }

      let nextSiblingIndex = i + 1;

      while (isUndefined(dailyData[nextSiblingIndex])) {
        nextSiblingIndex++;
      }

      // The simple equality check is to compare lengths
      if (isUndefined(dailyData[i]) ^ isUndefined(dailyData[nextSiblingIndex])) {


        if (this.logging) console.log("days mismatch found b/c one of these is empty:", dailyData[i], dailyData[nextSiblingIndex]);

        hasDaysMismatch = true;
      } else if (dailyData[i].length !== dailyData[nextSiblingIndex].length) {
        hasDaysMismatch = true;
      }
      // We have checked the number (array length) of datapoints across each day, but we still need to check
      // the actual values before assuming consistency.

      let day1 = dailyData[i]
        , day2 = dailyData[nextSiblingIndex];


      if (this.logging) console.log("WHAT DAYS ARE WE COMPARING?", day1, day2);

      if (!isUndefined(day1) && !isUndefined(day2)) {



      for (let j = 0, l2 = day1.length - 1; j < l2; j++) {

        if (this.logging) console.log("COMPARING", j, "TO", j + 1);

        if (isUndefined(day1[j])) {
          if (this.logging) console.log("DOES THIS EVER HAPPEN? WHAT DOES IT MEAN?")
          continue;
        }

        let dp1 = day1[j]
          , dp2 = day2[j];


        if (dp1.minutes !== dp2.minutes) {
          if (this.logging) console.log("returning false b/c minutes mismatch")
          hasDaysMismatch = true;
          break;
        }

        if (dp1.value !== dp2.value) {
          if (this.logging) console.log("returning false b/c values mismatch")
          hasDaysMismatch = true;
          break;
        }

        if (dp1.chamber !== dp2.chamber) {
          if (this.logging) console.log("returning b/c chamber mismatch");
          hasDaysMismatch = true;
          break;
        }
      } // for
    } // if

    } // END FOR LOOP OVER DAILY DATA:



    */

    // NOW WE WANT TO COMPARE THE DATAPOINTS WE HAVE ON A CHAMBER-WISE BASIS:
    let chamberData:any[] = [];

    // Here we setup the array, declaring an empty array for the 2nd dim for each currently selected chamber:
    this.chambers.forEach(function(chamberId) {

      chamberData[chamberId] = [];
    })

    dataPoints.forEach(function(dp) {
      let chamber = dp.chamber;
      chamberData[chamber].push(dp);

    });




    if (this.logging) console.log("WHAT IS THE LENGTH OF GROWTH CHAMBERS?", chamberData.length, chamberData);

    // Let's sort the chamber-wise data first by day and then by minute:
    chamberData.forEach(function(dataPoints, indx) {
      dataPoints.sort(function(datapoint1, datapoint2) {
        return datapoint1.day - datapoint2.day || datapoint1.minutes - datapoint2.minutes;
      });
    }); // END sorting chamber wise data

    if (this.logging) console.log("WHAT IS THE DATA CHAMBERWISE?");
    if (this.logging) console.log(chamberData, chamberData.length);

    /*
     this.chambers.forEach(function(id) {

     console.log('GROWTH CHAMBER', id);

     if (isUndefined(chamberData[id])) {
     // We have a chamber in the selection list that doesn't have any data
     console.log("CHAMBER", id, "HAS NO DATA!");
     }

     });
     */
    for (let k=1; k<chamberData.length-1; k++) {

      if (this.logging) console.log("")

      if (isUndefined(chamberData[k])) {

        while (k<chamberData.length-1 && isUndefined(chamberData[k])) {
          k++;
        }
      }

      let nextSiblingIndex = k+1
        , nextSibling = chamberData[nextSiblingIndex];

      if (isUndefined(nextSibling)) {

        if (this.logging) console.log("we have an undefined chamber", nextSibling, nextSiblingIndex)

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

        if (this.logging) console.log("we need to compare", dp1, "and", dp2);

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

    if (this.logging) console.log("what are the mismatches? chambers:", hasChambersMismatch, "and days?", hasDaysMismatch);

    //if (!hasChambersMismatch && !hasDaysMismatch) {
      //return {status:true};
   // }

    chamberData = chamberData.filter(function(chamber) {
      return !isUndefined(chamber);
    });

    if (this.logging) console.log("WHAT IS THE chamberData:");
    if (this.logging) console.log(chamberData);



    let chamberIds = chamberData.filter(function(chamberArray) {
      return chamberArray.length > 0;
    }).map(function(chamberArray) {
      return chamberArray[0].chamber;

    });


    /*
    let days = daywiseCheck.data.filter(function(d) {
    //let days = dailyData.filter(function(d) {
      return !isUndefined(d);
    }).map(function(d) {
      return d[0].day;
    })
     console.log("WHAT IS DAYS?", days)
    */


    this.state.next({
      isValid: !hasDaysMismatch && !hasChambersMismatch
      , daysValid: !hasDaysMismatch
      , chambersValid: !hasChambersMismatch
      , chamberData: chamberData.filter(function(chamber) { return chamber != undefined; })
      , chamberIds: chamberIds //chamberData.filter(function(chamber) { return chamber != undefined; }).map(function(dpArray) { return dpArray[0].chamber; })
      , dayData: daywiseCheck.data //dailyData
      , days: this.days
    });



  } // END checkCurrentStateConsistency() METHOD









}
