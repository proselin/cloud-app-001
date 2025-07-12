# 📱 Cloud - Angular Frontend

[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-0170FE?style=for-the-badge&logo=ant-design&logoColor=white)](https://ng.ant.design/)

**Modern web interface for comic browsing and management**

## 📝 Overview

Cloud is a modern Angular 19 frontend application that provides an intuitive web interface for comic browsing, searching, and management. Built with standalone components and Ant Design, it offers a responsive and performant user experience with seamless integration to the Humid backend API.

## 🚀 Features

### Core Functionality

- **Comic Browsing**: Grid-based comic library with pagination
- **Advanced Search**: Real-time search with autocomplete suggestions
- **Image Optimization**: Lazy loading and caching for optimal performance
- **Responsive Design**: Mobile-first approach with Ant Design components
- **Error Handling**: User-friendly error notifications and recovery
- **PWA Ready**: Progressive Web App capabilities

### User Experience

- **Modern UI**: Material Design principles with Ant Design
- **Fast Navigation**: Client-side routing with lazy loading
- **Real-time Updates**: Live search and filtering
- **Accessibility**: WCAG 2.1 AA compliance
- **Dark/Light Mode**: Theme switching support

## 🏗️ Architecture

```text
src/
├── app/
│   ├── components/           # Reusable UI components
│   │   ├── comic-card/       # Comic display card
│   │   ├── search-bar/       # Search component
│   │   └── image-viewer/     # Image display component
│   ├── pages/                # Route components
│   │   ├── home/             # Main comic library
│   │   ├── comic-detail/     # Comic details page
│   │   └── search/           # Search results page
│   ├── services/             # Business logic services
│   │   ├── search.service.ts # Search functionality
│   │   └── cache.service.ts  # Caching strategy
│   ├── guards/               # Route guards
│   ├── interceptors/         # HTTP interceptors
│   └── models/               # TypeScript interfaces
└── main.ts                   # Application bootstrap
```

## 🛠️ Technology Stack

| Component       | Technology             | Version  | Purpose                  |
| --------------- | ---------------------- | -------- | ------------------------ |
| **Framework**   | Angular                | 19.2.6   | Frontend framework       |
| **UI Library**  | Tailwind CSS           | 3.4.17   | Utility-first CSS        |
| **Language**    | TypeScript             | Latest   | Type-safe development    |
| **Styling**     | SCSS + Tailwind        | Latest   | Advanced styling         |
| **HTTP Client** | Angular HTTP           | Built-in | API communication        |
| **Router**      | Angular Router         | Built-in | Client-side routing      |
| **Forms**       | Angular Reactive Forms | Built-in | Form management          |
| **Testing**     | Jest + Testing Library | Latest   | Unit & integration tests |

## 📱 Component Architecture

### Standalone Components

All components are built using Angular's standalone component architecture for better tree-shaking and modularity:

```typescript
@Component({
  selector: 'app-comic-card',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzImageModule],
  template: `
    <nz-card [nzCover]="coverTemplate" [nzActions]="[actionSetting]">
      <nz-card-meta [nzTitle]="comic.title" [nzDescription]="comic.description"> </nz-card-meta>
    </nz-card>
  `,
})
export class ComicCardComponent {
  @Input() comic!: Comic;
  @Output() comicSelect = new EventEmitter<Comic>();
}
```

### Key Components

#### ComicCardComponent

- **Purpose**: Display comic information in card format
- **Features**: Lazy image loading, action buttons, hover effects
- **Inputs**: Comic data object
- **Outputs**: Click events for navigation

#### SearchBarComponent

- **Purpose**: Provide search functionality with autocomplete
- **Features**: Debounced input, suggestion dropdown, recent searches
- **Integration**: Real-time API calls to Humid backend

#### ImageViewerComponent

- **Purpose**: Display comic images with zoom and navigation
- **Features**: Pinch-to-zoom, keyboard navigation, fullscreen mode
- **Performance**: Virtual scrolling for large image sets

## 🔌 API Integration

### Comic Service

```typescript
@Injectable({
  providedIn: 'root',
})
export class ComicService extends CommonService{
  private readonly apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  getComics(params?: ComicSearchParams): Observable<ComicResponse> {
    return this.httpClient.get<ComicResponse>(`${this.env.apiUrl}/comic`, { params });
  }

  getComicById(id: number): Observable<Comic> {
    return this.httpClient.get<Comic>(`${this.env.apiUrl}/comic/${id}`);
  }

  searchComics(query: string): Observable<Comic[]> {
    return this.httpClient.get<Comic[]>(`${this.env.apiUrl}/comic/suggest`, {
      params: { q: query },
    });
  }
}
```

### HTTP Interceptors

#### AuthInterceptor

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return next.handle(authReq);
  }
}
```

#### ErrorInterceptor

```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notification: NzNotificationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.notification.error('Error', error.message);
        return throwError(() => error);
      })
    );
  }
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Angular CLI (optional)

