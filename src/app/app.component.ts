import { Component, Input, Output, OnInit} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ChamberDataService } from './data.service';
import {Observable} from "rxjs/Observable";
import { Chamber, EnvironmentalVariableTimePoint } from './chamber.interface';
import {current} from "codelyzer/util/syntaxKind";

@Component({
  selector: 'my-app',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './app_template.html'
  //, providers: [ChamberDataService]

})


export class AppComponent implements OnInit {

    currentTimePoints: EnvironmentalVariableTimePoint[] = [];
    dataService: any;
    dayCount: number;

    // passed to the environment selection menu component via @Input param:
    defaultEnv: string = 'Lighting';

    //selectedDays = new Observable<number[]>(); //[1,5,6,7];

    currentDays : any[] = [];
    completedDays : number[] = []; //[2,3,4];
    growthChambers: any[] = []; // new Observable<Chamber[]>(); //[1,5,6,7];
    currentEnvironment? : string = ''; //new Observable<string>();
    schedule? : any[] = [];



    constructor(private ChamberDataService: ChamberDataService) {

      this.dataService = ChamberDataService;

      let _this = this;

      // TODO: this doesn't belong here:
      //this.dataService.setChambers([1,2,3,4,5,6,7,8]);
      //this.dataService.setCurrentChambers([1,2,3]);
      //this.dataService.setCurrentEnvironmentalParameter('lighting')

      this.dataService.getCurrentEnvironmentalParameter().subscribe(function(env) {
        console.log("app receiving new env!", env);
        _this.currentEnvironment = env;

      })

      this.dataService.getChambers().subscribe(function(chambers) {
        _this.growthChambers = chambers;

      })

    }

    ngOnInit(): void {




        let _this = this;

        // TODO: this should get refactored generally to be less ugly:
        this.dayCount = this.dataService.getDayCount();


        this.dataService.getSelectedDays().subscribe(function(days) {
          _this.currentDays = days;

        })

        this.dataService.getSchedule().subscribe(function(schedule) {
          _this.schedule = schedule

        })

  }




    handleTimePointsChange(newState: any[]) {
      // This gets called via an @Output param event emitter on the <svg-scheduler> component:
      // We need to pull values out of our Observables:
      let currentEnv: string = this.currentEnvironment
        , currentChambers: Chamber[] = this.growthChambers.filter(function(chamber) {
              return chamber.isChecked;
          })


        , currentChamberIds : any[] = currentChambers.map(function(chamber) {
          console.log(chamber, chamber.id);
          return chamber.id;
      })


      if (currentChamberIds.length === 0 || this.currentDays.length === 0 || currentEnv == '') {
        console.log("returning prematurely", this.currentDays);
        return;
      }

      // We need to filter out anything from currentTimePoints that is covered by the current chamber, day, variable state:

      let _this = this;

      newState.forEach(function(timePoint) {


        var currentDay: number, currentChamber: number;


        // We want to insert a timePoint for each chamber and day when chambers or days are being edited in bulk:

        for (let i=0, l=_this.currentDays.length; i<l; i++) {


          for (let j=0,l2=currentChamberIds.length; j<l2; j++) {


            let currentDay = _this.currentDays[i];
            let currentChamberId : number = currentChamberIds[j];

            this.currentTimePoints.push({
              type: currentEnv
              , timePoint: timePoint.time
              , day: currentDay
              , chamberId: currentChamberId
              , value: timePoint.value
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

            if (a.timePoint === b.timePoint) {
              return 0;
            } else {

              return a.timePoint < b.timePoint ? -1 : 1;
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
      console.log("click", this);
      //this.valuesChange.emit(this.values);
      //this.textBox.nativeElement.value = '';
    };

    onKey(value: string) {
      //this.values = value; //event.target.value;
      return;
    }

}
