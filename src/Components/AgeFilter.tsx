import React, { useState } from "react";
import { useDynamicQuery } from "../CustomHooks/CustomFetchHook";
import PieChartCompo from "../modules/PieChart";
import TrendChat from "../modules/TrendChat";

export default function AgeFilter({ type }: any) {
  console.log("this is type");

  console.log(type);

  // Example state for parameters
  let categoryType = type;

  const [selectedDate, setSelectedDate] = useState({
    month: "January",
    year: new Date().getFullYear(),
  });
  const [selectedTab, setSelectedTab] = useState("amount");
  const [selectedGraphTab, setSelectedGraphTab] = useState("Trend"); // State for active tab
  // Using the custom hook to fetch data dynamically
  const {
    data: pieData,

    uniqueCategories,
    loading,
    error,
  } = useDynamicQuery({
    categoryType,
    selectedDate,
    selectedTab,
  });

  return (
    <>
      {selectedGraphTab === "Overview" ? (
        <PieChartCompo
          // loadingData={loadingData}
          loading={loading}
          pieData={pieData.overview}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          summaryData={pieData.summaryData}
          uniqueCategories={uniqueCategories}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedGraphTab={selectedGraphTab}
          setSelectedGraphTab={setSelectedGraphTab}
        />
      ) : (
        <TrendChat
          loadingData={loading}
          trendData={pieData.trend}
          categoryType={categoryType}
          loading={loading}
          setSelectedTab={setSelectedTab}
          categories={uniqueCategories}
          selectedTab={selectedTab}
          selectedGraphTab={selectedGraphTab}
          setSelectedGraphTab={setSelectedGraphTab}
        />
      )}
    </>
  );
}
