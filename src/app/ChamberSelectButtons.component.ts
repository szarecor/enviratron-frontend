/**
 * Created by szarecor on 6/7/17.
 */

import {Component, Input, Output, EventEmitter, OnInit, NgZone} from '@angular/core';
import { ChamberDataService } from './data.service';
import { ChangeDetectorRef } from '@angular/core';
import {Observable} from "rxjs/Observable";

@Component({
    selector: 'chamber-buttons',
    // This was poorly documented and difficult to find:
    interpolation: ['[[', ']]'],
    templateUrl: './chamber_buttons_template.html'
    //, providers: [ChamberDataService]
  //, pipes: ['async']
})


export class ChamberButtonsComponent implements OnInit {

    chambers: number[] = [];
    currentChambers: number[] = [];
    //cd: ChangeDetectorRef;
      // Emit an event for the parent to handle when there is a change to the currently selected chambers:
      @Output() onChambersChange: EventEmitter<any> = new EventEmitter<any>();
      dataService: any;
      //zone: NgZone;

      // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
      selectedChambersChangeHandler(selectedChambers: string[]) {
        this.onChambersChange.emit(selectedChambers);
      }

  constructor(private ds: ChamberDataService) {
    //this.cd = cd;
    this.dataService = ds; //ChamberDataService;

    //this.zone = zone;



    this.dataService.getChambers().subscribe((chambers : number[]) => this.chambers = chambers );
    //this.dataService.getCurrentChambers().subscribe((chambers : number[]) => this.currentChambers = chambers );
    //this.currentChambers = this.dataService.getCurrentChambers();
    //let _that = this;

    this.dataService.getCurrentChambers().subscribe(function(chambers : number[]) {
      console.log('buttons comp receiving', chambers)
      this.currentChambers = chambers;
      console.log("and", this.currentChambers, this)
      //self.zone.run(() => {
      //  console.log('enabled time travel');
      //});

      //this.cd.markForCheck();
    });


  }


  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.dataService.unsubscribe();
  }
  ngOnInit(): void {

  }


    chamberButtonClick(v:any) {


        console.log('click', v, this.currentChambers, this.currentChambers.indexOf(v));

        let _chambers = this.currentChambers;
        //this.dataService.setCurrentChambers([])

        if (_chambers.indexOf(v) === -1) {
            // Here we are adding a chamber to the selectedChambers []:
            console.log('pushing')
            _chambers.push(v);
            _chambers.sort();

        } else {
            // And here we are removing a chamber from the selectedChambers []:
            console.log("removing")
            _chambers = _chambers.filter(function(oldVal) {
                return oldVal !== v;
            })
        }
        console.log("click, setting chambers to", _chambers)
        //this.currentChambers = _chambers;
        this.dataService.setCurrentChambers(_chambers);


      // emit the new data to the parent
      //this.selectedChambersChangeHandler(this.currentChambers);
    }

    allChambersButtonClick(ev:any) {
        //this.currentChambers = (this.currentChambers.length === this.chamberNames.length) ? [] : this.chamberNames;
          // emit the new data to the parent
          //this.selectedChambersChangeHandler(this.currentChambers);
    }

    /*
    @Input() dayCount: number = 0;
    @Input() selectedDays: any[] = [];
    @Input() completedDays: any[] = [];
    // to be populated by ngOnInit() method:
    days: any =  [];

    // Emit an event for the parent to handle when there is a change on the days <select> list:
    @Output() onDaysChange: EventEmitter<any> = new EventEmitter<any>();

    // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
    selectedDaysChangeHandler(selectedDays) {
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
    */

}
