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

    //currentDays: string[] = [];
    currentChamberVariable: string;
    currentTimePoints: EnvironmentalVariableTimePoint[] = [];
    dataService: any;
    dayCount: number;

    // passed to the environment selection menu component via @Input param:
    defaultEnv: string = 'Lighting';

    selectedDays = new Observable<number[]>(); //[1,5,6,7];

    currentDays : any[] = [];

    completedDays : number[] = []; //[2,3,4];

    growthChambers = new Observable<Chamber[]>(); //[1,5,6,7];

    currentEnvironment? = new Observable<string>();

    schedule? : any[] = [];

    //currentChambers = new Observable<number[]>();


    constructor(private ChamberDataService: ChamberDataService) {

      this.dataService = ChamberDataService;

/*
      this.dataService.getChambers().subscribe(function(chambers: Chamber[]) {
        console.log("main component received message", chambers);
        this.growthChambers = chambers;

        console.log(this.growthChambers);

      });
      */
      /*
      this.dataService.getCurrentChambers().subscribe(function(chambers: number[]) {
          console.log("main component received message", chambers);
            this.currentChambers = chambers;

      });
      */
/*
      this.dataService.getSelectedDays().subscribe(function(days: number[]) {
        console.log('main app comp received', days);
        this.selectedDays = days;

      });
      */


        //(chambers : number[]) => this.currentChambers = chambers );
      // TODO: this doesn't belong here:
      //this.dataService.setChambers([1,2,3,4,5,6,7,8]);
      //this.dataService.setCurrentChambers([1,2,3]);

      //this.dataService.setCurrentEnvironmentalParameter('lighting')

      this.dataService.getCurrentEnvironmentalParameter().subscribe(function(env) {
        this.currentEnvironment = env;

      })

    }

    ngOnInit(): void {


        //this.dataService.getChambers().then((chambers : number[]) => _this.chambers = chambers);

        console.log('in main, what is currentChambers?')
        //console.log(this.currentChambers);

        let _this = this;

        this.dayCount = this.dataService.getDayCount();

        //this.selectedDays = this.dataService.getSelectedDays();

        //this.currentDays = this.dataService.getSelectedDays();

        this.dataService.getSelectedDays().subscribe(function(days) {


          _this.currentDays = days;

        })


      this.completedDays = this.dataService.getCompletedDays();

        //this.currentChambers = this.dataService.getCurrentChambers();
        this.growthChambers = this.dataService.getChambers();

        this.currentEnvironment = this.dataService.getCurrentEnvironmentalParameter();


        this.dataService.getSchedule().subscribe(function(schedule) {
          _this.schedule = schedule


        })

        //console.log('in app, what is env?', this.currentEnvironment);

        //this.currentEnvironmentalParameter = this.dataService.getCurrentEnvironmentalParameter();

  }





/*
    handleDaysChange(e: string[]) {
      this.currentDays = e;
    }
    */
/*
    handleChambersChange(e:number[]) {
      //this.currentChambers = e;
    }

    handleChamberVariablesMenuStateChange(newState: string) {
      this.currentChamberVariable = newState;
    }
  */


    handleTimePointsChange(newState: any[]) {
      // This gets called via an @Output param event emitter on the <svg-scheduler> component:

      // newState is an array of simple objects with this shape:
      /*
       temp: 19
       time: "12:00 AM"
       x: 0
       y: 149
       */

      console.log("what is new state?")
      console.log(newState);
      //this.currentTimePoints = newState;

      //var timePoint : any;

      // We need to pull values out of our Observables:
      let currentEnv: string
        , currentChamberIds: number[]
        //, currentDays: number[];

      this.currentEnvironment.subscribe((env) => currentEnv = env);
      //this.selectedDays.subscribe((days) => currentDays = days);


      this.growthChambers.subscribe(function(chambers) {
          let currentChambers = chambers.filter(function(chamber) {
            return chamber.isChecked === true;

          });

          currentChamberIds = currentChambers.map(function(chamber) {
            return chamber.id;
          })


      });


      if (currentChamberIds.length === 0 || this.currentDays.length === 0 || currentEnv == '') {

        console.log("returning prematurely", this.currentDays);

        return;
      }



      // We need to filter out anything from currentTimePoints that is covered by the current chamber, day, variable state:

      console.log("what is currentTimePoints?", this.currentTimePoints.length);

      let _this = this;

      this.currentTimePoints = this.currentTimePoints.filter(function(tp) {
        return tp.type !== currentEnv || _this.currentDays.indexOf(tp.day) === -1 || currentChamberIds.indexOf(tp.chamberId) === -1;
      })




      newState.forEach(function(timePoint) {

        console.log('newState forEach', timePoint);

        var currentDay: number, currentChamber: number;




        // We want to insert a timePoint for each chamber and day when chambers or days are being edited in bulk:


        console.log('what is current Days?', _this, _this.currentDays)

        for (let i=0, l=_this.currentDays.length; i<l; i++) {

            console.log(i)

          for (let j=0,l2=currentChamberIds.length; j<l2; j++) {

            console.log(j)


            currentDay = _this.currentDays[i];
            let currentChamber : number = currentChamberIds[j];

            this.currentTimePoints.push({
              type: currentEnv
              , timePoint: timePoint.time
              , day: currentDay
              , chamberId: currentChamber
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
