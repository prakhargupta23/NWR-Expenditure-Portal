/** @format */

import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../Pages/LoginPage";
import PrivateRoute from "./PrivateRoute";
import Expenditure from "../Pages/Expenditure"

export const routes = createBrowserRouter([
  {
    path: "/Expenditure",
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
