/** @format */

import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../Pages/LoginPage";
import PrivateRoute from "./PrivateRoute";
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
    element: <Expenditure />,
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