### Installation

1. **Navigate to the cloud directory:**

```bash
cd apps/cloud
```

2. **Install dependencies** (from workspace root):

```bash
npm install
```

### Development

1. **Start the development server:**

```bash
npx nx serve cloud
```

The application will be available at `http://localhost:4200`

2. **Start with API proxy:**

```bash
npx nx serve cloud --configuration=development
```

This uses the proxy configuration in `proxy.conf.json` to forward API calls to the Humid backend.

3. **Build for production:**

```bash
npx nx build cloud --configuration=production
```

### Proxy Configuration

The application includes proxy configuration for development:

```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

## 🎨 UI/UX Design

### Design System

The application follows a consistent design system based on Ant Design:

#### Color Palette

```scss
// Primary colors
$primary-color: #1890ff;
$success-color: #52c41a;
$warning-color: #faad14;
$error-color: #f5222d;

// Neutral colors
$text-color: rgba(0, 0, 0, 0.85);
$text-color-secondary: rgba(0, 0, 0, 0.45);
$background-color: #f0f2f5;
```

#### Typography

```scss
// Font family
$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

// Font sizes
$font-size-base: 14px;
$font-size-lg: 16px;
$font-size-sm: 12px;

// Line heights
$line-height-base: 1.5715;
```

### Responsive Design

The application uses a mobile-first approach with breakpoints:

```scss
// Breakpoints
$screen-xs: 480px;
$screen-sm: 576px;
$screen-md: 768px;
$screen-lg: 992px;
$screen-xl: 1200px;
$screen-xxl: 1600px;
```

### Theme Configuration

```scss
// styles.scss
@use './styles/index';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./apps/cloud/src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## 🧪 Testing

### Test Structure

```text
src/
├── app/
│   ├── components/
│   │   ├── comic-card/
│   │   │   ├── comic-card.component.ts
│   │   │   └── comic-card.component.spec.ts
│   │   └── search-bar/
│   │       ├── search-bar.component.ts
│   │       └── search-bar.component.spec.ts
│   ├── services/
│   │   ├── comic.service.ts
│   │   └── comic.service.spec.ts
│   └── pages/
│       ├── home/
│       │   ├── home.component.ts
│       │   └── home.component.spec.ts
│       └── comic-detail/
│           ├── comic-detail.component.ts
│           └── comic-detail.component.spec.ts
```

### Running Tests

**Unit tests:**

```bash
npx nx test cloud
```

**Test with coverage:**

```bash
npx nx test cloud --configuration=ci
```

**Watch mode:**

```bash
npx nx test cloud --watch
```

### Test Examples

#### Component Testing

```typescript
describe('ComicCardComponent', () => {
  let component: ComicCardComponent;
  let fixture: ComponentFixture<ComicCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComicCardComponent, NzCardModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ComicCardComponent);
    component = fixture.componentInstance;
  });

  it('should display comic title', () => {
    component.comic = { id: 1, title: 'Test Comic' };
    fixture.detectChanges();

    const titleElement = fixture.debugElement.query(By.css('.ant-card-meta-title'));
    expect(titleElement.nativeElement.textContent).toBe('Test Comic');
  });
});
```

#### Service Testing

