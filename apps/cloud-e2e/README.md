# 🧪 Cloud E2E Tests - Frontend Testing Suite

![Cypress](https://img.shields.io/badge/-cypress-%23E5E5E5?style=for-the-badge&logo=cypress&logoColor=058a5e)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)

End-to-End testing suite for the Cloud Angular frontend application using Cypress. This project provides comprehensive E2E tests to ensure the Comic Crawling & Management System's web interface works correctly across different user scenarios.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Test Architecture](#-test-architecture)
- [Setup & Installation](#-setup--installation)
- [Running Tests](#-running-tests)
- [Writing Tests](#-writing-tests)
- [Page Objects](#-page-objects)
- [Custom Commands](#-custom-commands)
- [CI/CD Integration](#-cicd-integration)
- [Best Practices](#-best-practices)

## 📝 Overview

The Cloud E2E project is a Cypress-based testing suite that validates the Angular frontend application's functionality from a user's perspective. It tests critical user journeys, UI interactions, and integration with the backend API.

### Test Scope

- **User Authentication**: Login/logout workflows
- **Comic Management**: Search, browse, and view comics
- **Image Viewing**: Comic reader functionality
- **API Integration**: Frontend-backend communication
- **Responsive Design**: Cross-device compatibility
- **Performance**: Page load times and rendering

## 🚀 Features

### Core Testing Capabilities

- **Cross-Browser Testing**: Chrome, Firefox, Edge support
- **Mobile Testing**: Responsive design validation
- **API Mocking**: Isolated frontend testing
- **Visual Testing**: Screenshot comparisons
- **Accessibility Testing**: WCAG compliance checks
- **Performance Testing**: Core Web Vitals monitoring

### Cypress Integration

- **Custom Commands**: Reusable test actions
- **Page Object Pattern**: Maintainable test structure
- **Fixtures**: Test data management
- **Plugins**: Extended functionality
- **Real-time Browser**: Live test execution

## 🏗️ Test Architecture

```
src/
├── e2e/                      # Test specifications
│   ├── app.cy.ts            # Main application tests
│   ├── comic-search.cy.ts   # Comic search functionality
│   ├── comic-reader.cy.ts   # Comic reading interface
│   ├── user-auth.cy.ts      # Authentication tests
│   └── navigation.cy.ts     # Navigation and routing
├── fixtures/                 # Test data files
│   ├── comics.json          # Sample comic data
│   ├── users.json           # Test user accounts
│   └── api-responses.json   # Mock API responses
├── support/                  # Helper functions and setup
│   ├── app.po.ts            # Page object definitions
│   ├── commands.ts          # Custom Cypress commands
│   ├── e2e.ts               # Global setup and imports
│   └── index.ts             # Entry point
└── cypress.config.ts         # Cypress configuration
```

## 📦 Setup & Installation

### Prerequisites

```bash
# Ensure the main Angular app is set up
nx serve cloud

# Install dependencies (handled by workspace root)
npm install
```

### Configuration

The E2E tests are configured in `cypress.config.ts`:

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    webServerCommands: {
      default: 'npx nx run cloud:serve',
      production: 'npx nx run cloud:serve-static'
    },
    supportFile: 'src/support/e2e.ts',
    specPattern: 'src/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: '../../dist/cypress/cloud-e2e/videos',
    screenshotsFolder: '../../dist/cypress/cloud-e2e/screenshots'
  }
});
```

## 🧪 Running Tests

### Development Mode

```bash
# Run tests in interactive mode
nx e2e cloud-e2e

# Open Cypress Test Runner
nx e2e cloud-e2e --watch

# Run specific test file
nx e2e cloud-e2e --spec="src/e2e/comic-search.cy.ts"
```

### Headless Mode

```bash
# Run all tests headlessly
nx e2e cloud-e2e --headless

# Run tests with specific browser
nx e2e cloud-e2e --browser chrome
nx e2e cloud-e2e --browser firefox

# Generate test reports
nx e2e cloud-e2e --reporter json --reporter-options "outputFile=reports/results.json"
```

### CI/CD Mode

```bash
# Production build testing
nx e2e cloud-e2e --configuration=production

# Parallel test execution
nx e2e cloud-e2e --parallel

# Record test results (with Cypress Dashboard)
nx e2e cloud-e2e --record --key=your-record-key
```

## ✍️ Writing Tests

### Basic Test Structure

```typescript
describe('Comic Search', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login('test@example.com', 'password');
  });

  it('should search for comics by title', () => {
    cy.get('[data-cy=search-input]')
      .type('One Piece');
    
    cy.get('[data-cy=search-button]')
      .click();
    
    cy.get('[data-cy=comic-results]')
      .should('be.visible')
      .and('contain', 'One Piece');
  });

  it('should filter search results', () => {
    cy.searchComics('naruto');
    cy.applyFilter('genre', 'action');
    
    cy.get('[data-cy=comic-card]')
      .should('have.length.greaterThan', 0)
      .first()
      .should('contain', 'Action');
  });
});
```

### API Testing Integration

```typescript
describe('API Integration', () => {
  it('should handle API errors gracefully', () => {
    // Mock API failure
    cy.intercept('GET', '/api/comics/search*', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('searchError');

    cy.searchComics('test');
    cy.wait('@searchError');
    
    cy.get('[data-cy=error-message]')
      .should('be.visible')
      .and('contain', 'Failed to load comics');
  });

  it('should cache search results', () => {
    cy.intercept('GET', '/api/comics/search*').as('searchAPI');
    
    cy.searchComics('one piece');
    cy.wait('@searchAPI');
    
    // Second search should use cache
    cy.searchComics('one piece');
    cy.get('@searchAPI.all').should('have.length', 1);
  });
});
```

## 📄 Page Objects

### Page Object Pattern Implementation

```typescript
// src/support/app.po.ts
export class ComicSearchPage {
  getSearchInput() {
    return cy.get('[data-cy=search-input]');
  }

  getSearchButton() {
    return cy.get('[data-cy=search-button]');
  }

  getComicResults() {
    return cy.get('[data-cy=comic-results]');
  }

  searchForComic(title: string) {
    this.getSearchInput().type(title);
    this.getSearchButton().click();
    return this;
  }

  selectFirstResult() {
    this.getComicResults()
      .find('[data-cy=comic-card]')
      .first()
      .click();
    return new ComicDetailPage();
  }
}

export class ComicDetailPage {
  getComicTitle() {
    return cy.get('[data-cy=comic-title]');
  }

  getChapterList() {
    return cy.get('[data-cy=chapter-list]');
  }

  openChapter(chapterNumber: number) {
    this.getChapterList()
      .find(`[data-cy=chapter-${chapterNumber}]`)
      .click();
    return new ComicReaderPage();
  }
}
```

### Using Page Objects

```typescript
import { ComicSearchPage } from '../support/app.po';

describe('Comic Navigation', () => {
  it('should navigate through comic chapters', () => {
    const searchPage = new ComicSearchPage();
    
    cy.visit('/');
    
    const detailPage = searchPage
      .searchForComic('One Piece')
      .selectFirstResult();
    
    detailPage
      .getComicTitle()
      .should('contain', 'One Piece');
    
    const readerPage = detailPage.openChapter(1);
    
    readerPage
      .getPageImage()
      .should('be.visible');
  });
});
```

## 🛠️ Custom Commands

### Authentication Commands

```typescript
// src/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      searchComics(query: string): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type(email);
    cy.get('[data-cy=password-input]').type(password);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('not.include', '/login');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]').click();
  cy.get('[data-cy=logout-button]').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('searchComics', (query: string) => {
  cy.get('[data-cy=search-input]').clear().type(query);
  cy.get('[data-cy=search-button]').click();
  cy.get('[data-cy=loading-indicator]').should('not.exist');
});
```

### Utility Commands

```typescript
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-cy=loading-spinner]').should('not.exist');
  cy.get('[data-cy=main-content]').should('be.visible');
});

Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

