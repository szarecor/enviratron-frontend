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

    currentDays : any[] = [1];
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
        _this.currentEnvironment = env;

      })

      this.dataService.getChambers().subscribe(function(chambers) {
        _this.growthChambers = chambers;

      })

    }

    ngOnInit(): void {






        let _this = this;

        this.dataService.setSelectedDays(this.currentDays)

        // TODO: this should get refactored generally to be less ugly:
        this.dayCount = this.dataService.getDayCount();


        this.dataService.getDays().subscribe(function(days) {
          console.log("main comp receiving days", days)

          _this.currentDays = days;

        })

        this.dataService.getSchedule().subscribe(function(schedule) {
          _this.schedule = schedule

        })

  }




    handleTimePointsChange(newState: any[]) {
      // This gets called via an @Output param event emitter on the <svg-scheduler> component:
      // We need to pull values out of our Observables:

      console.log("receiving newState via emiitter", newState)

      let currentEnv: string = this.currentEnvironment
        , currentChambers: Chamber[] = this.growthChambers.filter(function(chamber) {
              return chamber.isChecked;
          })


        , currentChamberIds : any[] = currentChambers.map(function(chamber) {
          return chamber.id;
      })


      if (currentChamberIds.length === 0 || this.currentDays.length === 0 || currentEnv == '') {
        return;
      }

      //console.log("what is new state?")
      //console.log(newState)
      //console.log("what is current state?")
      //console.log(this.currentTimePoints)



      let newStateDays = newState.map(function(dp) {

        return dp.day;

      }).filter((v, i, a) => a.indexOf(v) === i);


      //console.log("what is newStateDays?", newStateDays);


      console.log("--------------")
      console.log(this.currentEnvironment)
      console.log(currentChamberIds)
      console.log(this.currentDays)
      console.log(this.schedule)
      console.log("what is currentTimePoints?", this.currentTimePoints)
      console.log("--------------")




      // We need to filter out anything from currentTimePoints that is covered by the current chamber, day, variable state:
      this.currentTimePoints = this.currentTimePoints.filter(function(tp) {


        if (currentChamberIds.indexOf(tp.chamberId) > -1 && this.currentDays.indexOf(tp.day) > -1 && tp.type == this.currentEnvironment) {

          return false;
        }
        /*
        if (this.currentDays.indexOf(tp.day) > -1) {

          return false;
        }

        if (tp.type == this.currentEnvironment) {

          return false;
        }
	      */

         return true;

      }, this);


      console.log("what is filtered list?", this.currentTimePoints.length)



      let _this = this;

      newState.forEach(function(timePoint) {


        var currentDay: number, currentChamber: number;





        // We want to insert a timePoint for each chamber and day when chambers or days are being edited in bulk:
        //console.log("WHAT IS TIMEPOINT?")
        //console.log(timePoint)




        for (let i=0, l=_this.currentDays.length; i<l; i++) {


          for (let j=0,l2=currentChamberIds.length; j<l2; j++) {


            let currentDay = _this.currentDays[i];
            let currentChamberId : number = currentChamberIds[j];

            //console.log("So, what is currentDAy?", currentDay);

            this.currentTimePoints.push({
              type: currentEnv
              , timePoint: timePoint.time
              , day: currentDay
              , chamberId: currentChamberId
              , value: timePoint.value
              , x: timePoint.x
              , y: timePoint.y
            })


          }

        }

      }
      , this);

      console.log(this.currentTimePoints.length)

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

      //console.log("what are we pushing to the service?", this.currentTimePoints[0])

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
