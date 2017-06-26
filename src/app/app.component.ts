import { Component, Input, Output, OnInit} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ChamberDataService } from './data.service';
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'my-app',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './app_template.html'
  //, providers: [ChamberDataService]

})


export class AppComponent implements OnInit {

    currentChambers: Observable<number[]> = [];
    currentDays: string[] = [];
    currentChamberVariable: string;
    currentTimePoints: any[];
    dataService: any;
    dayCount: number;

    selectedDays : number[] = []; //[1,5,6,7];
    completedDays : number[] = []; //[2,3,4];
    chambers : number[] = [];


    constructor(private ChamberDataService: ChamberDataService) {
      this.dataService = ChamberDataService;

      this.dataService.getChambers().subscribe((chambers : number[]) => this.chambers = chambers );


      this.dataService.getCurrentChambers().subscribe(function(chambers: number[]) {
          console.log("main component received message", chambers);
        this.currentChambers = chambers;

      });



        //(chambers : number[]) => this.currentChambers = chambers );
      // TODO: this doesn't belong here:
      //this.dataService.setChambers([1,2,3,4,5,6,7,8]);
      //this.dataService.setCurrentChambers([1,2,3]);
    }

    ngOnInit(): void {


        //this.dataService.getChambers().then((chambers : number[]) => _this.chambers = chambers);


        console.log(this.currentChambers);

        this.dayCount = this.dataService.getDayCount();
        this.selectedDays = this.dataService.getSelectedDays();
        this.completedDays = this.dataService.getCompletedDays();


  }






    handleDaysChange(e: string[]) {
      this.currentDays = e;
    }

    handleChambersChange(e:number[]) {
      this.currentChambers = e;
    }

    handleChamberVariablesMenuStateChange(newState: string) {
      this.currentChamberVariable = newState;
    }

    handleTimePointsChange(newState: any[]) {
      console.log(newState);
      this.currentTimePoints = newState;
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
