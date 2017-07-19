/**
 * Created by szarecor on 6/22/17.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import { Chamber } from './chamber.interface';


@Injectable()
export class ChamberDataService {


    private chambers = new BehaviorSubject<Chamber[]>([]);

    private selectedChamberIds = new BehaviorSubject<number[]>([]);

    private days : number = 20;
    private selectedDays = new BehaviorSubject<number[]>([]);

    private currentEnvironmentalParameter? = new BehaviorSubject<string>('');


    private timePoints = new BehaviorSubject<any[]>([]);

    private schedule = new BehaviorSubject<any[]>([]);


    /* SCHEDULE: */

    setSchedule(schedule: any[]) {


      console.log("dataservice received", schedule)
      this.schedule.next(schedule);
    }


    getSchedule() {

      return this.schedule.asObservable();
    }


    removeScheduleTimePoint(timePointToDelete: any) {
      console.log("Let's delete this:", timePointToDelete);
      let sched = this.schedule.value;

      //timePoint['environment'] = this.currentEnvironmentalParameter.value

      let tmpCopy;

      let selectedChamberIds = this.chambers.value.filter(function(chamber) {
        return chamber.isChecked === true;
      }).map(function(chamber) { return chamber.id; });

      let selectedDays = this.selectedDays.value;

      console.log(sched)
	    console.log(selectedChamberIds, selectedDays)

      sched = sched.filter(function(timePoint) {

        if (timePoint.environment !== this.currentEnvironmentalParameter.value) {
          return true;
        }

        if (selectedChamberIds.indexOf(timePoint.chamberId) === -1) {
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

        return false;


      }, this);

      this.schedule.next(sched);



      /*
      for (let i=0,l=selectedDays.length; i<l; i++) {

        let day = selectedDays[i];
        // TODO: Is there a better way to clone?
        tmpCopy = JSON.parse(JSON.stringify(timePoint))
        tmpCopy.day = day;

        for (let j=0,l2=chambers.length; j<l2; j++) {
          tmpCopy.chamberId = chambers[j].id
          sched.push(tmpCopy);
        }

      }
      */
    }


    addScheduleTimePoint(timePoint: any) {


      let sched = this.schedule.value;

      timePoint['environment'] = this.currentEnvironmentalParameter.value

      let tmpCopy;

      let chambers = this.chambers.value.filter(function(chamber) {
        return chamber.isChecked === true;

      });
      let selectedDays = this.selectedDays.value;


      for (let i=0,l=selectedDays.length; i<l; i++) {

        let day = selectedDays[i];
        // TODO: Is there a better way to clone?
        tmpCopy = JSON.parse(JSON.stringify(timePoint))
        tmpCopy.day = day;

        for (let j=0,l2=chambers.length; j<l2; j++) {
          tmpCopy.chamberId = chambers[j].id
          sched.push(tmpCopy);
        }

      }

      sched.sort(function(a, b) {

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

          }
        }
      });

        this.schedule.next(sched);

    }

    /* CHAMBERS: */
    getChambers(): Observable<Chamber[]> {
        return this.chambers.asObservable();
    }


    getSelectedChambers() {
      return this.selectedChamberIds.asObservable();
    }

    setChambers(chambers: Chamber[]) {
        console.log("setChambers called")
        console.log(chambers.filter((c) => c.isChecked));
        console.log("")
        this.chambers.next(chambers);
        this.selectedChamberIds.next(chambers.filter((c) => c.isChecked).map(c => c.id));

    }

    /* TIME POINTS */
    setTimePoints(timePoints: any[]) {
      console.log("setTimePoints recevied", timePoints)
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

        //console.log("new selectedDays:", days)
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
