import { Component, Input, Output} from '@angular/core';



@Component({
  selector: 'my-app',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './app_template.html'

})


export class AppComponent  {

    name: string = 'World';
    values: string = 'foobar';

    currentChambers: string[] = [];
    currentDays: string[] = [];
    currentChamberVariable: string;
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


    chambers : string[] = ['chamber 1', 'chamber 2', 'chamber 3', 'chamber 4', 'chamber 5', 'chamber 6', 'chamber 7', 'chamber 8'];
    dayCount : number = 20;
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


    onClickMe() {
      console.log("click", this);
      this.values = ''
      //this.valuesChange.emit(this.values);
      //this.textBox.nativeElement.value = '';
    };

    onKey(value: string) {
      //this.values = value; //event.target.value;
      return;
    }

}
