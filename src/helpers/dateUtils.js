import moment from "moment";

const getDateRange = (period, date) => {
  const baseDate = date ? moment(date) : moment();
  //console.log("date provided",date)
  const range = {
    week: [baseDate.clone().startOf("week"), baseDate.clone().endOf("week")],
    month: [baseDate.clone().startOf("month"), baseDate.clone().endOf("month")],
    year: [baseDate.clone().startOf("year"), baseDate.clone().endOf("year")],
    day: [baseDate.clone().startOf("day"), baseDate.clone().endOf("day")],
  }[period] || [baseDate.clone().startOf("day"), baseDate.clone().endOf("day")];

  return range;
};

export { getDateRange };