Cypress.Commands.add('mockComicsAPI', () => {
  cy.intercept('GET', '/api/comics/search*', {
    fixture: 'comics.json'
  }).as('searchComics');
  
  cy.intercept('GET', '/api/comics/*/chapters', {
    fixture: 'chapters.json'
  }).as('getChapters');
});
```

## 🔄 CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        browser: [chrome, firefox]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: nx build cloud --prod
      
      - name: Run E2E tests
        run: nx e2e cloud-e2e --browser ${{ matrix.browser }}
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
      
      - name: Upload test artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots-${{ matrix.browser }}
          path: dist/cypress/cloud-e2e/screenshots
```

### Test Reporting

```typescript
// cypress.config.ts - reporting configuration
export default defineConfig({
  e2e: {
    // ... other config
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'dist/cypress/cloud-e2e/reports',
      overwrite: false,
      html: true,
      json: true
    }
  }
});
```

## 📊 Test Data Management

### Fixtures

```json
// src/fixtures/comics.json
{
  "comics": [
    {
      "id": "1",
      "title": "One Piece",
      "author": "Eiichiro Oda",
      "genres": ["Adventure", "Comedy", "Drama"],
      "chapters": 1000,
      "status": "Ongoing",
      "thumbnail": "/images/one-piece-thumb.jpg"
    },
    {
      "id": "2", 
      "title": "Naruto",
      "author": "Masashi Kishimoto",
      "genres": ["Action", "Adventure", "Drama"],
      "chapters": 700,
      "status": "Completed",
      "thumbnail": "/images/naruto-thumb.jpg"
    }
  ]
}
```

