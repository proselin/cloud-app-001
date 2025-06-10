import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
  }> = [];

  success(title: string, message = '') {
    this.showNotification('success', title, message);
  }

  error(title: string, message = '') {
    this.showNotification('error', title, message);
  }

  warning(title: string, message = '') {
    this.showNotification('warning', title, message);
  }

  info(title: string, message = '') {
    this.showNotification('info', title, message);
  }

  private showNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = {
      id,
      type,
      title,
      message,
      timestamp: Date.now()
    };

    this.notifications.push(notification);

    // Create notification element
    this.createNotificationElement(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(id);
    }, 5000);
  }

  private createNotificationElement(notification: Notification) {
    // Check if container exists, if not create it
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }

    // Create notification element
    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = this.getNotificationClasses(notification.type);

    element.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${this.getIcon(notification.type)}
        </div>
        <div class="ml-3 w-0 flex-1">
          <p class="text-sm font-medium text-gray-900">${notification.title}</p>
          ${notification.message ? `<p class="mt-1 text-sm text-gray-500">${notification.message}</p>` : ''}
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none" onclick="this.parentElement.parentElement.parentElement.remove()">
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    `;

    container.appendChild(element);

    // Add animation
    setTimeout(() => {
      element.classList.add('transform', 'transition-all', 'duration-300', 'translate-x-0');
    }, 10);
  }

  private getNotificationClasses(type: string): string {
    const baseClasses = 'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform translate-x-full transition-all duration-300 p-4';

    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-green-400`;
      case 'error':
        return `${baseClasses} border-l-4 border-red-400`;
      case 'warning':
        return `${baseClasses} border-l-4 border-yellow-400`;
      case 'info':
      default:
        return `${baseClasses} border-l-4 border-blue-400`;
    }
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'success':
        return `
          <svg class="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `;
      case 'error':
        return `
          <svg class="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `;
      case 'warning':
        return `
          <svg class="h-6 w-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        `;
      case 'info':
      default:
        return `
          <svg class="h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `;
    }
  }

  private removeNotification(id: string) {
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.classList.add('transform', 'translate-x-full');
      setTimeout(() => {
        element.remove();
      }, 300);
    }
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}
