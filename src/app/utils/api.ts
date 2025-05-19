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

function getToken() {
  if (
    localStorage.getItem("token") == null ||
    parseInt(localStorage.getItem("expireAt")!) < Date.now() / 1000
  ) {
    tokenRefresh();

    return;
  }

  return localStorage.getItem("token")!;
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

interface TableEntry {
  x: number;
  y: number;
  size: number;
}

export async function createEvent(
  eventName: string,
  tableEntries: object,
  eventDate: number,
  meals: object,
  rsvpBy: number,
) {
  //tableEntries:{"x":0, "y":0, "size":5} meals:{"salmon":5, "cheese":1}
  var token = getToken();

  if (token == undefined) {
    return;
  }
  const create_event = await fetch("/api/events/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      name: eventName,
      date: eventDate,
      rsvpBy: rsvpBy,
    }),
  });

  const eventJson = await create_event.json();

  if (eventJson["status"] != "success") return false;

  const event_id = eventJson["eventId"]; //?

  const arrange_event = await fetch("/api/events/arrange", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      eventId: event_id,
      tableEntries: tableEntries,
    }),
  });

  if ((await arrange_event.json())["status"] != "success") return false;

  const set_meals = await fetch("/api/events/meals/options", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      eventId: event_id,
      meals: meals,
    }),
  });

  if ((await set_meals.json())["status"] != "success") return false;

  return true;
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
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/users/getuser", {
    method: "GET",
    headers: {
      Authorization: token,
    },
  }).then((resp) => {
    return resp.json().then((data) => {
      return data;
    });
  });
}

export function updateUser(user: User) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/users/updateuser", {
    method: "POST",
    headers: {
      Authorization: token,
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

export function getEvents() {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/my_events", {
    headers: {
      Authorization: token,
    },
  })
    .then((resp) => {
      return resp.json().then((data) => ({ status: resp.status, json: data }));
    })
    .then((r) => {
      if (r.status == 200) {
        return r.json;
      } else {
        return { status: "error", msg: "API Error" };
      }
    });
}

export function deleteEvent(eventId: string) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/delete", {
    method: "DELETE",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId: eventId,
    }),
  }).then((resp) => {
    if (resp.status == 200) {
      return true;
    } else {
      return false;
    }
  });
}

export function deleteBooking(eventId: string) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/delete_booking", {
    method: "DELETE",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId: eventId,
    }),
  }).then((resp) => {
    if (resp.status == 200) {
      return true;
    } else {
      return false;
    }
  });
}

export function getJoinedEvents() {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/joined_events", {
    headers: {
      Authorization: token,
    },
  })
    .then((resp) => {
      return resp.json().then((data) => ({ status: resp.status, json: data }));
    })
    .then((r) => {
      if (r.status == 200) {
        return r.json;
      } else {
        return { status: "error", msg: "API Error" };
      }
    });
}

export function getEventInfo(eventId: string) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/get?eventId=" + eventId, {
    method: "GET",
  }).then((resp) => {
    return resp.json().then((data) => ({ status: resp.status, json: data }));
  });
}

export function joinEvent(eventId: string) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/register", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId: eventId,
    }),
  }).then((resp) => {
    if (resp.status == 200) {
      return true;
    } else {
      return false;
    }
  });
}

export function getTablesBooking(eventId: string) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/seats/state?eventId=" + eventId, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  }).then((resp) => {
    return resp.json().then((data) => ({ status: resp.status, json: data }));
  });
}

export function getMealsBooking(eventId: string) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/meals/available?eventId=" + eventId, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  }).then((resp) => {
    return resp.json().then((data) => ({ status: resp.status, json: data }));
  });
}

export function reserveSeats(
  eventId: string,
  tableId: number,
  partySize: number,
) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/seats/reserve", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId: eventId,
      tableIndex: tableId,
      partySize: partySize,
    }),
  }).then((resp) => {
    if (resp.status == 201) {
      return true;
    } else {
      return false;
    }
  });
}

export function reserveMeals(eventId: string, meals: any, notes: string) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/meals/select", {
    method: "PATCH",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId: eventId,
      meals: meals,
      notes: notes,
    }),
  }).then((resp) => {
    if (resp.status == 201) {
      return true;
    } else {
      return false;
    }
  });
}

export function exportEvent(eventId: string) {
  var token = getToken();

  if (token == undefined) {
    return;
  }

  return fetch("/api/events/export_raw", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId: eventId,
    }),
  }).then((resp) => {
    return resp.text().then((data) => ({ status: resp.status, data: data }));
  });
}
