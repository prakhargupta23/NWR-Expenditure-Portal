import { BehaviorSubject } from "rxjs";
import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";
export const userSubject: any = new BehaviorSubject(
  JSON.parse(localStorage.getItem("user")!)
);

/// Exporting all the function for the ab testing -----------------------/
export const userService = {
  login,
  getCredentials,

  get userValue() {
    return userSubject.value || JSON.parse(localStorage.getItem("user")!);
  },
};
// Function to fetch user data from localStorage

//// Funciton for creating new experiments ---------------------------/
async function login(username: string, password: string) {
  let response = await fetchWrapper.post(`${config.apiUrl}/api/login`, {
    username,
    password,
  });

  localStorage.setItem("user", JSON.stringify({ jwt: response.data.jwt }));
  let user = {
    jwt: response.data.jwt,
    username: username,
  };
  userSubject.next(user);
  return response;
}

async function getCredentials() {
  return fetchWrapper.get(`${config.apiUrl}/api/get-azure-cred`);
}
