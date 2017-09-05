/**
 * Created by szarecor on 6/22/17.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import { Chamber } from './chamber.interface';
import {HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';


@Injectable()
export class ChamberDataService {

    private logging:boolean = false;
    private chambers = new BehaviorSubject<Chamber[]>([]);
    private selectedChamberIds = new BehaviorSubject<number[]>([]);
    // TODO: Don't hardcode days here, it needs to come from the DB/Server
    private days : number;
    private selectedDays = new BehaviorSubject<number[]>([]);
    private environment? = new BehaviorSubject<string>('');
    private timePoints = new BehaviorSubject<any[]>([]);
    private schedule = new BehaviorSubject<any[]>([]);

    // TODO: this obviously shouldn't be hard-coded:
    private experimentId : number = 0;


    constructor(private http: HttpClient) {
      if (this.logging) console.log("dataService constructor called")
    }


    getExperimentId() {
      return this.experimentId;
    }

    setExperimentId(experimentId:number) {

      // TODO: this should be moved to init() or constructor():

      this.experimentId = experimentId;

      if (this.logging) console.log("dataService setExperiment() called", experimentId)

      // Call the server to fetch any existing data we might have:
      let _url = 'http://localhost:8000/experiments/datapoints/' + this.experimentId + "/";
      let _this = this;

      this.http.get(
        _url
      ).subscribe(function(resp: any) {
        if (this.logging) console.log("GET RESPONSE:");
        if (this.logging) console.log(resp.schedule);

        _this.setSchedule(resp.schedule);
      });
    }


    loadData() {
      // Call the server to fetch any existing data we might have:
      let _url = 'http://localhost:8000/experiments/datapoints/' + this.experimentId + "/";
      let _this = this;

      this.http.get(
        _url
      ).subscribe(function(resp: any) {
        if (this.logging) console.log("GET RESPONSE:");
        if (this.logging) console.log(resp.schedule);

        _this.setSchedule(resp.schedule);
      });

    }

    /* SCHEDULE: */

    setSchedule(schedule: any[]) {

      this.schedule.next(schedule);
    }


    getSchedule() {
      if (this.logging) console.log("GET SCHEDULE CALLED")
      return this.schedule.asObservable();
    }


   cloneDayData(sourceDay:number, destinationDays: number[]) {
     let _url:string = 'http://localhost:8000/experiments/add-datapoints/'
       , datapointsToCopy = this.schedule.value.filter(function(timePoint) {

          if (timePoint.environment !== this.environment.value) return false;
          if (this.selectedChamberIds.value.indexOf(timePoint.chamber) === -1) return false;
          if (timePoint.day !== sourceDay) return false;

          return true;
      }
      , this);

     if (this.logging) console.log("WHAT ARE THE DAY DATAPOINTS TO COPY?");
     if (this.logging) console.log(datapointsToCopy);

     let _this = this;
     let counter = 0;

     for (let timePoint of datapointsToCopy) {

       for (let day of destinationDays) {


         if (this.logging) console.log("COPYING TO", day);

          let tmpCopy = JSON.parse(JSON.stringify(timePoint));
          tmpCopy.day = day;

          if (this.logging) console.log("COPY", timePoint, day)
		      this.http.post(
	          _url
		        , tmpCopy
		      ).subscribe(function(resp) {
            counter++;
		        if (this.logging) console.log("POST RESPONSE:", resp, counter);

		        if (counter === datapointsToCopy.length) {
		          // We have received responses for all of the insert/create requests:
              window.setTimeout(
                function() {
                  console.log("DOES THIS EVER FIRE?");
                  _this.loadData()
                }, 750);
            }
		      });

       } // for day of destinationDays
     } // for dataPoint of dataPointsToCopy
   } // END cloneDayData() METHOD


   cloneChamberData(sourceChamber:number, destinationChambers: number[]) {
      if (this.logging) console.log("CLONE METHOD CALLED", sourceChamber, destinationChambers);
      if (this.logging) console.log("SOURCE CHAMBER", sourceChamber);
      if (this.logging) console.log("destinations", destinationChambers);

      // first get the time points we are going to clone:
      let toCopy = this.schedule.value.filter(function(timePoint) {
        if (timePoint.environment !== this.environment.value) {
          return false;
        }

        if (timePoint.chamber !== sourceChamber) {
          return false;
        }

        if (this.selectedDays.value.indexOf(timePoint.day) === -1) {
          return false;
        }
        return true;

      }, this)

      if (this.logging) console.log("WHAT DO WE WANT TO COPY?");
      if (this.logging) console.log(toCopy);

     let _url:string = 'http://localhost:8000/experiments/add-datapoints/'


     for (let timePoint of toCopy) {

       for (let destinationChamber of destinationChambers) {


         let tmpCopy = JSON.parse(JSON.stringify(timePoint))
         tmpCopy.chamber = destinationChamber;

         if (this.logging) console.log("CHAMBER", destinationChamber);
         if (this.logging) console.log("CLONE", tmpCopy);

           this.http.post(
             _url
             , tmpCopy
           ).subscribe(function(resp) {
             if (this.logging) console.log("POST RESPONSE:", resp);
           });

       }
     }

     let _this = this;


     if (this.logging) console.log("FINISHED CLONING, CALLING this.loadData() ON DELAY...")
    // TODO: THIS IS ONLY A QUICK PROOF OF CONCEPT, DO NOT USE TIMEOUTS! CONVERT THIS UGLINESS TO OBSERVABLES!
     window.setTimeout(
       function() {
         _this.loadData()
       }, 500);
   }


   deleteTimePointsByDays(days: number[]) {
     let _url:string = 'http://localhost:8000/experiments/delete-datapoints/'

       , _this = this
       , payload = {
	       experimentId: this.experimentId
       , chambers: this.selectedChamberIds.value
       , days: days
       , environment: this.environment.value
     };

     if (this.logging) console.log("CLEARING DAY-WISE DATA")
     if (this.logging) console.log("WHAT IS PAYLOAD?")
     if (this.logging) console.log(payload);

     return this.http.post(
       _url, payload
     ).map(function(res:Response) {
       if (_this.logging) console.log(res);
       return res;
     });
   }


    deleteTimePointsByChamber(chambers: number[]) {
      let _url:string = 'http://localhost:8000/experiments/delete-datapoints/'
        , payload = {
          experimentId: this.experimentId
          , chambers: chambers
          , days: this.selectedDays.value
          , environment: this.environment.value
        }
        , _this = this;

      return this.http.post(
        _url
        , payload
      )
      .map(function(res:Response) {
        if (_this.logging) console.log(res);
        return res;
      });

    }

    clearSchedule(chamber, day, environment) {
    }


    removeScheduleTimePoint(timePointToDelete: any) {

      let _url:string = 'http://localhost:8000/experiments/delete-datapoint/'
        ,  sched = this.schedule.value
        , len = this.schedule.value.length;

      if (this.logging) console.log("removeScheduleTimePoint called", timePointToDelete)

      let selectedChamberIds = this.chambers.value.filter(function(chamber) {
        return chamber.isChecked === true;
      }).map(function(chamber) { return chamber.id; });

      let selectedDays = this.selectedDays.value;


      let dataPointsToDelete: any[] = [];

      sched = sched.filter(function(timePoint) {

        if (timePoint.environment !== this.environment.value) {
          return true;
        }

        if (selectedChamberIds.indexOf(timePoint.chamber) === -1) {
          return true;
        }

        if (selectedDays.indexOf(timePoint.day) === -1) {
          return true;
        }

        // At this point we've eliminated from consideration everything for other chambers, days and env variables
        if (timePoint.minutes !== timePointToDelete.minutes) {
          return true;
        }

        if (timePoint.value !== timePointToDelete.value) {

          return true;
        }

        dataPointsToDelete.push(timePoint)
        return false;


      }, this);

      if (len === sched.length) {
        // It seems that filter didn't change the array of timePoints at all,
        // so there is nothing else to do...

        if (this.logging) console.log("return b/c sched.length...")

        return;

      }

      this.schedule.next(sched);

      // Now we need to notify the backend server:

      if (this.logging) console.log("what is for deletion?", dataPointsToDelete)

      dataPointsToDelete.forEach(function(dp) {

        dp.experiment = this.experimentId;

        this.http.post(
          _url
          , dp
        ).subscribe(function(resp) {
          if (this.logging) console.log("POST RESPONSE:");
          if (this.logging) console.log(resp);
        });

      }, this)
    }


    addScheduleTimePoint(timePoint: any, days?:number[]) {

      let daysToPopulate = days || this.selectedDays.value
        , _url:string = 'http://localhost:8000/experiments/add-datapoints/'
        , points: any[] = []
        ,  sched = this.schedule.value
	      , chambers = this.chambers.value.filter(function(chamber) {
		      return chamber.isChecked === true;
        });
        //, selectedDays = this.selectedDays.value;

      timePoint['environment'] = this.environment.value;


      // Loop through the relevant days, creating a new datapoint for each
      for (let i=0,l=daysToPopulate.length; i<l; i++) {

        let day = daysToPopulate[i];

        // And also loop through the relevant chambers creating a datapoint for each:
        for (let j=0,l2=chambers.length; j<l2; j++) {

          let chamber = chambers[j];

          // TODO: Is there a better way to clone?
          let tmpCopy = JSON.parse(JSON.stringify(timePoint))
          tmpCopy.day = day;
          tmpCopy.chamber = chamber.id;
          tmpCopy.experiment = this.experimentId;

          points.push(tmpCopy);
          sched.push(tmpCopy);
        }

      }

      sched.sort(function(a, b) {

        if (a.chamber < b.chamber) {
          return -1;
        } else if (a.chamber > b.chamber) {
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

          }
        }
      });


      console.log("WHAT IS OUR SORTED SCHEDULE?");
      console.log(sched)

        this.schedule.next(sched);


        // Finally, we can notify the backend/database:
        points.forEach(function(dp) {

          let _clone = JSON.parse(JSON.stringify(dp));
          //_clone.experiment = 1;

          console.log(_clone);


          this.http.post(
            _url
            , _clone
          ).subscribe(function(resp) {
            if (this.logging) console.log("POST RESPONSE:", resp);
          });

        }, this);
    }

    /* CHAMBERS: */
    getChambers(): Observable<Chamber[]> {
        return this.chambers.asObservable();
    }


    getSelectedChambers() {
      if (this.logging) console.log("DATA SERVICE RETURNING SELECTED CHAMBERS", this.selectedChamberIds.value);
      return this.selectedChamberIds.asObservable();
    }

    setChambers(chambers: Chamber[]) {

        let tmpChambers = chambers.filter(function(chamber) {
          return chamber.isChecked;
        }).map(function(chamber) {
          return chamber.id;
        })

        if (this.logging) console.log("DATA SERVICE RECEIVING CHAMBERS");
        if (this.logging) console.log('CHAMBERS', tmpChambers);

        this.chambers.next(chambers);
        this.selectedChamberIds.next(tmpChambers);

        //this.selectedChamberIds.next(chambers.filter((c) => c.isChecked).map(c => c.id));
        if (this.logging) console.log("SETTING SELECTED CHAMBERS", this.selectedChamberIds.value);
    }

    /* TIME POINTS */
    setTimePoints(timePoints: any[]) {
      this.timePoints.next(timePoints);
    }

    getTimePoints(): Observable<any[]> {

      return this.timePoints.asObservable();
    }


    /* DAYS: */

    getDayCount(): number {
      return this.days;
    }

    setDayCount(days:number) {
      this.days = days;
    }

    getDays(): Observable<number[]> {
      return this.selectedDays.asObservable();
    }



    setSelectedDays(days: number[]) {
        this.selectedDays.next(days);
    }

    getCompletedDays(): number[] {
        return [2];
    }

    /* CHAMBER ENVIRONMENT PARAMETERS: */

    getEnvironment() {

      return this.environment.asObservable();
    }

    getEnvironmentValue() {
      return this.environment.value;

    }

    setEnvironment(environment: string) {
      if (this.logging) console.log("DATA SERVICE RECEIVING NEW ENVIRONMENT!", environment);
      this.environment.next(environment); //{name:environment});
    }

}
