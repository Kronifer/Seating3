"use client";
import { createHash } from "crypto";

export interface Name {
  first: string;
  last: string;
}

export interface User {
  name?: Name;
  username?: string;
  email?: string;
}

export function register(
  name: Name,
  username: string,
  pwd: string,
  email: string,
) {
  const hash = createHash("sha512");

  hash.update(pwd);

  return fetch("/api/users/create", {
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
      var ret = { invalid: false, incorrectFields: <string[]>[] };

      if (r.status === 409) {
        ret.invalid = true;
      }
      if (ret.invalid === true && r.json.msg.includes("username")) {
        ret.incorrectFields.push("username");
      }
      if (ret.invalid === true && r.json.msg.includes("email")) {
        ret.incorrectFields.push("username");
      }

      return ret;
    });
}

interface TableEntry{
  x: number
  y: number
  size: number
}

export async function createEvent(eventName: string, tableEntries: object, eventDate: number, meals:object, rsvpBy: number){ //tableEntries:{"x":0, "y":0, "size":5} meals:{"salmon":5, "cheese":1}
    const create_event = await fetch("/api/events/create", {
      method:"POST",
      headers: {
        "Content-Type":"application/json",
      },
      body:JSON.stringify({
        "name":eventName,
        "date":eventDate,
        "rsvpBy": rsvpBy
      })
    })

    const eventJson = await create_event.json();

    if ((eventJson['status']) != 'success') 
      return eventJson;

    const event_id = eventJson['eventId'] //?

    const arrange_event = await fetch("/api/events/arrange", {
      method:"POST",
      headers: {
        "Content-Type":"application/json",
      },
      body: JSON.stringify({
        "eventId":event_id,
        "tableEntries":tableEntries
      })
    })

    if (((await arrange_event.json())['status']) != 'success') 
      return (await arrange_event.json());

    const set_meals = await fetch("/api/events/meals/options", {
        method:"POST",
        headers: {
          "Content-Type":"application/json",
        },
        body: JSON.stringify({
          "eventId":event_id,
          "meals":meals
        })
    })

    if (((await set_meals.json())['status']) != 'success') 
      return (await set_meals.json());

    
}

export function verifyEmail(email: string, code: string) {
  return fetch("/api/users/verifyemail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      code: code,
    }),
  })
    .then((resp) =>
      resp.json().then((data) => ({ status: resp.status, json: data })),
    )
    .then((r) => {
      var ret = { invalid: false, reason: <string | null>null };

      if (r.status === 401) {
        ret.invalid = true;
        ret.reason = "Code is invalid or expired.";
      }

      return ret;
    });
}

export function login(username: string, pwd: string) {
  const hash = createHash("sha512");

  hash.update(pwd);

  return fetch("/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      pwd: hash.digest("hex"),
    }),
  })
    .then((resp) =>
      resp.json().then((data) => ({ status: resp.status, json: data })),
    )
    .then((r) => {
      var ret = {
        invalid: false,
        reason: <string | null>null,
        token: <string | null>null,
        expiry: <EpochTimeStamp | null>null,
        email: <string | null>null,
      };

      if (r.status === 401) {
        ret.invalid = true;
        if (r.json.msg.includes("verified")) {
          ret.reason = "verify";
          ret.email = r.json.email;
        } else {
          ret.reason = "invalid";
        }
      } else {
        ret.token = r.json.token;
        ret.expiry = r.json.expires_at;
      }

      return ret;
    });
}

export function tokenRefresh() {
  const timestamp = parseInt(localStorage.getItem("expireAt")!);
  let token = localStorage.getItem("token");

  if (Number.isNaN(timestamp) || token === null || token!.trim() === "") {
    return;
  }

  if (timestamp - 600 <= Date.now() / 1000) {
    fetch("/api/users/renewtoken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token")!,
      },
    }).then((resp) => {
      if (resp.status == 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("expireAt");
      } else {
        localStorage.setItem("expireAt", (Date.now() / 1000 + 3600).toString());
      }
    });
  }
}

export function forgotUsername(email: string) {
  return fetch("/api/users/forgotusername", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
    }),
  }).then((resp) => {
    if (resp.status === 200) {
      return true;
    } else {
      return false;
    }
  });
}

export function sendPasswordResetCode(email: string) {
  return fetch("/api/users/resetpassword", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
    }),
  })
    .then((resp) =>
      resp.json().then((data) => ({ status: resp.status, json: data })),
    )
    .then((r) => {
      if (r.status === 200) {
        return true;
      } else {
        return false;
      }
    });
}

export function passwordReset(email: string, code: string, pwd: string) {
  const hash = createHash("sha512");

  hash.update(pwd);

  return fetch("/api/users/resetpassword", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      code: code,
      pwd: hash.digest("hex"),
    }),
  })
    .then((resp) =>
      resp.json().then((data) => ({ status: resp.status, json: data })),
    )
    .then((r) => {
      if (r.status === 200) {
        return true;
      } else {
        return false;
      }
    });
}

export function validateCode(email: string, code: string, scope: string) {
  return fetch("/api/users/validatecode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      code: code,
      scope: scope,
    }),
  }).then((resp) => {
    if (resp.status === 200) {
      return true;
    } else {
      return false;
    }
  });
}

export function getUser() {
  if (
    localStorage.getItem("token") == null ||
    parseInt(localStorage.getItem("expireBy")!) < Date.now() / 1000
  ) {
    tokenRefresh();

    return;
  }

  return fetch("/api/users/getuser", {
    method: "GET",
    headers: {
      Authorization: localStorage.getItem("token")!,
    },
  }).then((resp) => {
    return resp.json().then((data) => {
      return data;
    });
  });
}

export function updateUser(user: User) {
  if (
    localStorage.getItem("token") == null ||
    parseInt(localStorage.getItem("expireBy")!) < Date.now() / 1000
  ) {
    tokenRefresh();

    return;
  }

  return fetch("/api/users/updateuser", {
    method: "POST",
    headers: {
      Authorization: localStorage.getItem("token")!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  }).then((resp) => {
    if (resp.status == 200) {
      return true;
    } else {
      return false;
    }
  });
}
