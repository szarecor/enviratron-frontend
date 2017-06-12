/**
 * Created by szarecor on 6/7/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';



@Component({
    selector: 'days-select',
    // This was poorly documented and difficult to find:
    interpolation: ['[[', ']]'],
    templateUrl: './days_select_template.html'
})


export class DaysSelectComponent  {
    @Input() dayCount: number = 0;
    @Input() selectedDays: any[] = [];
    @Input() completedDays: any[] = [];
    // to be populated by ngOnInit() method:
    days: any =  [];

    // Emit an event for the parent to handle when there is a change on the days <select> list:
    @Output() onDaysChange: EventEmitter<any> = new EventEmitter<any>();

    // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
    selectedDaysChangeHandler(selectedDays: string[]) {
        this.onDaysChange.emit(selectedDays);
    }

    ngOnInit() {
        // Initialize the array of day identifiers:
        this.days = Array.from(
            Array(this.dayCount).keys(),
            function(i) {
                return i+1;
            }
        );

    }


}

