export function responseCreator(message: String, data: any) {
  let response = {
    result: "",
    data: null,
  };
  if (message == "success") {
    response.result = "success";
    response.data = data;
  } else {
    response.result = "failure";
    response.data = data;
  }
  console.log("@@response", response);
  return response;
}
