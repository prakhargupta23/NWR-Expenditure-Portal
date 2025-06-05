import React, { useState } from "react";
import { useDynamicQuery } from "../CustomHooks/CustomFetchHook";
import PieChartCompo from "../modules/PieChart";
import TrendChat from "../modules/TrendChat";

export default function Basic({ type, reloadGraph }: any) {
  console.log("basic is called");

  // Example state for parameters
  let categoryType = type;

  const [selectedDate, setSelectedDate] = useState({
    month: "January",
    year: new Date().getFullYear(),
  });
  const [selectedTab, setSelectedTab] = useState("amount");
  const [selectedGraphTab, setSelectedGraphTab] = useState("Overview"); // State for active tab
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
    reloadGraph,
    selectedGraphTab,
  });
  console.log("this is data");

  console.log(pieData);

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
          dataDownload={true}
        />
      ) : (
        <TrendChat
          loadingData={loading}
          trendData={pieData.trend}
          categoryType={categoryType}
          categories={uniqueCategories}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          loading={loading}
          selectedGraphTab={selectedGraphTab}
          setSelectedGraphTab={setSelectedGraphTab}
        />
      )}
    </>
  );
}
