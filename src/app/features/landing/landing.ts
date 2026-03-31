import { Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {

  currentTab = 'Login';

  changeTab(tab: string){
    console.log("Button is Clicked")
    this.currentTab = tab;
  }

  constructor(private router: Router){}

  goToLogin(){
    this.router.navigate(['/login']);
  }

}
