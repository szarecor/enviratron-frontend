/**
 * Created by szarecor on 6/22/17.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import { Chamber } from './chamber.interface';
//import {Http} from "@angular/http";
import {HttpClient} from '@angular/common/http';

//import { URLSearchParams, Headers} from "@angular/common/http"

import 'rxjs/add/operator/map';

//import {HttpModule} from "@angular/http";
//import {HttpClient} from "selenium-webdriver/http";
//import {Http, Response, Headers} from 'angular2/http';

@Injectable()
/*
@NgModule({
  imports: [
    HttpModule,
  ],
})
*/
export class ChamberDataService {


    private chambers = new BehaviorSubject<Chamber[]>([]);
    private selectedChamberIds = new BehaviorSubject<number[]>([]);
    private days : number = 20;
    private selectedDays = new BehaviorSubject<number[]>([]);
    private currentEnvironmentalParameter? = new BehaviorSubject<string>('');
    private timePoints = new BehaviorSubject<any[]>([]);
    private schedule = new BehaviorSubject<any[]>([]);

    // TODO: this obviously shouldn't be hard-coded:
    private experimentId : number = 0;


    constructor(private http: HttpClient) {

      console.log("dataService constructor called")


    }


    setExperimentId(experimentId:number) {

      // TODO: this should be moved to init() or constructor():

      this.experimentId = experimentId;

      console.log("dataService setExperiment() called", experimentId)

      // Call the server to fetch any existing data we might have:
      let _url = 'http://localhost:8000/experiments/datapoints/' + this.experimentId + "/";
      let _this = this;

      this.http.get(
        _url
      ).subscribe(function(resp: any) {
        console.log("GET RESPONSE:");
        console.log(resp.schedule);
        window['dbug'] = resp;

        //let sched = JSON.parse(resp);
        _this.setSchedule(resp.schedule);
      });



    }


    /* SCHEDULE: */

    setSchedule(schedule: any[]) {

      this.schedule.next(schedule);
    }


    getSchedule() {
      console.log("GET SCHEDULE CALLED!!!!")
      return this.schedule.asObservable();
    }



    clearTimePoints(chambers: any[], days: number[], environment: string) {

    }

    removeScheduleTimePoint(timePointToDelete: any) {

      let _url:string = 'http://localhost:8000/experiments/delete-datapoint/'
      let sched = this.schedule.value;

      let len = this.schedule.value.length;

      console.log("removeScheduleTimePoint called", timePointToDelete)


      //timePoint['environment'] = this.currentEnvironmentalParameter.value

      let tmpCopy;

      let selectedChamberIds = this.chambers.value.filter(function(chamber) {
        return chamber.isChecked === true;
      }).map(function(chamber) { return chamber.id; });

      let selectedDays = this.selectedDays.value;


      let dataPointsToDelete: any[] = [];

      sched = sched.filter(function(timePoint) {

        if (timePoint.environment !== this.currentEnvironmentalParameter.value) {
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

        console.log("return b/c sched.length...")

        return;

      }

      this.schedule.next(sched);

      // Now we need to notify the backend server:

      console.log("what is for deletion?", dataPointsToDelete)

      dataPointsToDelete.forEach(function(dp) {

        dp.experiment = this.experimentId;

        this.http.post(
          _url
          , dp
        ).subscribe(function(resp) {
          console.log("POST RESPONSE:");
          console.log(resp);
        });

      }, this)
    }


    addScheduleTimePoint(timePoint: any) {

      let _url:string = 'http://localhost:8000/experiments/add-datapoints/'
      let points: any[] = [];
      let sched = this.schedule.value;


      timePoint['environment'] = this.currentEnvironmentalParameter.value

      //let tmpCopy;

      let chambers = this.chambers.value.filter(function(chamber) {
        return chamber.isChecked === true;

      });
      let selectedDays = this.selectedDays.value;


      for (let i=0,l=selectedDays.length; i<l; i++) {

        let day = selectedDays[i];
        // TODO: Is there a better way to clone?


        for (let j=0,l2=chambers.length; j<l2; j++) {

          let chamber = chambers[j];

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



        this.schedule.next(sched);


        // Finally, we can notify the backend/database:
        points.forEach(function(dp) {

          let _clone = JSON.parse(JSON.stringify(dp));
          //_clone.experiment = 1;


          this.http.post(
            _url
            , _clone
          ).subscribe(function(resp) {
            console.log("POST RESPONSE:", resp);
          });

        }, this);
    }

    /* CHAMBERS: */
    getChambers(): Observable<Chamber[]> {
        return this.chambers.asObservable();
    }


    getSelectedChambers() {
      return this.selectedChamberIds.asObservable();
    }

    setChambers(chambers: Chamber[]) {
        this.chambers.next(chambers);
        this.selectedChamberIds.next(chambers.filter((c) => c.isChecked).map(c => c.id));

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

    getCurrentEnvironmentalParameter() {

      return this.currentEnvironmentalParameter.asObservable();
    }

    getCurrentEnvironmentalParameterValue() {
      return this.currentEnvironmentalParameter.value;

    }

    setCurrentEnvironmentalParameter(environment: string) {


      this.currentEnvironmentalParameter.next(environment); //{name:environment});


    }


}
