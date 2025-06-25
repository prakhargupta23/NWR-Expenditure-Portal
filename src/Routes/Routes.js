/** @format */

import { createBrowserRouter } from "react-router-dom";

import DemoPage from "../Pages/DemoPage";
import LoginPage from "../Pages/LoginPage";
import PrivateRoute from "./PrivateRoute";
// import PFAPage from "../Pages/PFAPage";
import Expenditure from "../Pages/Expenditure"

export const routes = createBrowserRouter([
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Expenditure />
      </PrivateRoute>
    ),
  },
  {
    path: "/*",
    element: <LoginPage />,
  },
  // {
  //   path: "/pfa",
  //   element: (
  //     <PrivateRoute>
  //       <PFAPage />
  //     </PrivateRoute>
  //   ),
  // },
]);
