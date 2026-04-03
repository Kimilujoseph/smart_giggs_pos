import { getDateRange } from "../helpers/dateUtils.js";
import { APIError } from "../Utils/app-error.js";

const parseDateQuery = (req, res, next) => {
  try {
    const {
      date,
      period,
      startDate: queryStartDate,
      endDate: queryEndDate,
    } = req.query;
    req.dateQuery = {};

    if (queryStartDate && queryEndDate) {
      req.dateQuery.startDate = new Date(queryStartDate);
      req.dateQuery.endDate = new Date(queryEndDate);
    } else if (period || date) {
      const effectivePeriod = date ? "day" : period;
      const [startDate, endDate] = getDateRange(effectivePeriod, date).map(
        (m) => m.toDate()
      );
      req.dateQuery.startDate = startDate;
      req.dateQuery.endDate = endDate;
    }

    next();
  } catch (error) {
    next(
      new APIError(
        "Invalid date query parameters.",
        400,
        "The date query parameters provided are invalid."
      )
    );
  }
};

const parseSalesQuery = (req, res, next) => {
  try {
    const {
      page,
      limit,
      date,
      period,
      startDate: queryStartDate,
      endDate: queryEndDate,
    } = req.query;

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    req.salesQuery = {
      page: !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1,
      limit:
        !isNaN(parsedLimit) && parsedLimit > 0
          ? Math.min(100, parsedLimit)
          : 10,
    };

    if (queryStartDate && queryEndDate) {
      req.salesQuery.startDate = new Date(queryStartDate);
      req.salesQuery.endDate = new Date(queryEndDate);
    } else {
      req.salesQuery.period = date ? "day" : period || "week";
      const [startDate, endDate] = getDateRange(
        req.salesQuery.period,
        date
      ).map((m) => m.toDate());
      req.salesQuery.startDate = startDate;
      req.salesQuery.endDate = endDate;
    }

    next();
  } catch (error) {
    // Forwarding the error to the global error handler
    next(
      new APIError(
        "Invalid query parameters.",
        400,
        "The query parameters provided are invalid."
      )
    );
  }
};

export { parseSalesQuery, parseDateQuery };