### Environment Configuration

```typescript
// cypress.env.json
{
  "apiUrl": "http://localhost:3000",
  "testUser": {
    "email": "test@example.com",
    "password": "testpassword"
  },
  "retries": {
    "runMode": 2,
    "openMode": 0
  }
}
```

## 📋 Best Practices

### 1. Test Organization

```typescript
// Group related tests
describe('Comic Management', () => {
  context('Search Functionality', () => {
    it('should search by title');
    it('should search by author');
    it('should filter results');
  });
  
  context('Reading Interface', () => {
    it('should display comic pages');
    it('should navigate between chapters');
    it('should bookmark progress');
  });
});
```

### 2. Data Attributes

```html
<!-- Use data-cy attributes for test stability -->
<button data-cy="search-button" class="btn btn-primary">
  Search Comics
</button>

<div data-cy="comic-card" *ngFor="let comic of comics">
  <h3 data-cy="comic-title">{{ comic.title }}</h3>
</div>
```

### 3. Waiting Strategies

```typescript
// Wait for elements properly
cy.get('[data-cy=comic-list]').should('be.visible');

// Wait for API responses
cy.intercept('GET', '/api/comics*').as('loadComics');
cy.wait('@loadComics');

// Wait for animations
cy.get('[data-cy=modal]').should('have.class', 'fade-in-complete');
```

### 4. Error Handling

```typescript
// Test error scenarios
it('should handle network errors', () => {
  cy.intercept('GET', '/api/comics*', { networkError: true });
  
  cy.visit('/');
  cy.get('[data-cy=error-banner]')
    .should('be.visible')
    .and('contain', 'Network error');
});
```

### 5. Parallel Testing

```typescript
// Use test isolation
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.resetDatabase(); // Custom command
});

// Avoid test dependencies
it('should work independently', () => {
  // Each test should be self-contained
  cy.setupTestData();
  // ... test logic
});
```

## 🔍 Debugging Tests

### Debug Mode

```bash
# Run with debug output
DEBUG=cypress:* nx e2e cloud-e2e

# Run single test with browser open
nx e2e cloud-e2e --spec="src/e2e/app.cy.ts" --headed
```

### Screenshots and Videos

```typescript
// Take screenshots on failure
Cypress.on('test:after:run', (test, runnable) => {
  if (test.state === 'failed') {
    cy.screenshot(`failed-${test.title}`);
  }
});

// Custom screenshot
cy.screenshot('search-results-loaded');
```

---

This E2E testing suite ensures the Comic Crawling & Management System's frontend delivers a reliable and consistent user experience across all supported browsers and devices.
