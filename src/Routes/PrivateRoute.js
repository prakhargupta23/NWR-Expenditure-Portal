import React, { useContext } from "react";

import { Navigate, useLocation } from "react-router-dom";
import { userService } from "../services/user.service";

const PrivateRoute = ({ children }) => {
  console.log("privateroute is called");

  const location = useLocation();
  const user = userService.userValue;
  console.log(user);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace></Navigate>;
  } else {
    return children;
  }
};

export default PrivateRoute;
