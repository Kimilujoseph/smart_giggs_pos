# Backend Software Design Document (SDD)

## 1. Introduction

This document describes the backend architecture for the Captech Application, a comprehensive inventory management and sales system. The backend is designed to serve as a robust, scalable, and secure API for a frontend client, assumed to be built with React.js.

The system handles inventory tracking, sales processing, customer management, financial records, and performance analytics. The architecture emphasizes separation of concerns, data integrity, and performance.

## 2. System Overview

### 2.1. Core Technologies

- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** MySQL
- **Object-Relational Mapping (ORM):** Prisma
- **Authentication:** Session-based with `express-session` and a MySQL session store.
- **Dependencies:** `cors`, `morgan`, `cookie-parser`, `dotenv`, `node-cron` for scheduled tasks.

### 2.2. Architectural Pattern

The backend is built upon a classic **Layered Architecture**, also known as N-Tier architecture. This pattern separates the application into distinct logical layers, each with a specific responsibility. This separation of concerns makes the application modular, easier to maintain, and scalable.

The layers are organized as follows:

1.  **API/Routing Layer (Routes):** Defines the API endpoints and directs incoming requests to the appropriate controllers.
2.  **Controller Layer:** Acts as an intermediary between the API layer and the Service layer. It parses requests, calls business logic, and formats responses.
3.  **Service (Business Logic) Layer:** Contains the core business logic, orchestrating data and operations.
4.  **Data Access (Repository) Layer:** Encapsulates all interactions with the database, abstracting data persistence from the business logic.
5.  **Database Layer:** The underlying MySQL database, managed by the Prisma schema.

