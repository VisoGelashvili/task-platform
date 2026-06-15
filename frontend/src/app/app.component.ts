import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);

  ngOnInit() {
    // On every page refresh, restore the user from the token stored in localStorage.
    // Without this, the navbar would show "undefined" after a refresh even if logged in.
    this.auth.init();
  }
}
