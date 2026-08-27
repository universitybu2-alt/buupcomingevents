const session = require("express-session");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const MONGO_URL = process.env.MONGO_URL;
const User = require("./models/Users");
const Event = require("./models/Event");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
//security
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
// MongoDB connection
async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("MongoDB connection successful");
}
main().catch((err) => {
  console.log("MongoDB connection error:", err);
});

// EJS
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("login.ejs");
});
//sign upppp
app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});
app.post("/signup", async (req, res) => {
  try {
    const data = {
      email: req.body.username,
      password: req.body.password
    };
    const existUser = await User.findOne({
      email: data.email
    });
if (existUser) {
  return res.send(`
    <h2 style="color: #f51414; text-align: start;">
      User already exists. Please log in.
    </h2>
  `);
}
    const userdata = await User.create(data);
    res.redirect("/");
  } catch (err) {
    console.log("Signup error:", err);
    res.status(500).send("Signup failed");
  }
});
//login user
app.post("/login", async (req, res) => {
  try {
    const check = await User.findOne({
      email: req.body.username
    });
if (!check) {
  return res.send(`
    <h2 style="color: #ec2913; text-align: start;">
      User not found Please sign up to get upcoming events.
    </h2>
  `);
}
if (req.body.password !== check.password) {
  return res.send(`
    <div style="text-align: start; font-family: Arial, sans-serif;">
      <h2 style="color: #e00909;">
        Wrong password. Please try again.
      </h2>
    </div>
  `);
}
    // User is logged in
    req.session.userId = check._id;
    return res.redirect("/home");
  } catch (err) {
    return res.status(500).send("Error");
  }
});
//
function isLoggedIn(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  return res.redirect("/");
}
function eventAuth(req, res, next) {
  if (req.session.canCreateEvent) {
    return next();
  }
  return res.redirect("/event-login");
}

//GET ALL EVENTS
app.get("/home", isLoggedIn, async (req, res) => {
  try {
    const eventdetails = await Event.find();
    res.render("home.ejs", { eventdetails });
  } catch (err) {
    res.status(500).send("Failed to load events");
  }
});
// EVENT LOGIN
app.get("/event-login", isLoggedIn, (req, res) => {
  res.render("eventlogin.ejs");
});
app.post("/event-login", isLoggedIn, (req, res) => {
  const { email, password } = req.body;
  if (email !== process.env.EVENT_EMAIL) {
    return res.send("Invalid email");
  }
  if (password !== process.env.EVENT_PASSWORD) {
    return res.send("Invalid password");
  }
  req.session.canCreateEvent = true;
  return res.redirect("/newevent");
});
///crete new event
app.get("/newevent", isLoggedIn, eventAuth, (req, res) => {
  res.render("newevent.ejs");
});
app.post("/newevent", isLoggedIn, eventAuth, async (req, res) => {
  try {
    const details = {
      event_name: req.body.eventname,
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      venue: req.body.venue,
      organizer: req.body.organizer,
      participants: []
    };
    await Event.create(details);
    res.redirect("/home");
  } catch (err) {
    console.log("Event error:", err);
    res.status(500).send("Event creation failed");
  }
});
//create participate 
app.get("/event/:id/participate", isLoggedIn, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send("Event not found");
    }
    res.render("participate.ejs", { event });
  } catch (err) {
    res.status(500).send("Error loading event");
  }
});
//post request
app.post("/event/:id/participate", isLoggedIn, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send("Event not found");
    }
    event.participants.push({
      name: req.body.name,
      dept: req.body.dept,
      branch: req.body.branch,
      curr_year: req.body.curr_year
    });
    await event.save();
    res.redirect("/home");
  } catch (err) {
    console.log("Participation error:", err);
    res.status(500).send("Participation failed");
  }
});
app.get("/event/:id/participants", isLoggedIn, async (req, res) => {

    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).send("Event not found");
        }
        res.render("participants.ejs", { event });
    } catch (err) {
        console.log("Participants error:", err);
        res.status(500).send("Failed to load participants");

    }
});
// DELETE EVENT
app.post("/event/:id/delete", isLoggedIn, eventAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).send("Event not found");
    }

    await Event.findByIdAndDelete(req.params.id);

    res.redirect("/home");

  } catch (err) {
    console.log("Delete event error:", err);
    res.status(500).send("Failed to delete event");
  }
});
//EDITTT EVENT
app.get("/event/:id/edit", isLoggedIn, eventAuth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).send("Event not found");
        }

        res.render("editEvent", { event });

    } catch (err) {
        console.log("Edit event error:", err);
        res.status(500).send("Failed to load event");
    }
});
app.post("/event/:id/edit", isLoggedIn, eventAuth, async (req, res) => {
    try {
        const {
            event_name,
            description,
            date,
            time,
            venue,
            organizer
        } = req.body;
        await Event.findByIdAndUpdate(req.params.id, {
            event_name,
            description,
            date,
            time,
            venue,
            organizer
        });

        res.redirect("/home");

    } catch (err) {

        console.log("Update event error:", err);

        res.status(500).send("Failed to update event");

    }
});
// logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Could not log out');
        }

        res.redirect('/');
    });
});
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running");
});