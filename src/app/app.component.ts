import { Component, Input, Output, OnInit, ViewContainerRef} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ChamberDataService } from './data.service';
import {Observable} from "rxjs/Observable";
import { Chamber, EnvironmentalVariableTimePoint } from './chamber.interface';
import {CurrentSelectionStateValidator} from "./CurrentSelectionStateValidator.service";
import {logging} from "selenium-webdriver";
import {isUndefined} from "util";




@Component({
  selector: 'my-app',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './app_template.html'

})
export class AppComponent implements OnInit {

    private logging:boolean = false;
    private currentExperimentId: number;
    private currentTimePoints: EnvironmentalVariableTimePoint[] = [];
    private validationState: any;
	  // this is used to disable buttons while work is being done so there's no double clicking, etc:
    private isRectifyingInvalidState:boolean = false;

    private dayCount: number = 20;

    private currentDays : number[] = [];
    private completedDays : number[] = [];
    private chambers: any[] = [];
    private environment? : string;
    private schedule? : any[] = [];
    private experimentId:number;

    private defaultEnvironment = 'Lighting';

    constructor(private dataService: ChamberDataService, private validationService: CurrentSelectionStateValidator) {

      let _this = this;

      this.dataService.setDayCount(this.dayCount);

      this.dataService.getEnvironment().subscribe(function(env) {
        _this.environment = env;

      })

      this.dataService.getChambers().subscribe(function(chambers) {
        _this.chambers = chambers;

      })

      this.validationService.getState().subscribe(function(validationState) {
        _this.validationState = validationState;

        _this.validationState.dayKeys = Object.keys(validationState.dayData);

        if (_this.validationState.isValid === true) {

          _this.isRectifyingInvalidState = false;

        }

        if (_this.logging) console.log("WHAT IS VALIDATION STATE?");
        if (_this.logging) console.log(_this.validationState);
      });

    }

    ngOnInit(): void {

        // Here we are going to process any incoming url parameters to set the state:
        let queryStringPairs = location.search.substr(1).split("&").map(function(s) { return s.split("="); })
          , _this = this;

        if (this.logging) console.log("WHAT IS THE SEARCH INPUT?")
	      if (this.logging) console.log(queryStringPairs);


        // To allow for multiple chambers and days, we are going to collect the values
        // from the querystring in these arrays:
        let queryStringChambers = []
          , queryStringDays = [];

        queryStringPairs.forEach(function(paramPair) {

          var [k, v] = paramPair;

          if (k === 'experiment') {

            this.currentExperimentId = parseInt(paramPair[1]);
            this.dataService.setExperimentId(this.currentExperimentId);

          } else if (k === 'chamber') {

            queryStringChambers.push(parseInt(v));
            //this.dataService.setChambers(this.chambers);

          } else if (k === 'day') {

            queryStringDays.push(parseInt(v));

          } else if (k === 'environment') {

            this.dataService.setEnvironment(v);
          }
        }
        , this); // END queryStringPairs.forEach LOOP

        // Now apply the collected chamber data:
        if (queryStringChambers.length > 0) {
          this.chambers.forEach(function(chamber) {
            chamber.isChecked = queryStringChambers.indexOf(chamber.id) !== -1; // === parseInt(v);
          });

          this.dataService.setChambers(this.chambers);


        }
        // And apply the collection days data:
        if (queryStringDays.length > 0) {
          this.currentDays = queryStringDays;
          this.dataService.setSelectedDays(this.currentDays)
        }

        if (!this.environment) this.dataService.setEnvironment(this.defaultEnvironment);


        // TODO: this should get refactored generally to be less ugly:
        //this.dayCount = this.dataService.getDayCount();

        this.dataService.getDays().subscribe(function(days) {
          if (_this.logging) console.log("APP RECEIVING CURRENT DAYS FROM DATA SERVICE", days)
          _this.currentDays = days;
        });

        this.dataService.getSchedule().subscribe(function(schedule) {
          if (_this.logging) console.log("MAIN APP RECEIVING NEW SCHEDULE FROM dataService")
          _this.schedule = schedule;

        });
        this.experimentId = this.dataService.getExperimentId();
  }




  deselectDays() {
    this.dataService.setSelectedDays([]);
  }

  deselectChambers() {
      if (this.logging) console.log("deselectChambers() called")

      this.chambers.forEach(function(chamber) {
        chamber.isChecked = false;
      })
      this.dataService.setChambers(this.chambers);
      if (this.logging) console.log("WHAT IS VALIDATION STATE?")
      if (this.logging) console.log(this.validationState);
  }


  overwriteDayData(masterDayId:number) {

    this.isRectifyingInvalidState = true;

    if (this.logging) console.log("OVERWRITING DAILY DATA WITH", masterDayId);

    let daysToClear = this.validationState.days.filter(function(day) { return day !== masterDayId; })
      , _this = this;

    if (this.logging) console.log("WHAT DAYS ARE WE CLEARING?", daysToClear);


    this.dataService.deleteTimePointsByDays(daysToClear).subscribe(function(resp) {

      if (_this.logging) console.log("CLEARING DAYS RECEIVED RESPONSE")
      if (_this.logging) console.log(resp);

      // We have received a response from the deletion, now we can proceed and repopulate/overwrite the data:
      _this.dataService.cloneDayData(masterDayId, daysToClear);

    });

  } // END overwriteDayData() METHOD