![Layered Architecture Diagram](https://i.imgur.com/r8s8y4E.png)

## 3. Request-Response Flow

A typical request from the client to the backend follows this sequence:

1.  An HTTP request arrives at the Express server.
2.  **Middleware Pipeline:** The request passes through a series of middleware:
    - `morgan`: Logs the incoming request details to the console.
    - `cors`: Validates the request origin against a whitelist.
    - `express.json`/`express.urlencoded`: Parses the request body.
    - `cookie-parser`: Parses cookies.
    - `express-session`: Hydrates the `req.session` object for state management.
3.  **Routing:** The request is passed to the API routing module (`/api/...`). The router matches the endpoint to a specific route definition.
4.  **Route-Specific Middleware:** The request may pass through more middleware specific to the route, such as:
    - `verifyUser`: Checks for a valid user session, ensuring the user is authenticated.
    - `checkRole`: Provides Role-Based Access Control (RBAC), ensuring the user has the necessary permissions (e.g., "manager").
    - `parseSalesQuery`: Validates and sanitizes query parameters for reports.
5.  **Controller:** The corresponding controller function is executed. It extracts data from the request (`req.body`, `req.params`, `req.user`) and calls the relevant service method.
6.  **Service:** The service method executes the core business logic. It may call multiple repository methods to interact with the database. For complex operations like making a sale, it wraps all database calls in a `prisma.$transaction` to ensure atomicity and data integrity.
7.  **Repository:** Repository methods execute the actual Prisma queries against the database (e.g., `prisma.mobilesales.create`, `prisma.dailySalesAnalytics.update`).
8.  **Response:** The data flows back through the layers. The service returns data to the controller, which then uses a utility (`handleResponse`) to format a standardized JSON response and sends it back to the client with an appropriate status code.
9.  **Error Handling:** If an error occurs at any stage, it is caught and passed via `next(err)` to a centralized `ErrorHandler` middleware, which formats and sends a standardized error response.

## 4. Component Breakdown

### 4.1. Application Entry Point (`src/index.js`)

- Initializes the Express app by calling `App(app)` from `express-app.js`.
- Starts the server and listens for incoming connections.
- **Scheduled Tasks:** Utilizes `node-cron` to schedule background jobs. Currently, it runs a `calculateAndStoreKPIs` job daily, demonstrating an understanding of the need for offline processing for performance.

### 4.2. Express Configuration (`src/express-app.js`)

- The core of the server setup.
- Configures all global middleware (CORS, body parsing, logging, session management).
- Mounts all the modular API routes from the `src/Api/routes` directory under the `/api` prefix.
- Implements a final, centralized error handling middleware.

### 4.3. API and Routing (`src/Api/routes/`)

- Routes are organized into modules by feature (e.g., `salesroutes.js`, `usermanagement-routes.js`).
- This layer is responsible for defining endpoints, HTTP methods, and attaching the necessary middleware for authentication, authorization, and validation before passing the request to a controller.

### 4.4. Controllers (`src/Api/controllers/`)

- Act as thin layers responsible for request orchestration.
- They do not contain business logic. Their role is to parse the request, call the appropriate service, and format the response.

### 4.5. Services (`src/services/`)

- This is the heart of the backend, where all business logic resides.
- Services orchestrate operations, enforce business rules, and manage transactions.
- They aggregate multiple repositories to perform complex tasks. For example, `sales-services.js` uses repositories for sales, inventory, customers, and analytics to process a single sale.

### 4.5.1. Service Layer In-Depth Analysis

The service layer is composed of several classes, each encapsulating the business logic for a specific domain. They act as orchestrators, coordinating multiple repository calls within transactions to ensure data integrity.

- **`salesmanagment` (sales-services.js)**
    - **Responsibility:** The most critical service in the application. It handles all aspects of sales processing and reporting.
    - **Key Methods:**
        - `createBulkSale`: A complex, transactional method that processes a batch of sales. It finds or creates a customer, validates inventory, records the sale, updates stock levels, creates payment records, and crucially, aggregates the sales data into the `DailySalesAnalytics` table for efficient reporting. This is the core transactional engine.
        - `_getHybridSalesData`: A sophisticated reporting method that combines pre-aggregated historical data from `DailySalesAnalytics` with live, real-time sales data from the current day to provide up-to-the-minute reports.
    - **Architectural Role:** Core transactional and reporting service. It demonstrates the focus on performance by handling the write-path for the analytics aggregation.

- **`userManagmentService` (usermanagement-controller-services.js)**
    - **Responsibility:** Manages all user-related operations, including authentication and profile management.
    - **Key Methods:**
        - `createSeller`/`createSuperUser`: Handles user registration, including password hashing.
        - `UserLogin`: Authenticates a user by validating their password, finds their assigned shop, and generates a JWT signature for the session.
        - `updateUserProfile`/`addprofilepicture`: Manages user profile modifications.
    - **Architectural Role:** The primary authentication and user identity service.

- **`distributionService` & `transferManagementService`**
    - **Responsibility:** These services manage the movement of stock between different locations (e.g., from the main warehouse to a specific shop, or between shops).
    - **Key Methods:**
        - `createBulkMobileDistribution`/`createBulkAccessoryDistribution`: Handles the initial distribution of new stock from a central point to shops.
        - `createNewMobileTransfer`/`createnewAccessoryTransfer`: Handles the transfer of existing stock between two shops.
        - `createReverseDistribution`: Manages the return of stock from a shop back to the warehouse.
    - **Architectural Role:** Central to inventory logistics and ensuring stock levels are accurate across different physical locations.

- **`AccessoryManagementService` & `MobilemanagementService`**
    - **Responsibility:** Provide CRUD (Create, Read, Update, Delete) operations for products (accessories and mobiles).
    - **Key Methods:**
        - `createNewAccessoryProduct`/`createnewPhoneproduct`: Adds new product definitions to the system.
        - `updateAccessoryStock`/`updatePhoneStock`: Modifies product details, such as cost, commission, or marking items as faulty.
        - `findSpecificAccessoryProduct`/`findAllAccessoryProduct`: Retrieves product information.
    - **Architectural Role:** Foundational inventory management services.

- **`AnalyticsService` & `KpiService`**
    - **Responsibility:** Read-only services dedicated to business intelligence and reporting.
    - **Key Methods:**
        - `getTopProductsAnalytics`/`getShopPerformanceSummary` (`AnalyticsService`): Queries the pre-aggregated `DailySalesAnalytics` table to provide high-level summaries.
        - `getSellerPerformance`/`getKpiAchievementReport` (`KpiService`): Retrieves calculated KPI data from the `SellerPerformanceKPI` table and compares it against targets.
    - **Architectural Role:** These services are critical for the application's reporting features and dashboards. They leverage the pre-computed data models to deliver fast responses without impacting transactional performance.

- **`FinancialReportingService`**
    - **Responsibility:** Generates high-level financial summaries, akin to a Profit & Loss statement.
    - **Key Methods:**
        - `generateFinancialSummary`: A complex method that combines aggregated sales and returns data with live data, and also fetches expenses, salaries, and commissions to calculate metrics like Net Revenue, Gross Profit, and Net Operating Income.
    - **Architectural Role:** A key business intelligence service that provides a financial overview of the entire operation.

- **`CommissionService` & `SalaryService`**
    - **Responsibility:** Manage financial disbursements to employees.
    - **Key Methods:**
        - `createCommissionPayment`/`createSalaryPayment`: Records a payment and, in the case of commissions, transactionally updates the `commissionPaid` status on the associated sales records.
        - `voidCommissionPayment`/`voidSalaryPayment`: Reverses a payment, also within a transaction to ensure data consistency.
    - **Architectural Role:** Core financial services for managing employee compensation.

- **Other Supporting Services:**
    - **`ShopmanagementService`:** Manages shop data and the assignment of sellers to shops.
    - **`CategoryManagementService`:** Manages product categories (e.g., smartphones, accessories).
    - **`CustomerService`:** Handles the creation and retrieval of customer data.
    - **`SupplierService` & `FinancerService`:** Provide simple CRUD operations for managing suppliers and third-party financers.
    - **`ReturnService`:** Manages the logic for processing customer returns.
    - **`pdfGenerator.js` & `mailservice.js`:** Utility services that are not class-based. `pdfGenerator` uses Puppeteer to create PDF reports from HTML, and `mailservice` sends emails via the Mailgun API.

### 4.6. Data Access Layer (`src/databases/repository/`)

- Implements the **Repository Pattern**.
- Each repository is responsible for data access for a specific domain model (e.g., `Sales`, `InventorymanagementRepository`).
- They abstract the Prisma queries away from the service layer, so services don't need to know about the underlying database implementation.

### 4.6.1. Data Access Layer In-Depth Analysis

The Data Access Layer is the application's interface to the MySQL database, powered exclusively by the Prisma ORM. It is well-structured, performant, and resilient.

#### 4.6.1.1. Database Connection and Client Management

The connection logic is robust and environment-aware, as seen in `client.js` and `connectionDB.js`.

- **Resilient Connection (`connectionDB.js`):** The application doesn't fail on a single connection attempt. It uses a `connectWithRetry` strategy, attempting to connect to the database up to 15 times with a 15-second delay between retries. This makes the application startup much more resilient to temporary database unavailability.
- **Efficient Client Instantiation (`client.js`):** The application uses a best-practice approach for managing the `PrismaClient`. In production, it uses a standard client. In development, it creates a global singleton instance. This prevents the creation of a new client on every hot-reload, which can quickly exhaust the database connection pool.

#### 4.6.1.2. The Repository Pattern

The application strictly adheres to the Repository Pattern. Each class in this directory is responsible for a specific domain (e.g., `ShopmanagementRepository`, `Sales`). Services call methods on these repositories (e.g., `shopRepository.findShop()`) instead of executing Prisma queries directly. This design choice offers several advantages:
- **Separation of Concerns:** Business logic (services) is decoupled from data persistence logic.
- **Maintainability:** Database queries for a specific domain are centralized in one place, making them easier to find, update, and optimize.
- **Testability:** Services can be tested with mock repositories, isolating them from the database.

#### 4.6.1.3. Key Repository Classes

- **`AnalyticsRepository`:** This is a highly-optimized, read-only repository. Its primary function is to query the pre-computed `DailySalesAnalytics` table. Methods like `getSalesAnalytics` and `getTopProducts` run aggregates on this summary table, making them extremely fast and preventing performance-intensive queries on the main transactional tables.

- **`ReturnRepository`:** This repository contains complex transactional logic. The `createReturn` method is a standout example: it wraps a multi-step process in a `prisma.$transaction`. This includes creating the return record, decrementing values on the original sale record, optionally restocking the item, and, most importantly, creating a *negative* entry in the `DailySalesAnalytics` table to ensure financial reports remain accurate. This is a sophisticated implementation of a business-critical process.

- **`Sales`:** This repository manages all sales-related data retrieval. Its `findSales` and `findUserSales` methods are powerful, generic functions that build dynamic Prisma `where` clauses based on filters (dates, shop, user, etc.) to fetch paginated lists of sales with their related data.

- **`usermanagemenRepository`:** Handles all database operations for the `actors` table. It manages creation (`createSeller`, `createMainAdmin`), finding users (`findUser`, `findUserById`), and updating user data, including assignments to shops.

- **`AccessoryInventoryRepository` & `phoneinventoryrepository`:** These repositories are responsible for the core CRUD operations of the inventory system. They create product stock records (`createAccessoryStock`, `createphoneStock`), maintain a log of changes (`createHistory`), and update stock details.

- **`CommissionRepository` & `SalaryRepository`:** These repositories manage financial data. They feature complex queries that join multiple tables to provide comprehensive payment reports, including details about the employee, the processor, and the specific sales a commission payment covers. Methods like `createCommissionPayment` and `voidCommissionPayment` are transactional to ensure financial integrity.

- **`ShopmanagementRepository`:** Manages shop data and, crucially, the inventory items *within* a shop. Methods like `findSpecificShopItem` and `getShopStockOverviewData` provide a shop-centric view of the inventory.

- **`QueryAnalyzer`:** This is not a standard repository but a powerful diagnostic tool. It wraps an operation and uses Prisma's event listener (`$on('query', ...)`) to intercept, time, and log every raw SQL query executed during that operation. This is invaluable for debugging performance bottlenecks.

#### 4.6.1.4. Legacy Mongoose Models

The `src/databases/models` directory contains several JavaScript files that define Mongoose schemas (e.g., `user.js`, `sales.js`). These are legacy artifacts. The application has fully transitioned to using Prisma as its ORM, and the database logic is now defined declaratively in `prisma/schema.prisma` and executed through the repository classes. The Mongoose model files are no longer in use and can be considered deprecated.

### 4.6. Data Access Layer (`src/databases/repository/`)

## 5. Database Architecture (`prisma/schema.prisma`)

The database schema is defined using Prisma and is comprehensive.

- **Data Models:** Includes extensive models for products, inventory, sales, customers, users (`actors`), shops, payments, commissions, and more.
- **Relational Integrity:** Clear and well-defined relationships between models enforce data consistency.
- **Inventory System:** A robust inventory model distinguishes between product definitions (`mobiles`, `accessories`) and physical stock (`mobileItems`, `accessoryItems`) located in specific shops.
- **Analytics & Performance:** The schema includes two key models for performance optimization:
    - `DailySalesAnalytics`: Stores pre-aggregated daily sales data. This is populated by the `createBulkSale` service method and allows for extremely fast reporting on historical data without querying the raw sales tables. The composite unique key (`@@unique([date, categoryId, ...])`) is crucial for the efficient upsert logic.
    - `SellerPerformanceKPI`: Stores pre-calculated KPIs for sellers, likely populated by the scheduled cron job. This offloads complex calculations from the request-response cycle.

## 6. Error Handling Strategy

The application employs a robust, centralized error handling strategy which is a best practice for modern Node.js applications. This approach ensures that all errors are handled gracefully, preventing the server from crashing and avoiding the leakage of sensitive stack traces to the client. The mechanism relies on custom error classes and a global error-handling middleware.

### 6.1. Custom Error Classes (`@src/Utils/app-error.js`)

A hierarchy of custom error classes is defined to create semantic, predictable errors throughout the application.

- **`AppError`:** A base class that extends the native JavaScript `Error` object.
- **`APIError`:** Inherits from `AppError` and serves as the base for all API-related errors.
- **Specific Error Classes:** A set of specific classes inherit from `APIError`, each mapping to a standard HTTP status code. This allows developers to throw errors with clear intent.
  - `ValidationError` (400 Bad Request)
  - `AuthenticationError` (401 Unauthorized)
  - `AuthorizationError` (403 Forbidden)
  - `NotFoundError` (404 Not Found)
  - `DuplicationError` (400 Bad Request)
  - `InternalServerError` (500 Internal Server Error)

When a foreseeable error occurs (e.g., a requested resource is not found), the code throws an instance of the appropriate class, like `throw new NotFoundError("Product not found")`.

### 6.2. Global Error Handler (`@src/Utils/error-handler.js`)

A single, global error-handling middleware, `ErrorHandler`, is the cornerstone of this strategy.

- **Centralized Logic:** It acts as a final catch-all for any errors that occur during the request-response cycle.
- **Error-Specific Responses:** The handler inspects the `name` property of the incoming error object. It contains specific `if` blocks to identify the custom error types (e.g., `NotFoundError`, `ValidationError`) and formats a standardized JSON response with the corresponding status code and message.
- **Fallback Mechanism:** If an error is not an instance of a recognized custom error class, it defaults to a generic "Internal Server Error" response with a 500 status code. This is a critical security measure to prevent exposing implementation details.
- **Logging:** Before sending a response, the handler logs the full error details (`name`, `message`, `stack`) to the console, ensuring that developers have the necessary information for debugging.

### 6.3. Integration (`@src/express-app.js`)

The `ErrorHandler` is registered as the **very last middleware** in the Express application stack (`app.use(ErrorHandler)`). This positioning is crucial, as it ensures that it will catch any errors passed from preceding routes and middleware by the `next(err)` function.

### 6.4. End-to-End Flow

1.  **Error Origin:** A service method or repository encounters an error (e.g., database query returns no result for a given ID).
2.  **Throw Specific Error:** It throws a semantic error: `throw new NotFoundError("User not found with that ID")`.
3.  **Catch and Forward:** The `try...catch` block within the controller function catches the error and forwards it to the Express error-handling mechanism by calling `next(err)`.
4.  **Middleware Processing:** Express passes the `err` object down the middleware chain, skipping regular middleware, until it reaches the registered `ErrorHandler`.
5.  **Response Generation:** The `ErrorHandler` inspects the error, sees that `err.name` is 'NotFoundError', enters the corresponding `if` block, and sends a formatted 404 response to the client: `{ "status": 404, "message": "User not found with that ID" }`.

## 7. Security

- **Authentication:** Handled via `express-session` with a persistent MySQL session store. All sensitive routes are protected by the `verifyUser` middleware.
- **Authorization:** Role-Based Access Control (RBAC) is implemented via the `checkRole` helper function, restricting access to certain endpoints based on user roles (e.g., "manager", "superuser").
- **CORS:** A strict CORS policy is in place, allowing requests only from a specific whitelist of frontend domains.
- **Error Handling:** Errors are not exposed directly to the user. A centralized error handler provides generic, safe error messages.

## 8. Conclusion

The backend architecture is mature, robust, and designed for scalability and maintainability. Its layered design, separation of concerns, and use of established patterns like the Repository Pattern are commendable. The most impressive feature is the clear focus on performance through the use of pre-computed analytics and KPI tables, which demonstrates a forward-thinking approach to handling a growing volume of data. This architecture provides a solid foundation for the Captech Application.