```typescript
describe('ComicService', () => {
  let service: ComicService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ComicService],
    });
    service = TestBed.inject(ComicService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch comics', () => {
    const mockComics = [{ id: 1, title: 'Test Comic' }];

    service.getComics().subscribe((comics) => {
      expect(comics).toEqual(mockComics);
    });

    const req = httpMock.expectOne('/api/v1/comic');
    expect(req.request.method).toBe('GET');
    req.flush(mockComics);
  });
});
```

## 📊 Performance Optimization

### Lazy Loading

```typescript
// Route configuration with lazy loading
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'comic/:id',
    loadComponent: () => import('./pages/comic-detail/comic-detail.component').then((m) => m.ComicDetailComponent),
  },
];
```

### OnPush Change Detection

```typescript
@Component({
  selector: 'app-comic-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-comic-card *ngFor="let comic of comics$ | async; trackBy: trackByComicId" [comic]="comic"> </app-comic-card> `,
})
export class ComicListComponent {
  comics$ = this.comicService.getComics();

  trackByComicId(index: number, comic: Comic): number {
    return comic.id;
  }
}
```

### Virtual Scrolling

```typescript
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="200" class="comic-viewport">
      <app-comic-card *cdkVirtualFor="let comic of comics" [comic]="comic"> </app-comic-card>
    </cdk-virtual-scroll-viewport>
  `,
})
export class VirtualComicListComponent {
  comics = this.comicService.getAllComics();
}
```

## 🔒 Security

### Content Security Policy

```typescript
// CSP headers for production
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'http://localhost:3000'],
};
```

### Input Sanitization

```typescript
@Component({
  template: ` <div [innerHTML]="sanitizedContent"></div> `,
})
export class SafeContentComponent {
  constructor(private sanitizer: DomSanitizer) {}

  get sanitizedContent() {
    return this.sanitizer.sanitize(SecurityContext.HTML, this.rawContent);
  }
}
```

## 🚀 Deployment

### Production Build

```bash
npx nx build cloud --configuration=production
```

Build artifacts will be stored in `dist/apps/cloud/`

### Static Hosting

The application can be deployed to any static hosting service:

```bash
# Deploy to Netlify
npx netlify deploy --prod --dir=dist/apps/cloud/browser

# Deploy to Vercel
npx vercel --prod dist/apps/cloud/browser

# Deploy to Firebase Hosting
npx firebase deploy --only hosting
```

### Docker Deployment

```dockerfile
FROM nginx:alpine
COPY dist/apps/cloud/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Configuration

```typescript
// environment
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  enableDevTools: true,
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourserver.com/api/v1',
  enableDevTools: false,
};
```

## 📱 PWA Features

### Service Worker

```typescript
// app.config.ts
import { isDevMode } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000',
      })
    ),
  ],
};
```

### Offline Support

```typescript
@Injectable()
export class OfflineService {
  constructor(private swUpdate: SwUpdate) {
    if (swUpdate.isEnabled) {
      swUpdate.available.subscribe(() => {
        if (confirm('New version available. Load?')) {
          window.location.reload();
        }
      });
    }
  }
}
```

## 🔗 Integration with Electron

### IPC Communication

```typescript
// electron.service.ts
@Injectable()
export class ElectronService {
  private readonly ipcRenderer: typeof ipcRenderer;

  constructor() {
    if (this.isElectron) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  searchComics(query: string): Promise<Comic[]> {
    return this.ipcRenderer.invoke('ipc/humid/comic-search', query);
  }

  crawlComic(url: string): Promise<void> {
    return this.ipcRenderer.invoke('ipc/humid/pull-comic', url);
  }
}
```

## 🔗 Related Projects

- [Humid (NestJS Backend)](../humid/README.md)
- [Logger (Shared Library)](../../libs/shared/back/logger/README.md)

## 🤝 Contributing

1. **Component Development**: Follow Angular style guide and use standalone components
2. **Testing**: Write unit tests for all components and services
3. **Accessibility**: Ensure WCAG 2.1 AA compliance
4. **Performance**: Use OnPush change detection and lazy loading

## 📚 Resources

- [Angular Documentation](https://angular.io)
- [Ant Design for Angular](https://ng.ant.design/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Angular Performance Guide](https://angular.io/guide/performance-checklist)

---

**Part of the Comic Crawling & Management System monorepo**
