import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="cancelled.emit()">
        <div class="modal" style="max-width:400px" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ title() }}</h2>
          <p style="color:var(--muted);line-height:1.6;margin-bottom:0">{{ message() }}</p>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="cancelled.emit()">Cancel</button>
            <button class="btn btn-danger"  (click)="confirmed.emit()">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  open         = input(false);
  title        = input('Are you sure?');
  message      = input('This action cannot be undone.');
  confirmLabel = input('Delete');

  confirmed = output<void>();
  cancelled = output<void>();
}
