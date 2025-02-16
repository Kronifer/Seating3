import { createHash } from "crypto";

export function register(
  name: string,
  username: string,
  pwd: string,
  email: string,
) {
  const hash = createHash("sha512");
  var ret = { invalid: false, incorrectFields: <string[]>[] };

  hash.update(pwd);
  fetch("/api/users/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      email: email,
      name: name,
      pwd: hash.digest("hex"),
    }),
  })
    .then((resp) =>
      resp.json().then((data) => ({ status: resp.status, json: data })),
    )
    .then((r) => {
      if (r.status === 409) {
        ret.invalid = true;
      }
      if (ret.invalid === true && r.json.msg.includes("username")) {
        ret.incorrectFields.push("username");
      }
      if (ret.invalid === true && r.json.msg.includes("email")) {
        ret.incorrectFields.push("username");
      }
    });

  return ret;
}
