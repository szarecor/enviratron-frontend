import { Component, Input, Output, OnInit} from '@angular/core';

import { ChamberDataService } from './data.service';

@Component({
  selector: 'my-app',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './app_template.html',
  providers: [ChamberDataService]

})


export class AppComponent implements OnInit {

    currentChambers: string[] = [];
    currentDays: string[] = [];
    currentChamberVariable: string;

    currentTimePoints: any[];

    dataService: any;
    dayCount: number;

    /*
    chamberRegimes: = {
      'chambers': {
          'chamber 1': {
              'temperature': {
                  // k == datetime, v == degrees celsius

              }


          }

        }



    };
    */
  chambers : string[] = [] //'chamber 1', 'chamber 2', 'chamber 3', 'chamber 4', 'chamber 5', 'chamber 6', 'chamber 7', 'chamber 8'];


    constructor(private ChamberDataService: ChamberDataService) {

      this.dataService = ChamberDataService;

    }

    ngOnInit(): void {
        console.log(ChamberDataService)
        this.chambers = this.dataService.getChambers();
        this.dayCount = this.dataService.getDayCount();
  }



    //dayCount : number = 20;
    selectedDays : number[] = [1,5,6,7];
    completedDays : number[] = [2,3,4];



    handleDaysChange(e: string[]) {
      this.currentDays = e;
    }

    handleChambersChange(e:string[]) {
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
