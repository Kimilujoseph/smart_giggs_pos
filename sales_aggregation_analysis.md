# Sales Aggregation Analysis

## Executive Summary

The sales aggregation in `src/services/sales-services.js` is inaccurate because it reuses data-fetching logic intended for filtered UI displays. This results in incorrect total sales figures, especially when filters are applied on the front end. In contrast, `src/services/financial-reporting-service.js` provides accurate data because it uses dedicated, unfiltered methods for financial aggregation.

## Root Cause Analysis

The discrepancy stems from two main issues in `src/services/sales-services.js` within the `_getHybridSalesData` function:

### 1. Incorrect Live Data Calculation

- **Problem:** `sales-services.js` uses the `SalesRepository.findSales` method to calculate live (today's) sales. This method is designed to display filtered lists of sales in a UI and incorrectly applies optional filters (e.g., `shopId`, `userId`) to the total sales aggregation.
- **Impact:** When a user filters the sales page, the total sales figure is also filtered, making it inaccurate.
- **Correct Implementation:** The `FinancialReportingRepository.getLiveSales` method demonstrates the correct approach. It performs a simple, unfiltered aggregation across the sales tables.

### 2. Incorrect Historical Data Calculation

- **Problem:** For historical data, `sales-services.js` uses `AnalyticsRepository.getSalesAnalytics`. This method has two flaws:
    1.  Like the live data method, it applies optional UI filters, skewing the total.
    2.  It aggregates the `totalRevenue` column without distinguishing between sales and returns (i.e., it doesn't filter out negative `totalRevenue` values).
- **Impact:** The historical data is inaccurate and under-reported because it sums both positive (sales) and negative (returns) revenues together.
- **Correct Implementation:** The `FinancialReportingRepository.getAggregatedAnalytics` method correctly filters for `totalRevenue > 0` to ensure only sales are summed, while returns are handled separately.

## Proposed Solution

To resolve this issue, `src/services/sales-services.js` must be refactored to use the same reliable, unfiltered aggregation logic found in `src/databases/repository/financial-reporting-repository.js` when calculating total sales figures.

The following changes are recommended:

1.  **Create a new repository method:** Create a new method in the `sales-repository.js` that mirrors the logic in `financial-reporting-repository.js` for fetching unfiltered, aggregated sales data.
2.  **Update `_getHybridSalesData`:** Modify the `_getHybridSalesData` function in `sales-services.js` to use this new repository method for calculating total sales. The existing `findSales` and `getSalesAnalytics` methods should only be used for fetching the paginated and filtered sales list for the UI.
3.  **Ensure separation of concerns:** The logic for calculating total financial figures should be separate from the logic for displaying filtered data.

By implementing these changes, the sales service will provide accurate and reliable sales data, consistent with the financial reporting service.
