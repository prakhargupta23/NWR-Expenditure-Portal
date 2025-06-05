import { RouterProvider } from "react-router-dom";
import { routes } from "./Routes/Routes";
import { GlobalStyles } from "@mui/material";

const globalScrollbarStyles = (
  <GlobalStyles
    styles={{
      // For Chrome, Safari, and Opera
      "::-webkit-scrollbar": {
        width: "12px", // Width of the vertical scrollbar
        height: "10px", // Height of the horizontal scrollbar
      },
      "::-webkit-scrollbar-track": {
        background: "#f0f0f0", // Track color
      },
      "::-webkit-scrollbar-thumb": {
        backgroundColor: "#9e9e9e", // Thumb color
        borderRadius: "20px", // Rounded corners for the thumb
        border: "2px solid #f0f0f0", // Creates a border around the thumb with the same color as the track
      },
      // For Firefox
      body: {
        scrollbarColor: "#9e9e9e #f0f0f0", // Thumb and track color
        scrollbarWidth: "thin", // Scrollbar width
      },
    }}
  />
);

function App() {
  return (
    <div>
      {globalScrollbarStyles}
      <RouterProvider router={routes} />
    </div>
  );
}

export default App;
