/**
 * Created by szarecor on 6/7/17.
 */

import {Component, Input, Output, EventEmitter, OnInit, NgZone} from '@angular/core';
import { ChamberDataService } from './data.service';
import { ChangeDetectorRef } from '@angular/core';
import {Observable} from "rxjs/Observable";
import { Chamber } from './chamber.interface';

@Component({
    selector: 'chamber-buttons',
    // This was poorly documented and difficult to find:
    interpolation: ['[[', ']]'],
    templateUrl: './chamber_buttons_template.html'
    //, providers: [ChamberDataService]
  //, pipes: ['async']
})


export class ChamberButtonsComponent implements OnInit {

    chambers: Chamber[] = [];
    //currentChambers: number[] = [];
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


    let chambers: Chamber[] = [];

    for (var i:number=1,l:number=8; i<=l; i++) {

      chambers.push({
        id: i
        , isChecked: i === 1 ? true : false
      })

    }
    this.dataService.setChambers(chambers);
    this.chambers = chambers;


    /*
    this.dataService.getChambers().subscribe(function(chambers : Chamber[]) {
      this.chambers = chambers;

    });
    */

    //this.dataService.getChambers().subscribe((chambers : Chamber[]) => this.chambers = chambers );
    //this.dataService.getCurrentChambers().subscribe((chambers : number[]) => this.currentChambers = chambers );
    //this.currentChambers = this.dataService.getCurrentChambers();
    //let _that = this;
/*
    this.dataService.getCurrentChambers().subscribe(function(chambers : Chamber[]) {
      console.log('buttons comp receiving', chambers)
      this.currentChambers = chambers;
      console.log("and", this.currentChambers, this)
      //self.zone.run(() => {
      //  console.log('enabled time travel');
      //});

 */
      //this.cd.markForCheck();

  }


  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.dataService.unsubscribe();
  }
  ngOnInit(): void {
/*
        let chambers: Chamber[] = [];

        for (var i:number=1,l:number=8; i<=l; i++) {



          chambers.push(function(i) {


            return {
              id: i
                , isChecked: true //i < 4 ? true : false
            }
          }(i)


          )

        }
        this.dataService.setChambers(chambers);
        */

    //this.dataService.getChambers().subscribe(function(chambers : Chamber[]) {
      //this.chambers = chambers;

      //console.log("listening for chambers")
      //console.log(this.chambers.filter(function(c) { return c.isChecked === true; }));

    //});
  }


    chamberButtonClick(v:any) {

      let _this = this;

      // TODO: figure out why not wrapping the setChambers() call in a setTimeout is causing problems
      // without it, the Svg Component seems to be one click behind in state at all times.
      window.setTimeout(
        function() {
          _this.dataService.setChambers(_this.chambers);
        }

        , 100
      )





    }

    allChambersButtonClick(ev:any) {

        let srcEl = ev.srcElement
          , newVal = srcEl.checked ? true : false;

        this.chambers.forEach(function(chamber) {

          chamber.isChecked = newVal;

        })

        this.dataService.setChambers(this.chambers);
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
