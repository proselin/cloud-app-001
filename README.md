# 📚 Comic Crawling & Management System

<p align="center">
  <a href="https://nx.dev" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45" alt="Nx logo">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
</p>

<p align="center">
  <strong>A comprehensive multi-application Nx workspace for comic crawling, management, and reading.</strong>
</p>

<p align="center">
  <em>Web crawling • Modern UI • Cross-platform desktop • RESTful API</em>
</p>

---

## 🎯 Project Overview

A complete solution for comic enthusiasts combining web scraping technology with modern user interfaces. This system provides automated comic crawling from nettruyenrr.com, intelligent data management, and cross-platform access through web, desktop, and API interfaces.

## 🏗️ Project Structure

```
cloud-app-001/
├── apps/
│   ├── cloud/                    # Angular 19 Frontend (Web UI)
│   ├── cloud-e2e/                # E2E tests for Angular app
│   ├── humid/                    # NestJS 11 Backend API Server
│   ├── humid-e2e/                # E2E tests for NestJS API
│   └── platform/                 # Electron Desktop Application
├── libs/
│   └── shared/
│       └── back/
│           └── logger/            # Shared logging utilities
├── resources/
│   ├── config/                   # Configuration files
│   ├── db/                       # SQLite database
│   │   └── humid.db
│   └── images/                   # Crawled comic images
├── logs/                         # Application logs
└── package.json                  # Workspace dependencies
```

## 🚀 Applications Overview

### 📱 Cloud (Angular Frontend)

- **Technology**: Angular 19 with Ant Design (ng-zorro-antd)
- **Purpose**: Modern web interface for comic browsing and management
- **Features**:
  - Comic search and browsing
  - Image display with lazy loading
  - Responsive design with Ant Design components
  - IPC communication with Electron backend

### 🔧 Humid (NestJS Backend)

- **Technology**: NestJS 11 with TypeORM and SQLite
- **Purpose**: Core API server handling comic crawling and data management
- **Features**:
  - Web scraping from nettruyenrr.com
  - RESTful API with OpenAPI/Swagger documentation
  - Database management (Comic, Chapter, Image entities)
  - Image processing and storage
  - HTTP-based exception handling
  - Comprehensive logging with Winston

#### API Endpoints

**Comic Management**

- `GET /api/v1/comic` - List all comics
- `GET /api/v1/comic/suggest?q={query}` - Get comic suggestions for autocomplete
- `GET /api/v1/comic/:id` - Get comic details by ID

**Chapter Management**

- `GET /api/v1/chapter/:id` - Get chapter details
- `GET /api/v1/chapter/navigation/:comicId` - Get chapter navigation for a comic
- `GET /api/v1/chapter/by-comic/:comicId` - Get all chapters for a comic

**Crawling Operations**

- `POST /api/v1/crawl/by-url` - Crawl comic by URL

**Static File Serving**

- `GET /static/imgs/*` - Serve image files

### 🖥️ Platform (Electron Desktop)

- **Technology**: Electron with TypeScript
- **Purpose**: Cross-platform desktop application
- **Features**:
  - Native desktop experience
  - IPC bridge between frontend and backend
  - Background service management
  - Auto-updater support (ready for implementation)

## 🗄️ Database Schema

The system uses SQLite with TypeORM for data persistence:

### Entities

- **ComicEntity**: Core comic information (title, origin URL, chapter count, thumbnails)
- **ChapterEntity**: Individual comic chapters with position and crawl status
- **ImageEntity**: Image storage with file references and metadata

### Relationships

- Comic → Thumbnail (One-to-One with ImageEntity)
- Comic → Chapters (One-to-Many)
- Chapter → Images (One-to-Many)

## 🛠️ Technology Stack

| Component        | Technology                 | Version |
| ---------------- | -------------------------- | ------- |
| **Monorepo**     | Nx                         | 20.7.2  |
| **Frontend**     | Angular                    | 19.2.6  |
| **UI Library**   | Ant Design (ng-zorro-antd) | 19.2.2  |
| **Backend**      | NestJS                     | 11.0.17 |
| **Database**     | SQLite with TypeORM        | 0.3.21  |
| **Desktop**      | Electron                   | 33.4.9  |
| **Web Scraping** | Cheerio + Axios            | Latest  |
| **Logging**      | Winston + Pino             | Latest  |

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

```powershell
git clone <repository-url>
cd cloud-app-001
```

2. **Install dependencies**

```powershell
npm install
```

3. **Database Setup**
   The SQLite database is automatically created in `resources/db/humid.db`

### Development

1. **Start the backend server**

```powershell
npx nx serve humid
```

2. **Start the Angular frontend**

```powershell
npx nx serve cloud
```

3. **Run the Electron desktop app**

```powershell
npx nx serve platform
```

### Production Build

**Build all applications**

```powershell
npm run build
```

**Build specific application**

```powershell
npx nx build cloud     # Angular app
npx nx build humid     # NestJS API
npx nx build platform  # Electron app
```

## 🔧 Configuration

### Environment Variables

- Development/production configurations in respective `environment.ts` files
- Database path: `resources/db/humid.db`
- Image storage: `resources/images/`
- Logs: `logs/Humid/`

### API Documentation

When running the humid backend, Swagger documentation is available at:

```
http://localhost:<port>/api
```

## 🎯 Comic Crawling Workflow

1. **Input**: Provide a nettruyenrr.com comic URL
2. **Extraction**: Parse comic metadata (title, chapters, images)
3. **Storage**: Save comic information to SQLite database
4. **Image Download**: Crawl and store comic images locally
5. **API Access**: Serve comic data through RESTful endpoints

### Supported Sites

- **nettruyenrr.com**: Full crawling support with chapter and image extraction

## 🧪 Testing

**Run E2E tests**

```powershell
npx nx e2e cloud-e2e     # Frontend E2E tests
npx nx e2e humid-e2e     # Backend E2E tests
```

**Run unit tests**

```powershell
npx nx test cloud        # Angular unit tests
npx nx test humid        # NestJS unit tests
npx nx test platform     # Electron unit tests
```

## 📝 Logging

The system implements comprehensive logging:

- **Backend**: Winston with daily rotate files
- **Frontend**: Console logging with error notifications
- **Electron**: Process logging for main and renderer
- **Log Location**: `logs/Humid/dev-combined.log`

## 🔄 IPC Communication

The Electron app uses IPC for communication between processes:

- **Comic Search**: `ipc/humid/comic-search`
- **Comic Crawling**: `ipc/humid/pull-comic`
- **Image Retrieval**: `ipc/humid/get-image`

## 🎨 UI Features

- Modern Material Design with Ant Design components
- Responsive grid layout for comic browsing
- Image lazy loading and optimization
- Search functionality with real-time suggestions
- Error handling with user-friendly notifications

## 📦 Deployment

The workspace is configured for multiple deployment scenarios:

- **Web**: Angular build for web hosting
- **Desktop**: Electron packaging for Windows, macOS, Linux
- **API**: NestJS build for server deployment

---

## 🔗 Nx Workspace Commands

**Visualize project dependencies**

```powershell
npx nx graph
```

**Show available targets for a project**

```powershell
npx nx show project cloud
```

**Run multiple targets**

```powershell
npx nx run-many -t build -p humid cloud platform
```

For more Nx commands and capabilities, visit the [Nx documentation](https://nx.dev).

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
