import axios from "axios";
import { BaseResponse } from "./BaseResponse";

const SERVER_PUBLIC_URL = "http://localhost:5000"
export const Proxy = async (method, api, request, isUseToken = true) => {
  let result = new BaseResponse(false, "", null);
  // var cache = window.localStorage.getItem("@auth-provider");
  // var user = JSON.parse(cache);
  var user = {accessToken :"2yer6urvdhw72"}
  try {
    if (method.toLowerCase() === "get") {
      const config = {
        ...request,
        ...(isUseToken && {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        }),
      };
      
      const response = await axios.get(
        SERVER_PUBLIC_URL + api,
        config
      );
      result = response?.data;
    } else if (method.toLowerCase() === "post") {
      const config = {
        ...(isUseToken && {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        }),
      };
      const response = await axios.post(
        SERVER_PUBLIC_URL + api,
        request || {},
        config
      );
      result = response?.data;
    } else if (method.toLowerCase() === "put") {
      const config = {
        ...(isUseToken && {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        }),
      };
      const response = await axios.put(
        SERVER_PUBLIC_URL + api,
        request || {},
        config
      );
      result = response?.data;
    }
  } catch (err) {
    result.message = err;
  }
  return result;
};

export const ProxyWithFiles = async (api, request) => {
  let result = new BaseResponse(false, "", null);
  // var cache = window.localStorage.getItem("@auth-provider");
  // var user = JSON.parse(cache);
  var user = {accessToken :"2yer6urvdhw72"}
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${user?.accessToken}`,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    };
    const response = await axios.post(
      SERVER_PUBLIC_URL + api,
      request || {},
      config
    );
    result = response?.data;
  } catch (err) {
    result.message = err;
  }
  return result;
};