  overwriteChamberData(masterChamberId) {
    /** this function rectifies chamber-wise data.
     * When two or more chambers with differing data are selected, this function can be used to
     * delete the data for one or more chambers and replace it with the data from another (the masterChamberId)
     * this operation is done while observing the other variables (current environment, current days, etc)
     */

    // TODO: it would be a vast improvement to filter out any chambers that are already a duplicate of the
    // master chamber before calling the backend to delete and replace

      this.isRectifyingInvalidState = true;

      let _this = this

      , chambersToClear = this.chambers.filter(function(chamber) {
        return chamber.id !== masterChamberId && chamber.isChecked === true;
      }).map(function(chamber) {
        return chamber.id;
      });

      if (this.logging) console.log("WHAT CHAMBERS ARE WE CLEARING?", chambersToClear);

          _this.dataService.deleteTimePointsByChamber(chambersToClear).subscribe(function (resp) {

            if (_this.logging) console.log("AND HERE WE ARE IN APP, WHAT IS RESP?")
            if (_this.logging) console.log(resp);
            // We've cleared the existing data for the chambers in question, let's repopulate those chambers
            // with data from the chamber we want to clone:
            //this.dataService.cloneChamberData(masterChamberId, chambersToClear);
            _this.dataService.cloneChamberData(masterChamberId, chambersToClear);
          })
    }


  handleNewTimePoint(newPoint: any) {
      if (this.logging) console.log("NEW POINT")
      if (this.logging) console.log(newPoint);
  }

    handleTimePointsChange(newState: any[]) {
      // This gets called via an @Output param event emitter on the <svg-scheduler> component:
      // We need to pull values out of our Observables:



      let currentEnv: string = this.environment
        , currentChambers: Chamber[] = this.chambers.filter(function(chamber) {
              return chamber.isChecked;
          })


        , currentChamberIds : any[] = currentChambers.map(function(chamber) {
          return chamber.id;
      })


      if (currentChamberIds.length === 0 || this.currentDays.length === 0 || currentEnv == '') {
        return;
      }



	    /*
      let newStateDays = newState.map(function(dp) {

        return dp.day;

      }).filter((v, i, a) => a.indexOf(v) === i);
      */


      // We need to filter out anything from currentTimePoints that is covered by the current chamber, day, variable state:
      this.currentTimePoints = this.currentTimePoints.filter(function(tp) {


        if (currentChamberIds.indexOf(tp.chamberId) > -1 && this.currentDays.indexOf(tp.day) > -1 && tp.environment == this.environment) {

          return false;
        }

         return true;

      }, this);





      let _this = this;

      newState.forEach(function(timePoint) {

        var currentDay: number, currentChamber: number;

        // We want to insert a timePoint for each chamber and day when chambers or days are being edited in bulk:


        for (let i=0, l=_this.currentDays.length; i<l; i++) {


          for (let j=0,l2=currentChamberIds.length; j<l2; j++) {


            let currentDay = _this.currentDays[i];
            let currentChamberId : number = currentChamberIds[j];


            this.currentTimePoints.push({
              environment: currentEnv
              , minutes: timePoint.time || timePoint.minutes
              , day: currentDay
              , chamberId: currentChamberId
              , value: timePoint.value
              , x_position: timePoint.x_position
              , y_position: timePoint.y_position
            })


          }

        }

      }
      , this);


      // Finally, we should order all timePoints by day and time:

      this.currentTimePoints.sort(function(a, b) {


        if (a.chamberId < b.chamberId) {
          return -1;
        } else if (a.chamberId > b.chamberId) {
          return 1;
        } else {

          if (a.day < b.day) {

            return -1;

          } else if (a.day > b.day) {

            return 1;

          } else {
            // days are equal:

            if (a.minutes === b.minutes) {
              return 0;
            } else {

              return a.minutes < b.minutes ? -1 : 1;
            }


            /*
            var aHours = parseInt(a.timePoint.split(":")[0])

            if (a.timePoint.indexOf("PM") > -1) {
              aHours += 12;
            }


            var bHours = parseInt(b.timePoint.split(":")[0])

            if (b.timePoint.indexOf("PM") > -1) {
              bHours += 12;
            }

            if (aHours < bHours) {
              return -1;
            } else if (aHours > bHours) {
              return 1;
            } else {

              return 0;
            }
            */

          }
        }
      });

      // Now, push the ordered time point data to the data service:

      this.dataService.setSchedule(this.currentTimePoints);

    }

    onClickMe() {
      //this.valuesChange.emit(this.values);
      //this.textBox.nativeElement.value = '';
    };

    onKey(value: string) {
      //this.values = value; //event.target.value;
      return;
    }

}
